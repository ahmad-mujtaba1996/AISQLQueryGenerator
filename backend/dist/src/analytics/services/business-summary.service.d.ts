import { AnalyzedIntent } from './intent-analysis.service';
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
export interface BusinessSummaryResponse {
    summary: string;
    keyInsights: string[];
    chartConfig: ChartConfig;
    kpis: KpiCard[];
}
export declare class BusinessSummaryService {
    private readonly logger;
    private genAiClient;
    constructor();
    generateSummary(prompt: string, intent: AnalyzedIntent, rows: Record<string, any>[], columns: string[]): Promise<BusinessSummaryResponse>;
    private generateGeminiSummary;
    private generateGroundedSummary;
    private deriveChartConfig;
    private deriveKpis;
    private formatColumnLabel;
    private formatChartTitle;
}
