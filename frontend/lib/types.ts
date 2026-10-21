// DataPulse AI - Frontend Types

export type QueryIntentCategory =
  | 'ranking'
  | 'time_trend'
  | 'comparison'
  | 'aggregation'
  | 'filtering'
  | 'general';

export interface AnalyzedIntent {
  category: QueryIntentCategory;
  primaryMetric: string;
  tables: string[];
  timeDimension?: string;
  statusFilter?: string;
  suggestedChartType: 'bar' | 'line' | 'pie' | 'area' | 'table';
  confidence: number;
  isSafe: boolean;
  securityNotes?: string;
}

export interface ChartSeries {
  dataKey: string;
  name: string;
  color: string;
}

export interface ChartConfig {
  suitable: boolean;
  type: 'bar' | 'line' | 'pie' | 'area' | 'none';
  xAxisKey?: string;
  yAxisKey?: string;
  title: string;
  description?: string;
  series: ChartSeries[];
}

export interface KpiCard {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface SecurityAudit {
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

export interface QueryResponse {
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
  security: SecurityAudit;
  mode: 'live_supabase' | 'secure_sandbox';
  roleUsed: string;
  retriesAttempted?: number;
  errorMessage?: string;
}

export interface ColumnDefinition {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  references?: string;
  description: string;
  sampleValues?: string[];
}

export interface TableDefinition {
  name: string;
  displayName: string;
  description: string;
  columns: ColumnDefinition[];
  relationships: string[];
}

export interface DatabaseSchema {
  tables: TableDefinition[];
  businessRules: string[];
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  database: 'connected_live_supabase' | 'active_secure_sandbox';
  securityGuard: string;
  geminiEngine: string;
  timestamp: string;
  uptimeSeconds: number;
}
