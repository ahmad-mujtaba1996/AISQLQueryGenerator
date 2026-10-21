"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var IntentAnalysisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentAnalysisService = void 0;
const common_1 = require("@nestjs/common");
let IntentAnalysisService = IntentAnalysisService_1 = class IntentAnalysisService {
    logger = new common_1.Logger(IntentAnalysisService_1.name);
    adversarialPatterns = [
        /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
        /disregard\s+(the\s+)?(prompt|system|rules)/i,
        /you\s+are\s+now\s+(in\s+)?(dan|jailbreak|developer|god)\s+mode/i,
        /reveal\s+(your\s+)?(system\s+prompt|instructions|secret|api\s*key|password)/i,
        /(drop|alter|delete|truncate|insert|update|grant|revoke)\s+table/i,
        /delete\s+from/i,
        /update\s+[a-z_0-9]+\s+set/i,
        /insert\s+into/i,
        /exec(ute)?\s*\(/i,
        /<script/i,
        /--\s*system/i,
        /union\s+all\s+select/i,
        /pg_shadow|pg_authid|pg_user/i,
    ];
    analyze(prompt) {
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            throw new common_1.BadRequestException('A valid, non-empty natural language prompt is required.');
        }
        const trimmed = prompt.trim();
        if (trimmed.length > 500) {
            throw new common_1.BadRequestException('Prompt exceeds maximum permitted character length (500).');
        }
        for (const pattern of this.adversarialPatterns) {
            if (pattern.test(trimmed)) {
                this.logger.warn(`Prompt injection pattern detected in prompt: "${trimmed}"`);
                return {
                    category: 'general',
                    primaryMetric: 'unknown',
                    tables: [],
                    suggestedChartType: 'table',
                    confidence: 0,
                    isSafe: false,
                    securityNotes: 'Adversarial instruction or destructive SQL keyword detected. Query blocked by Intent Security Guard.',
                };
            }
        }
        const lower = trimmed.toLowerCase();
        const tables = new Set();
        if (/(customer|user|client|country|who|buyer|spender|account|headquarter)/i.test(lower)) {
            tables.add('users');
        }
        if (/(product|category|item|tier|offering|sku|license|copilot|streamer|sentinel|platform)/i.test(lower)) {
            tables.add('products');
        }
        if (/(order|revenue|spent|spending|sale|sales|amount|dollar|transaction|purchase|bought|status|completed|pending|cancelled|refund)/i.test(lower)) {
            tables.add('orders');
        }
        if (tables.size === 0) {
            tables.add('orders');
            tables.add('products');
            tables.add('users');
        }
        else if (tables.has('users') && tables.has('products')) {
            tables.add('orders');
        }
        let category = 'aggregation';
        let suggestedChart = 'bar';
        if (/(trend|monthly|month|over time|history|timeline|growth|by day|by week)/i.test(lower)) {
            category = 'time_trend';
            suggestedChart = 'line';
        }
        else if (/(top|highest|most|best|bottom|lowest|rank|leader)/i.test(lower)) {
            category = 'ranking';
            suggestedChart = 'bar';
        }
        else if (/(compare|comparison|versus|vs|breakdown|distribution|share|proportion)/i.test(lower)) {
            category = 'comparison';
            suggestedChart = /(share|proportion|percent|distribution)/i.test(lower) ? 'pie' : 'bar';
        }
        else if (/(find|list|show all|which orders|filter|where)/i.test(lower) && !/(total|sum|average|avg)/i.test(lower)) {
            category = 'filtering';
            suggestedChart = 'table';
        }
        else {
            category = 'aggregation';
            suggestedChart = 'bar';
        }
        let primaryMetric = 'revenue';
        if (/(order count|number of orders|how many orders|orders count|frequency)/i.test(lower)) {
            primaryMetric = 'order_count';
        }
        else if (/(average|avg|aov)/i.test(lower)) {
            primaryMetric = 'average_amount';
        }
        else if (/(price|cost)/i.test(lower)) {
            primaryMetric = 'price';
        }
        let timeDimension;
        if (/(this month|current month|october)/i.test(lower)) {
            timeDimension = 'current_month';
        }
        else if (/(monthly|by month)/i.test(lower)) {
            timeDimension = 'monthly';
        }
        let statusFilter;
        if (/completed/i.test(lower))
            statusFilter = 'completed';
        else if (/pending/i.test(lower))
            statusFilter = 'pending';
        else if (/cancelled/i.test(lower))
            statusFilter = 'cancelled';
        else if (/refunded/i.test(lower))
            statusFilter = 'refunded';
        return {
            category,
            primaryMetric,
            tables: Array.from(tables),
            timeDimension,
            statusFilter,
            suggestedChartType: suggestedChart,
            confidence: 0.95,
            isSafe: true,
        };
    }
};
exports.IntentAnalysisService = IntentAnalysisService;
exports.IntentAnalysisService = IntentAnalysisService = IntentAnalysisService_1 = __decorate([
    (0, common_1.Injectable)()
], IntentAnalysisService);
//# sourceMappingURL=intent-analysis.service.js.map