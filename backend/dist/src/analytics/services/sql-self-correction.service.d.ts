import { SqlGenerationService } from './sql-generation.service';
import { SqlSecurityValidationService, SecurityValidationResult } from './sql-security-validation.service';
import { SqlExecutionService, ExecutionResult } from './sql-execution.service';
import { AnalyzedIntent } from './intent-analysis.service';
export interface SelfCorrectionResult {
    execution: ExecutionResult;
    validation: SecurityValidationResult;
    retriesAttempted: number;
    corrected: boolean;
    correctionLog: string[];
}
export declare class SqlSelfCorrectionService {
    private readonly sqlGenService;
    private readonly securityValidator;
    private readonly sqlExecution;
    private readonly logger;
    private readonly MAX_RETRIES;
    constructor(sqlGenService: SqlGenerationService, securityValidator: SqlSecurityValidationService, sqlExecution: SqlExecutionService);
    executeWithSelfCorrection(prompt: string, intent: AnalyzedIntent, initialValidation: SecurityValidationResult): Promise<SelfCorrectionResult>;
}
