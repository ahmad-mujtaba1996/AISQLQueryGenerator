import { Injectable, Logger } from '@nestjs/common';
import { SqlGenerationService } from './sql-generation.service';
import { SqlSecurityValidationService, SecurityValidationResult } from './sql-security-validation.service';
import { SqlExecutionService, ExecutionResult, SqlExecutionException } from './sql-execution.service';
import { AnalyzedIntent } from './intent-analysis.service';

export interface SelfCorrectionResult {
  execution: ExecutionResult;
  validation: SecurityValidationResult;
  retriesAttempted: number;
  corrected: boolean;
  correctionLog: string[];
}

@Injectable()
export class SqlSelfCorrectionService {
  private readonly logger = new Logger(SqlSelfCorrectionService.name);
  private readonly MAX_RETRIES = 2;

  constructor(
    private readonly sqlGenService: SqlGenerationService,
    private readonly securityValidator: SqlSecurityValidationService,
    private readonly sqlExecution: SqlExecutionService,
  ) {}

  /**
   * Executes query with controlled self-correction (max 2 retries for correctable errors).
   * Strictly forbids retrying security/authorization violations.
   */
  async executeWithSelfCorrection(
    prompt: string,
    intent: AnalyzedIntent,
    initialValidation: SecurityValidationResult,
  ): Promise<SelfCorrectionResult> {
    let currentValidation = initialValidation;
    let retries = 0;
    const correctionLog: string[] = [];

    while (true) {
      try {
        const execution = await this.sqlExecution.execute(currentValidation.sanitizedSql);
        return {
          execution,
          validation: currentValidation,
          retriesAttempted: retries,
          corrected: retries > 0,
          correctionLog,
        };
      } catch (err) {
        const execErr = err as SqlExecutionException;

        // NEVER retry authorization failures, permission denials, or security violations
        if (execErr.isAuthorizationError) {
          this.logger.warn(`Authorization failure encountered. Self-correction aborted: ${execErr.message}`);
          throw execErr;
        }

        if (retries >= this.MAX_RETRIES) {
          this.logger.error(`Exceeded maximum self-correction retries (${this.MAX_RETRIES}). Aborting.`);
          throw new Error(`Database execution failed after ${this.MAX_RETRIES} self-correction attempts: ${execErr.message}`);
        }

        retries++;
        this.logger.warn(`Query execution failed (attempt ${retries}/${this.MAX_RETRIES}): ${execErr.message}. Initiating controlled self-correction.`);
        correctionLog.push(`Attempt ${retries} failed: ${execErr.message}. Requesting corrected SQL.`);

        // Minimal, safe error feedback
        const sanitizedErrorContext = `PostgreSQL error: ${execErr.message.slice(0, 150)}`;
        const correctedSql = await this.sqlGenService.generateSql(prompt, intent, sanitizedErrorContext);

        // MANDATORY: Revalidate the corrected query structurally using AST security validator
        try {
          currentValidation = this.securityValidator.validate(correctedSql);
          correctionLog.push(`Attempt ${retries} corrected query passed AST validation.`);
        } catch (secErr) {
          this.logger.warn(`Corrected SQL failed security re-validation: ${(secErr as Error).message}`);
          throw secErr; // Security failure cannot be corrected further
        }
      }
    }
  }
}
