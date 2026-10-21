import { AnalyzedIntent } from '../services/intent-analysis.service';
import { ChartConfig, KpiCard } from '../services/business-summary.service';
export interface SecurityAuditDto {
    astValidated: boolean;
    statementType: string;
    tablesAccessed: string[];
    functionsUsed: string[];
    readOnlyEnforced: boolean;
    hasLimitClause: boolean;
    enforcedLimit: number;
    executionTimeoutMs: number;
    auditNotes: string[];
}
export interface QueryResponseDto {
    status: 'success' | 'rejected' | 'error';
    prompt: string;
    intent: AnalyzedIntent;
    sql: string;
    data: Record<string, any>[];
    columns: string[];
    rowCount: number;
    executionDurationMs: number;
    summary: string;
    keyInsights: string[];
    chartConfig: ChartConfig;
    kpis: KpiCard[];
    security: SecurityAuditDto;
    mode: 'live_supabase' | 'secure_sandbox';
    roleUsed: string;
    retriesAttempted?: number;
    errorMessage?: string;
}
