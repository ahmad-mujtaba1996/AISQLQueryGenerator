import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
export declare class SqlExecutionException extends Error {
    readonly message: string;
    readonly isAuthorizationError: boolean;
    constructor(message: string, isAuthorizationError?: boolean);
}
export interface ExecutionResult {
    rows: Record<string, any>[];
    columns: string[];
    rowCount: number;
    durationMs: number;
    mode: 'live_supabase' | 'secure_sandbox';
    roleUsed: string;
}
export declare class SqlExecutionService implements OnModuleInit {
    private readonly prisma;
    private readonly logger;
    private sandboxDb;
    private analyticsPool;
    private readonly STATEMENT_TIMEOUT_MS;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    private initSandboxDb;
    private initAnalyticsPool;
    execute(sanitizedSql: string): Promise<ExecutionResult>;
    private executeOnPostgresPool;
    private executeOnPrismaReadOnly;
    private executeOnSandbox;
    private normalizeRow;
    private isAuthError;
}
