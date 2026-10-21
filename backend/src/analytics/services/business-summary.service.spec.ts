import { BusinessSummaryService } from './business-summary.service';
import { AnalyzedIntent } from './intent-analysis.service';

describe('BusinessSummaryService (Slicing & Grounded Insights)', () => {
  let service: BusinessSummaryService;

  beforeEach(() => {
    service = new BusinessSummaryService();
  });

  const mockIntent: AnalyzedIntent = {
    category: 'ranking',
    primaryMetric: 'revenue',
    tables: ['users', 'orders'],
    suggestedChartType: 'bar',
    confidence: 0.95,
    isSafe: true,
  };

  it('should honestly handle empty result sets with zero hallucination', async () => {
    const res = await service.generateSummary('Show orders', mockIntent, [], []);
    expect(res.summary).toContain('No database records matched');
    expect(res.chartConfig.suitable).toBe(false);
    expect(res.chartConfig.type).toBe('none');
    expect(res.kpis[0].value).toBe('0');
  });

  it('should generate grounded ranking summary preserving exact numerical totals', async () => {
    const rows = [
      { customer_name: 'Elena Rostova', total_spent: 6398.0, completed_orders: 4 },
      { customer_name: 'Sarah Connor', total_spent: 6198.0, completed_orders: 4 },
    ];
    const columns = ['customer_name', 'total_spent', 'completed_orders'];

    const res = await service.generateSummary('Top customers', mockIntent, rows, columns);
    expect(res.summary).toContain('Elena Rostova');
    expect(res.summary).toContain('6,398.00');
    expect(res.keyInsights.length).toBeGreaterThan(0);
    expect(res.chartConfig.suitable).toBe(true);
    expect(res.chartConfig.type).toBe('bar');
    expect(res.chartConfig.xAxisKey).toBe('customer_name');
  });

  it('should configure line chart for time-series monthly revenue trends', async () => {
    const timeIntent: AnalyzedIntent = {
      ...mockIntent,
      category: 'time_trend',
      suggestedChartType: 'line',
    };
    const rows = [
      { month: '2026-01', total_revenue: 5097.0, order_count: 3 },
      { month: '2026-02', total_revenue: 4249.0, order_count: 2 },
    ];
    const columns = ['month', 'total_revenue', 'order_count'];

    const res = await service.generateSummary('Monthly revenue', timeIntent, rows, columns);
    expect(res.chartConfig.suitable).toBe(true);
    expect(res.chartConfig.type).toBe('line');
    expect(res.chartConfig.xAxisKey).toBe('month');
  });
});
