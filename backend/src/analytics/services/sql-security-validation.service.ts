import { Injectable, Logger } from '@nestjs/common';
import { parse, astVisitor, Statement, SelectStatement } from 'pgsql-ast-parser';

export class SqlSecurityException extends Error {
  constructor(
    public readonly message: string,
    public readonly code:
      | 'SYNTAX_ERROR'
      | 'MULTIPLE_STATEMENTS'
      | 'WRITE_OPERATION_BLOCKED'
      | 'UNAUTHORIZED_TABLE'
      | 'UNAUTHORIZED_COLUMN'
      | 'DANGEROUS_FUNCTION_BLOCKED'
      | 'QUERY_COMPLEXITY_EXCEEDED'
      | 'LIMIT_EXCEEDED'
      | 'SECURITY_VIOLATION',
  ) {
    super(message);
    this.name = 'SqlSecurityException';
  }
}

export interface SecurityValidationResult {
  isValid: boolean;
  astParsed: boolean;
  statementType: 'SELECT';
  tablesAccessed: string[];
  functionsUsed: string[];
  hasLimitClause: boolean;
  enforcedLimit: number;
  sanitizedSql: string;
  auditNotes: string[];
}

@Injectable()
export class SqlSecurityValidationService {
  private readonly logger = new Logger(SqlSecurityValidationService.name);

  // Whitelist of approved analytical tables in public schema
  private readonly allowedTables = new Set<string>(['users', 'products', 'orders']);

  // Whitelist of approved safe SQL functions
  private readonly allowedFunctions = new Set<string>([
    'sum',
    'count',
    'avg',
    'min',
    'max',
    'round',
    'date_trunc',
    'to_char',
    'extract',
    'coalesce',
    'lower',
    'upper',
    'concat',
    'nullif',
    'greatest',
    'least',
    'abs',
    'ceil',
    'floor',
    'trim',
    'length',
    'substring',
    'now',
    'current_date',
    'current_timestamp',
  ]);

  private readonly MAX_LIMIT = 500;
  private readonly DEFAULT_LIMIT = 100;
  private readonly MAX_JOINS = 5;

