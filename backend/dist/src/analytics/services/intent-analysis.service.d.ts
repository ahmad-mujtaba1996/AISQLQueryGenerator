export type QueryIntentCategory = 'ranking' | 'time_trend' | 'comparison' | 'aggregation' | 'filtering' | 'general';
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
export declare class IntentAnalysisService {
    private readonly logger;
    private readonly adversarialPatterns;
    analyze(prompt: string): AnalyzedIntent;
}
