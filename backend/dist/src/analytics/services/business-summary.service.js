"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BusinessSummaryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessSummaryService = void 0;
const common_1 = require("@nestjs/common");
const genai_1 = require("@google/genai");
let BusinessSummaryService = BusinessSummaryService_1 = class BusinessSummaryService {
    logger = new common_1.Logger(BusinessSummaryService_1.name);
    genAiClient = null;
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey && apiKey !== 'your_gemini_api_key_here') {
            try {
                this.genAiClient = new genai_1.GoogleGenAI({ apiKey });
            }
            catch (err) {
                this.logger.warn(`Could not initialize @google/genai for summaries: ${err.message}`);
            }
        }
    }
    async generateSummary(prompt, intent, rows, columns) {
        const chartConfig = this.deriveChartConfig(prompt, intent, rows, columns);
        const kpis = this.deriveKpis(rows, columns);
        if (!rows || rows.length === 0) {
            return {
                summary: 'No database records matched the specified analytical criteria. The verified query executed successfully, returning zero rows.',
                keyInsights: ['Zero records returned for the specified filters and timeframe.'],
                chartConfig: { suitable: false, type: 'none', title: 'No Data Available', series: [] },
                kpis: [{ label: 'Results Found', value: '0', trend: 'neutral' }],
            };
        }
        if (this.genAiClient && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
            try {
                return await this.generateGeminiSummary(prompt, intent, rows, columns, chartConfig, kpis);
            }
            catch (err) {
                this.logger.warn(`Gemini summary generation failed: ${err.message}. Using deterministic grounded summary.`);
            }
        }
        return this.generateGroundedSummary(prompt, intent, rows, columns, chartConfig, kpis);
    }
    async generateGeminiSummary(prompt, intent, rows, columns, chartConfig, kpis) {
        const slicedContext = {
            totalRowsCount: rows.length,
            columns,
            sampleRows: rows.slice(0, 15),
        };
        const systemInstruction = `You are a Senior SaaS Business Intelligence Analyst.
Analyze strictly the provided query results.
CRITICAL MANDATES:
1. Ground every claim, number, and conclusion strictly in the provided database results.
2. NEVER invent outside causes, market conditions, or numbers not present in the data.
3. Preserve exact numerical values or standard 2-decimal currencies.
4. Output concise executive insights suitable for C-level leadership.
5. Format response strictly as valid JSON matching:
{
  "summary": "Executive summary paragraph...",
  "keyInsights": ["Point 1...", "Point 2...", "Point 3..."]
}`;
        const userPrompt = `User Inquired: "${prompt}"
Intent: ${intent.category} (Metric: ${intent.primaryMetric})

Database Execution Sliced Context:
${JSON.stringify(slicedContext, null, 2)}
`;
        const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        const response = await this.genAiClient.models.generateContent({
            model: modelName,
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                temperature: 0.2,
            },
        });
        const text = response.text || '';
        try {
            const parsed = JSON.parse(text);
            return {
                summary: parsed.summary || 'Summary generated from verified query results.',
                keyInsights: Array.isArray(parsed.keyInsights) ? parsed.keyInsights : [],
                chartConfig,
                kpis,
            };
        }
        catch (parseErr) {
            return this.generateGroundedSummary(prompt, intent, rows, columns, chartConfig, kpis);
        }
    }
    generateGroundedSummary(prompt, intent, rows, columns, chartConfig, kpis) {
        const rowCount = rows.length;
        let summaryText = '';
        const insights = [];
        const firstRow = rows[0];
        if (columns.includes('customer_name') && (columns.includes('total_spent') || columns.includes('total_revenue'))) {
            const spendKey = columns.includes('total_spent') ? 'total_spent' : 'total_revenue';
            const topCustomer = firstRow['customer_name'];
            const topSpend = Number(firstRow[spendKey]).toLocaleString('en-US', { minimumFractionDigits: 2 });
            const totalAll = rows.reduce((acc, r) => acc + (Number(r[spendKey]) || 0), 0);
            summaryText = `Identified top ${rowCount} enterprise customer accounts representing $${totalAll.toLocaleString('en-US', { minimumFractionDigits: 2 })} in verified completed transactions. ${topCustomer} ranks as the highest-spending account with $${topSpend}.`;
            insights.push(`${topCustomer} leads all accounts with $${topSpend} in completed transactions.`);
            if (rows.length > 1) {
                const second = rows[1];
                insights.push(`Runner-up account ${second['customer_name']} has generated $${Number(second[spendKey]).toLocaleString('en-US', { minimumFractionDigits: 2 })}.`);
            }
            insights.push(`Average expenditure among top accounts stands at $${(totalAll / rowCount).toFixed(2)}.`);
        }
        else if (columns.includes('month') && columns.includes('total_revenue')) {
            const totalRevenue = rows.reduce((acc, r) => acc + (Number(r['total_revenue']) || 0), 0);
            const sortedByRev = [...rows].sort((a, b) => Number(b['total_revenue']) - Number(a['total_revenue']));
            const peakMonth = sortedByRev[0]['month'];
            const peakRev = Number(sortedByRev[0]['total_revenue']).toLocaleString('en-US', { minimumFractionDigits: 2 });
            summaryText = `Monthly revenue analysis spanning ${rowCount} reporting periods totals $${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })} in realized revenue. Peak monthly performance occurred in ${peakMonth} at $${peakRev}.`;
            insights.push(`Peak revenue month was ${peakMonth} with $${peakRev} processed.`);
            insights.push(`Average monthly run-rate is $${(totalRevenue / rowCount).toFixed(2)}.`);
            insights.push(`Total completed transaction volume encompasses ${rows.reduce((acc, r) => acc + (Number(r['order_count']) || 0), 0)} orders across all recorded months.`);
        }
        else if (columns.includes('category') && columns.includes('total_revenue')) {
            const topCat = firstRow['category'];
            const topRev = Number(firstRow['total_revenue']).toLocaleString('en-US', { minimumFractionDigits: 2 });
            const totalRev = rows.reduce((acc, r) => acc + (Number(r['total_revenue']) || 0), 0);
            summaryText = `Category revenue distribution highlights ${topCat} as the primary revenue generator with $${topRev}, representing ${((Number(firstRow['total_revenue']) / (totalRev || 1)) * 100).toFixed(1)}% of total category revenue ($${totalRev.toLocaleString('en-US', { minimumFractionDigits: 2 })}).`;
            insights.push(`${topCat} drives the highest commercial volume at $${topRev}.`);
            if (rows.length > 1) {
                insights.push(`Followed by ${rows[1]['category']} with $${Number(rows[1]['total_revenue']).toLocaleString('en-US', { minimumFractionDigits: 2 })}.`);
            }
            insights.push(`Catalog diversification spans ${rowCount} active commercial categories.`);
        }
        else if (columns.includes('total_orders') && columns.includes('product_title')) {
            const topProd = firstRow['product_title'];
            const totalOrders = firstRow['total_orders'];
            summaryText = `Product order volume ranking identifies "${topProd}" as the most frequently ordered item with ${totalOrders} purchases recorded.`;
            insights.push(`"${topProd}" leads order frequency with ${totalOrders} orders placed.`);
            if (rows.length > 1) {
                insights.push(`Second highest order volume: "${rows[1]['product_title']}" with ${rows[1]['total_orders']} orders.`);
            }
        }
        else if (columns.includes('total_revenue') && !columns.includes('category') && !columns.includes('customer_name')) {
            const rev = Number(firstRow['total_revenue']).toLocaleString('en-US', { minimumFractionDigits: 2 });
            const ordersCount = firstRow['total_completed_orders'] || firstRow['order_count'] || rowCount;
            summaryText = `Total verified enterprise SaaS revenue stands at $${rev} across ${ordersCount} completed transactions.`;
            insights.push(`Aggregate realized revenue: $${rev}.`);
            if (firstRow['average_order_value']) {
                insights.push(`Average Order Value (AOV): $${Number(firstRow['average_order_value']).toFixed(2)}.`);
            }
        }
        else {
            summaryText = `Query executed successfully, returning ${rowCount} verified records across ${columns.length} attributes with zero security warnings.`;
            insights.push(`Returned ${rowCount} data points.`);
            insights.push(`Attributes: ${columns.join(', ')}.`);
        }
        return {
            summary: summaryText,
            keyInsights: insights,
            chartConfig,
            kpis,
        };
    }
    deriveChartConfig(prompt, intent, rows, columns) {
        if (!rows || rows.length === 0) {
            return { suitable: false, type: 'none', title: 'No Data', series: [] };
        }
        if (rows.length === 1 && !columns.some((c) => ['month', 'category', 'customer_name', 'status', 'product_title'].includes(c))) {
            return { suitable: false, type: 'none', title: 'Single Metric', series: [] };
        }
        let xAxisKey;
        if (columns.includes('product_title'))
            xAxisKey = 'product_title';
        else if (columns.includes('customer_name'))
            xAxisKey = 'customer_name';
        else if (columns.includes('month'))
            xAxisKey = 'month';
        else if (columns.includes('category'))
            xAxisKey = 'category';
        else if (columns.includes('status'))
            xAxisKey = 'status';
        else if (columns.includes('country'))
            xAxisKey = 'country';
        else {
            for (const col of columns) {
                if (typeof rows[0][col] === 'string') {
                    xAxisKey = col;
                    break;
                }
            }
        }
        const numericCols = columns.filter((col) => {
            const val = rows[0][col];
            return typeof val === 'number' || (!isNaN(Number(val)) && col !== xAxisKey && !col.endsWith('_id') && col !== 'id');
        });
        if (!xAxisKey || numericCols.length === 0) {
            return { suitable: false, type: 'none', title: 'Tabular Result', series: [] };
        }
        let type = 'bar';
        if (xAxisKey === 'month' || intent.category === 'time_trend') {
            type = 'line';
        }
        else if ((xAxisKey === 'status' || xAxisKey === 'category') && rows.length <= 6 && intent.suggestedChartType === 'pie') {
            type = 'pie';
        }
        else {
            type = 'bar';
        }
        const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'];
        const series = numericCols.slice(0, 2).map((col, idx) => ({
            dataKey: col,
            name: this.formatColumnLabel(col),
            color: colors[idx % colors.length],
        }));
        const title = this.formatChartTitle(xAxisKey, numericCols[0]);
        return {
            suitable: true,
            type,
            xAxisKey,
            yAxisKey: numericCols[0],
            title,
            description: `Visual breakdown of ${this.formatColumnLabel(numericCols[0])} by ${this.formatColumnLabel(xAxisKey)}.`,
            series,
        };
    }
    deriveKpis(rows, columns) {
        const kpis = [];
        if (!rows || rows.length === 0)
            return kpis;
        const first = rows[0];
        const revCol = columns.find((c) => ['total_revenue', 'total_spent', 'amount'].includes(c));
        if (revCol) {
            const totalRev = rows.reduce((acc, r) => acc + (Number(r[revCol]) || 0), 0);
            kpis.push({
                label: revCol === 'total_spent' ? 'Top Account Spend' : 'Total Revenue',
                value: `$${totalRev.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                trend: 'up',
            });
        }
        const orderCol = columns.find((c) => ['order_count', 'total_orders', 'orders_count', 'completed_orders', 'total_completed_orders'].includes(c));
        if (orderCol) {
            const totalOrders = rows.reduce((acc, r) => acc + (Number(r[orderCol]) || 0), 0);
            kpis.push({
                label: 'Completed Orders',
                value: totalOrders.toLocaleString('en-US'),
                trend: 'up',
            });
        }
        if (columns.includes('customer_name') && first['customer_name']) {
            kpis.push({
                label: 'Top Account',
                value: String(first['customer_name']),
                trend: 'neutral',
            });
        }
        else if (columns.includes('category') && first['category']) {
            kpis.push({
                label: 'Leading Category',
                value: String(first['category']),
                trend: 'neutral',
            });
        }
        else if (columns.includes('product_title') && first['product_title']) {
            kpis.push({
                label: 'Top Product',
                value: String(first['product_title']),
                trend: 'neutral',
            });
        }
        kpis.push({
            label: 'Verified Rows',
            value: String(rows.length),
            trend: 'neutral',
        });
        return kpis.slice(0, 4);
    }
    formatColumnLabel(col) {
        return col
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
    }
    formatChartTitle(xKey, yKey) {
        return `${this.formatColumnLabel(yKey)} by ${this.formatColumnLabel(xKey)}`;
    }
};
exports.BusinessSummaryService = BusinessSummaryService;
exports.BusinessSummaryService = BusinessSummaryService = BusinessSummaryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], BusinessSummaryService);
//# sourceMappingURL=business-summary.service.js.map