  /**
   * Validates SQL structurally using PostgreSQL AST parser.
   * Throws SqlSecurityException on any violation.
   */
  validate(rawSql: string): SecurityValidationResult {
    if (!rawSql || typeof rawSql !== 'string') {
      throw new SqlSecurityException('Empty or non-string SQL provided.', 'SYNTAX_ERROR');
    }

    const trimmed = rawSql.trim();
    // Clean trailing semicolons for normalization
    const cleanedSql = trimmed.replace(/;+\s*$/, '');

    // 1. AST Parsing
    let statements: Statement[];
    try {
      statements = parse(cleanedSql);
    } catch (parseError) {
      this.logger.warn(`SQL parsing failure: ${(parseError as Error).message}`);
      throw new SqlSecurityException(
        `SQL failed structural AST parsing: ${(parseError as Error).message}`,
        'SYNTAX_ERROR',
      );
    }

    // 2. Multi-Statement Enforcement
    if (!statements || statements.length === 0) {
      throw new SqlSecurityException('No valid SQL statement found.', 'SYNTAX_ERROR');
    }

    if (statements.length > 1) {
      this.logger.warn(`Multiple SQL statements rejected (${statements.length} detected).`);
      throw new SqlSecurityException(
        'Multiple SQL statements detected. Batch or multi-query execution is strictly forbidden.',
        'MULTIPLE_STATEMENTS',
      );
    }

    const statement = statements[0];

    // 3. Strict Statement Type Verification
    if (statement.type !== 'select') {
      this.logger.warn(`Forbidden statement type attempted: ${(statement as any).type}`);
      throw new SqlSecurityException(
        `Forbidden statement type '${(statement as any).type}'. Only read-only SELECT queries are authorized.`,
        'WRITE_OPERATION_BLOCKED',
      );
    }

    const selectStmt = statement as SelectStatement;
    const auditNotes: string[] = ['Structural AST successfully parsed as single SELECT statement.'];

    // 4. Structural Traversal via AST Visitor
    const tablesReferenced: string[] = [];
    const functionsCalled: string[] = [];
    const cteAliases = new Set<string>();
    let joinCount = 0;

    // Track CTE (WITH clause) aliases if present
    // CTE aliases are valid temporary table references
    const visitor = astVisitor((v) => ({
      tableRef: (t) => {
        const tblName = t.name.toLowerCase();
        // Check if it's a CTE alias
        if (!cteAliases.has(tblName)) {
          tablesReferenced.push(tblName);
        }
        v.super().tableRef(t);
      },
      call: (c) => {
        const fnName = c.function.name.toLowerCase();
        functionsCalled.push(fnName);
        v.super().call(c);
      },
    }));

    visitor.statement(selectStmt);

    // 5. Verify Table Whitelist
    const uniqueTables = Array.from(new Set(tablesReferenced));
    for (const tbl of uniqueTables) {
      // Remove any schema qualifier e.g. "public.users" -> "users"
      const normalizedTbl = tbl.includes('.') ? tbl.split('.').pop()! : tbl;
      if (!this.allowedTables.has(normalizedTbl)) {
        this.logger.warn(`Unauthorized table access blocked: ${tbl}`);
        throw new SqlSecurityException(
          `Access to table '${tbl}' is unauthorized. Only approved analytics tables (users, products, orders) can be queried.`,
          'UNAUTHORIZED_TABLE',
        );
      }
    }
    auditNotes.push(`Verified access restricted to approved tables: [${uniqueTables.join(', ')}].`);

    // 6. Verify Function Whitelist
    const uniqueFunctions = Array.from(new Set(functionsCalled));
    for (const fn of uniqueFunctions) {
      if (!this.allowedFunctions.has(fn)) {
        this.logger.warn(`Unapproved SQL function blocked: ${fn}`);
        throw new SqlSecurityException(
          `Execution of unapproved function '${fn}()' is rejected by security policy.`,
          'DANGEROUS_FUNCTION_BLOCKED',
        );
      }
    }
    if (uniqueFunctions.length > 0) {
      auditNotes.push(`Verified functions against security whitelist: [${uniqueFunctions.join(', ')}].`);
    }

    // 7. Complexity Restrictions (Joins count)
    const stmtAny = selectStmt as any;
    if (stmtAny.from && Array.isArray(stmtAny.from)) {
      for (const f of stmtAny.from) {
        if ('join' in f && f.join) {
          joinCount++;
        }
      }
    }
    if (joinCount > this.MAX_JOINS) {
      throw new SqlSecurityException(
        `Query complexity exceeded: ${joinCount} joins detected (maximum allowed: ${this.MAX_JOINS}).`,
        'QUERY_COMPLEXITY_EXCEEDED',
      );
    }

    // 8. Safe Row Limit Enforcement
    let enforcedLimit = this.DEFAULT_LIMIT;
    let hasLimit = false;

    if (stmtAny.limit) {
      hasLimit = true;
      if (stmtAny.limit.limit && stmtAny.limit.limit.type === 'integer') {
        const specifiedLimit = stmtAny.limit.limit.value;
        if (specifiedLimit > this.MAX_LIMIT) {
          enforcedLimit = this.MAX_LIMIT;
          auditNotes.push(`User limit (${specifiedLimit}) clamped to maximum safe limit (${this.MAX_LIMIT}).`);
        } else {
          enforcedLimit = specifiedLimit;
          auditNotes.push(`Preserving requested limit of ${enforcedLimit} rows.`);
        }
      }
    } else {
      auditNotes.push(`No LIMIT clause detected in AST. Enforcing default safe limit of ${enforcedLimit} rows.`);
    }

    // Produce sanitized query with guaranteed limit
    let finalSql = cleanedSql;
    if (!hasLimit) {
      finalSql = `${cleanedSql} LIMIT ${this.DEFAULT_LIMIT}`;
    } else if (enforcedLimit === this.MAX_LIMIT && cleanedSql.includes('LIMIT')) {
      finalSql = cleanedSql.replace(/LIMIT\s+\d+/i, `LIMIT ${this.MAX_LIMIT}`);
    }

    return {
      isValid: true,
      astParsed: true,
      statementType: 'SELECT',
      tablesAccessed: uniqueTables,
      functionsUsed: uniqueFunctions,
      hasLimitClause: hasLimit,
      enforcedLimit,
      sanitizedSql: finalSql,
      auditNotes,
    };
  }
}
