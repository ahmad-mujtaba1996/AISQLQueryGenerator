"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SqlSecurityValidationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlSecurityValidationService = exports.SqlSecurityException = void 0;
const common_1 = require("@nestjs/common");
const pgsql_ast_parser_1 = require("pgsql-ast-parser");
class SqlSecurityException extends Error {
    message;
    code;
    constructor(message, code) {
        super(message);
        this.message = message;
        this.code = code;
        this.name = 'SqlSecurityException';
    }
}
exports.SqlSecurityException = SqlSecurityException;
let SqlSecurityValidationService = SqlSecurityValidationService_1 = class SqlSecurityValidationService {
    logger = new common_1.Logger(SqlSecurityValidationService_1.name);
    allowedTables = new Set(['users', 'products', 'orders']);
    allowedFunctions = new Set([
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
    MAX_LIMIT = 500;
    DEFAULT_LIMIT = 100;
    MAX_JOINS = 5;
    validate(rawSql) {
        if (!rawSql || typeof rawSql !== 'string') {
            throw new SqlSecurityException('Empty or non-string SQL provided.', 'SYNTAX_ERROR');
        }
        const trimmed = rawSql.trim();
        const cleanedSql = trimmed.replace(/;+\s*$/, '');
        let statements;
        try {
            statements = (0, pgsql_ast_parser_1.parse)(cleanedSql);
        }
        catch (parseError) {
            this.logger.warn(`SQL parsing failure: ${parseError.message}`);
            throw new SqlSecurityException(`SQL failed structural AST parsing: ${parseError.message}`, 'SYNTAX_ERROR');
        }
        if (!statements || statements.length === 0) {
            throw new SqlSecurityException('No valid SQL statement found.', 'SYNTAX_ERROR');
        }
        if (statements.length > 1) {
            this.logger.warn(`Multiple SQL statements rejected (${statements.length} detected).`);
            throw new SqlSecurityException('Multiple SQL statements detected. Batch or multi-query execution is strictly forbidden.', 'MULTIPLE_STATEMENTS');
        }
        const statement = statements[0];
        if (statement.type !== 'select') {
            this.logger.warn(`Forbidden statement type attempted: ${statement.type}`);
            throw new SqlSecurityException(`Forbidden statement type '${statement.type}'. Only read-only SELECT queries are authorized.`, 'WRITE_OPERATION_BLOCKED');
        }
        const selectStmt = statement;
        const auditNotes = ['Structural AST successfully parsed as single SELECT statement.'];
        const tablesReferenced = [];
        const functionsCalled = [];
        const cteAliases = new Set();
        let joinCount = 0;
        const visitor = (0, pgsql_ast_parser_1.astVisitor)((v) => ({
            tableRef: (t) => {
                const tblName = t.name.toLowerCase();
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
        const uniqueTables = Array.from(new Set(tablesReferenced));
        for (const tbl of uniqueTables) {
            const normalizedTbl = tbl.includes('.') ? tbl.split('.').pop() : tbl;
            if (!this.allowedTables.has(normalizedTbl)) {
                this.logger.warn(`Unauthorized table access blocked: ${tbl}`);
                throw new SqlSecurityException(`Access to table '${tbl}' is unauthorized. Only approved analytics tables (users, products, orders) can be queried.`, 'UNAUTHORIZED_TABLE');
            }
        }
        auditNotes.push(`Verified access restricted to approved tables: [${uniqueTables.join(', ')}].`);
        const uniqueFunctions = Array.from(new Set(functionsCalled));
        for (const fn of uniqueFunctions) {
            if (!this.allowedFunctions.has(fn)) {
                this.logger.warn(`Unapproved SQL function blocked: ${fn}`);
                throw new SqlSecurityException(`Execution of unapproved function '${fn}()' is rejected by security policy.`, 'DANGEROUS_FUNCTION_BLOCKED');
            }
        }
        if (uniqueFunctions.length > 0) {
            auditNotes.push(`Verified functions against security whitelist: [${uniqueFunctions.join(', ')}].`);
        }
        const stmtAny = selectStmt;
        if (stmtAny.from && Array.isArray(stmtAny.from)) {
            for (const f of stmtAny.from) {
                if ('join' in f && f.join) {
                    joinCount++;
                }
            }
        }
        if (joinCount > this.MAX_JOINS) {
            throw new SqlSecurityException(`Query complexity exceeded: ${joinCount} joins detected (maximum allowed: ${this.MAX_JOINS}).`, 'QUERY_COMPLEXITY_EXCEEDED');
        }
        let enforcedLimit = this.DEFAULT_LIMIT;
        let hasLimit = false;
        if (stmtAny.limit) {
            hasLimit = true;
            if (stmtAny.limit.limit && stmtAny.limit.limit.type === 'integer') {
                const specifiedLimit = stmtAny.limit.limit.value;
                if (specifiedLimit > this.MAX_LIMIT) {
                    enforcedLimit = this.MAX_LIMIT;
                    auditNotes.push(`User limit (${specifiedLimit}) clamped to maximum safe limit (${this.MAX_LIMIT}).`);
                }
                else {
                    enforcedLimit = specifiedLimit;
                    auditNotes.push(`Preserving requested limit of ${enforcedLimit} rows.`);
                }
            }
        }
        else {
            auditNotes.push(`No LIMIT clause detected in AST. Enforcing default safe limit of ${enforcedLimit} rows.`);
        }
        let finalSql = cleanedSql;
        if (!hasLimit) {
            finalSql = `${cleanedSql} LIMIT ${this.DEFAULT_LIMIT}`;
        }
        else if (enforcedLimit === this.MAX_LIMIT && cleanedSql.includes('LIMIT')) {
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
};
exports.SqlSecurityValidationService = SqlSecurityValidationService;
exports.SqlSecurityValidationService = SqlSecurityValidationService = SqlSecurityValidationService_1 = __decorate([
    (0, common_1.Injectable)()
], SqlSecurityValidationService);
//# sourceMappingURL=sql-security-validation.service.js.map