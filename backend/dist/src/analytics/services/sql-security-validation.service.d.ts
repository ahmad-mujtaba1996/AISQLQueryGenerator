export declare class SqlSecurityException extends Error {
    readonly message: string;
    readonly code: 'SYNTAX_ERROR' | 'MULTIPLE_STATEMENTS' | 'WRITE_OPERATION_BLOCKED' | 'UNAUTHORIZED_TABLE' | 'UNAUTHORIZED_COLUMN' | 'DANGEROUS_FUNCTION_BLOCKED' | 'QUERY_COMPLEXITY_EXCEEDED' | 'LIMIT_EXCEEDED' | 'SECURITY_VIOLATION';
    constructor(message: string, code: 'SYNTAX_ERROR' | 'MULTIPLE_STATEMENTS' | 'WRITE_OPERATION_BLOCKED' | 'UNAUTHORIZED_TABLE' | 'UNAUTHORIZED_COLUMN' | 'DANGEROUS_FUNCTION_BLOCKED' | 'QUERY_COMPLEXITY_EXCEEDED' | 'LIMIT_EXCEEDED' | 'SECURITY_VIOLATION');
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
export declare class SqlSecurityValidationService {
    private readonly logger;
    private readonly allowedTables;
    private readonly allowedFunctions;
    private readonly MAX_LIMIT;
    private readonly DEFAULT_LIMIT;
    private readonly MAX_JOINS;
    validate(rawSql: string): SecurityValidationResult;
}
