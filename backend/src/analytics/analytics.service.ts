import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { IntentAnalysisService } from './services/intent-analysis.service';
import { SchemaContextService } from './services/schema-context.service';
import { SqlGenerationService } from './services/sql-generation.service';
import { SqlSecurityValidationService, SqlSecurityException } from './services/sql-security-validation.service';
import { SqlSelfCorrectionService } from './services/sql-self-correction.service';
import { BusinessSummaryService } from './services/business-summary.service';
import { QueryRequestDto } from './dto/query-request.dto';
import { QueryResponseDto } from './dto/query-response.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly intentService: IntentAnalysisService,
    private readonly schemaService: SchemaContextService,
    private readonly sqlGenService: SqlGenerationService,
    private readonly securityValidator: SqlSecurityValidationService,
    private readonly selfCorrectionService: SqlSelfCorrectionService,
    private readonly summaryService: BusinessSummaryService,
  ) {}

  /**
   * Main Text-to-SQL Analytics Pipeline:
   * Prompt -> Intent -> Schema -> SQL Gen -> AST Security Validation -> Execution (Self-Correction) -> Slicing -> AI Summary
   */
  async processQuery(dto: QueryRequestDto): Promise<QueryResponseDto> {
    const prompt = dto.prompt.trim();
    this.logger.log(`Processing analytical query: "${prompt}"`);

    // 1. Intent Analysis & Injection Defense
    const intent = this.intentService.analyze(prompt);
    if (!intent.isSafe) {
      return {
        status: 'rejected',
        prompt,
        intent,
        sql: '-- Query rejected: Adversarial or destructive pattern detected',
        data: [],
        columns: [],
        rowCount: 0,
        executionDurationMs: 0,
        summary: `Request blocked by DataPulse AI Security Guard: ${intent.securityNotes || 'Destructive or injection keywords detected.'}`,
        keyInsights: ['Execution rejected by determinist server-side intent analyzer.'],
        chartConfig: { suitable: false, type: 'none', title: 'Query Blocked', series: [] },
        kpis: [],
        security: {
          astValidated: false,
          statementType: 'BLOCKED',
          tablesAccessed: [],
          functionsUsed: [],
          readOnlyEnforced: true,
          hasLimitClause: false,
          enforcedLimit: 0,
          executionTimeoutMs: 5000,
          auditNotes: [intent.securityNotes || 'Destructive SQL instruction blocked.'],
        },
        mode: 'secure_sandbox',
        roleUsed: 'datapulse_security_guard',
        errorMessage: intent.securityNotes,
      };
    }

    // 2. SQL Generation
    let rawSql: string;
    try {
      rawSql = await this.sqlGenService.generateSql(prompt, intent);
    } catch (genErr) {
      this.logger.error(`SQL Generation failed: ${(genErr as Error).message}`);
      throw new BadRequestException(`Failed to synthesize query from prompt: ${(genErr as Error).message}`);
    }

    // 3. Structural AST Security Validation
    let validationResult;
    try {
      validationResult = this.securityValidator.validate(rawSql);
    } catch (secErr) {
      const err = secErr as SqlSecurityException;
      this.logger.warn(`Generated SQL rejected by AST Security Validator: ${err.message}`);
      return {
        status: 'rejected',
        prompt,
        intent,
        sql: rawSql,
        data: [],
        columns: [],
        rowCount: 0,
        executionDurationMs: 0,
        summary: `Query rejected by AST Security Engine: ${err.message}`,
        keyInsights: [
          `Security violation: ${err.message}`,
          'AI-generated SQL attempted to execute unapproved syntax or access restricted resources.',
        ],
        chartConfig: { suitable: false, type: 'none', title: 'Security Rejection', series: [] },
        kpis: [],
        security: {
          astValidated: false,
          statementType: 'REJECTED',
          tablesAccessed: [],
          functionsUsed: [],
          readOnlyEnforced: true,
          hasLimitClause: false,
          enforcedLimit: 0,
          executionTimeoutMs: 5000,
          auditNotes: [`AST validation failure (${err.code}): ${err.message}`],
        },
        mode: 'secure_sandbox',
        roleUsed: 'datapulse_security_guard',
        errorMessage: err.message,
      };
    }

    // 4. Safe Database Execution with Controlled Self-Correction
    let executionResult;
    let retriesCount = 0;
    try {
      const correctionResult = await this.selfCorrectionService.executeWithSelfCorrection(
        prompt,
        intent,
        validationResult,
      );
      executionResult = correctionResult.execution;
      validationResult = correctionResult.validation;
      retriesCount = correctionResult.retriesAttempted;
    } catch (execErr) {
      this.logger.error(`Database execution failed: ${(execErr as Error).message}`);
      return {
        status: 'error',
        prompt,
        intent,
        sql: validationResult.sanitizedSql,
        data: [],
        columns: [],
        rowCount: 0,
        executionDurationMs: 0,
        summary: `Database query execution error: ${(execErr as Error).message}`,
        keyInsights: ['The query passed AST validation but encountered a runtime database execution error.'],
        chartConfig: { suitable: false, type: 'none', title: 'Execution Error', series: [] },
        kpis: [],
        security: {
          astValidated: true,
          statementType: validationResult.statementType,
          tablesAccessed: validationResult.tablesAccessed,
          functionsUsed: validationResult.functionsUsed,
          readOnlyEnforced: true,
          hasLimitClause: validationResult.hasLimitClause,
          enforcedLimit: validationResult.enforcedLimit,
          executionTimeoutMs: 5000,
          auditNotes: validationResult.auditNotes,
        },
        mode: 'secure_sandbox',
        roleUsed: 'error_handler',
        retriesAttempted: retriesCount,
        errorMessage: (execErr as Error).message,
      };
    }

    // 5. Context Slicing & AI Business Summary
    const summaryResponse = await this.summaryService.generateSummary(
      prompt,
      intent,
      executionResult.rows,
      executionResult.columns,
    );

    return {
      status: 'success',
      prompt,
      intent,
      sql: validationResult.sanitizedSql,
      data: executionResult.rows,
      columns: executionResult.columns,
      rowCount: executionResult.rowCount,
      executionDurationMs: executionResult.durationMs,
      summary: summaryResponse.summary,
      keyInsights: summaryResponse.keyInsights,
      chartConfig: summaryResponse.chartConfig,
      kpis: summaryResponse.kpis,
      security: {
        astValidated: true,
        statementType: validationResult.statementType,
        tablesAccessed: validationResult.tablesAccessed,
        functionsUsed: validationResult.functionsUsed,
        readOnlyEnforced: true,
        hasLimitClause: validationResult.hasLimitClause,
        enforcedLimit: validationResult.enforcedLimit,
        executionTimeoutMs: 5000,
        auditNotes: validationResult.auditNotes,
      },
      mode: executionResult.mode,
      roleUsed: executionResult.roleUsed,
      retriesAttempted: retriesCount,
    };
  }

  getSchema() {
    return this.schemaService.getSchemaMetadata();
  }
}
