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
var SqlGenerationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlGenerationService = void 0;
const common_1 = require("@nestjs/common");
const genai_1 = require("@google/genai");
const schema_context_service_1 = require("./schema-context.service");
let SqlGenerationService = SqlGenerationService_1 = class SqlGenerationService {
    schemaService;
    logger = new common_1.Logger(SqlGenerationService_1.name);
    genAiClient = null;
    constructor(schemaService) {
        this.schemaService = schemaService;
        const apiKey = process.env.GEMINI_API_KEY;
        const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        if (apiKey && apiKey !== 'your_gemini_api_key_here') {
            try {
                this.genAiClient = new genai_1.GoogleGenAI({ apiKey });
                this.logger.log(`Gemini client (${model}) initialized via @google/genai.`);
            }
            catch (err) {
                this.logger.warn(`Could not initialize @google/genai: ${err.message}`);
            }
        }
        else {
            this.logger.warn('GEMINI_API_KEY not configured. Deterministic analytical engine active for sample queries.');
        }
    }
    async generateSql(prompt, intent, correctionContext) {
        if (this.genAiClient && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
            try {
                return await this.generateWithGemini(prompt, intent, correctionContext);
            }
            catch (geminiError) {
                this.logger.error(`Gemini API call failed: ${geminiError.message}. Falling back to deterministic generator.`);
                return this.generateDeterministicFallback(prompt, intent);
            }
        }
        return this.generateDeterministicFallback(prompt, intent);
    }
    async generateWithGemini(prompt, intent, correctionContext) {
        const schemaContext = this.schemaService.buildPromptContext(intent.tables);
        const systemInstruction = `You are a Principal PostgreSQL Analytics Architect.
Your task is to generate a single, highly optimized, secure, read-only PostgreSQL query based strictly on the provided schema and business rules.

MANDATORY RULES:
1. ONLY produce a single valid SELECT query.
2. NEVER produce INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, GRANT, or multi-statement scripts.
3. NEVER access tables other than 'users', 'products', 'orders'.
4. Strictly follow the business calculation rules:
   - For revenue calculations, ALWAYS filter orders by: orders.status = 'completed'.
   - Top customers must be grouped by users.name and sorted by revenue descending.
   - For monthly trends, use TO_CHAR(orders.created_at, 'YYYY-MM') or DATE_TRUNC('month', orders.created_at).
5. Always provide explicit, clean aliases (e.g. total_revenue, customer_name, product_title, order_count).
6. Always include a sensible LIMIT (e.g. LIMIT 5 or LIMIT 10 for rankings, LIMIT 50 for lists).
7. Return ONLY the SQL query enclosed in a \`\`\`sql code block. Do NOT include any explanations or commentary outside the code block.`;
        let userPrompt = `<schema_context>
${schemaContext}
</schema_context>

<user_query>
${prompt}
</user_query>`;
        if (correctionContext) {
            userPrompt += `\n\n<correction_feedback>
The previous SQL query produced an execution error:
${correctionContext}
Please fix the error and output a corrected, compliant PostgreSQL SELECT query.
</correction_feedback>`;
        }
        const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        const response = await this.genAiClient.models.generateContent({
            model: modelName,
            contents: userPrompt,
            config: {
                systemInstruction,
                temperature: 0.1,
            },
        });
        const text = response.text || '';
        return this.extractSqlFromText(text);
    }
    extractSqlFromText(text) {
        const codeBlockMatch = text.match(/```(?:sql)?\s*([\s\S]*?)```/i);
        if (codeBlockMatch && codeBlockMatch[1]) {
            return codeBlockMatch[1].trim();
        }
        return text.trim();
    }
    generateDeterministicFallback(prompt, intent) {
        const lower = prompt.toLowerCase();
        if (/(top|highest|best).*(customer|spender|spending|user|client)/i.test(lower) || /customer.*spending/i.test(lower)) {
            const limitMatch = lower.match(/\b(top|first)\s+(\d+)\b/);
            const limit = limitMatch ? limitMatch[2] : '5';
            return `SELECT 
  u.name AS customer_name,
  u.email AS customer_email,
  u.country AS country,
  ROUND(SUM(o.amount), 2) AS total_spent,
  COUNT(o.id) AS completed_orders
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.status = 'completed'
GROUP BY u.id, u.name, u.email, u.country
ORDER BY total_spent DESC
LIMIT ${limit};`;
        }
        if (/(monthly|month).*revenue/i.test(lower) || /revenue.*(monthly|trend|over time)/i.test(lower)) {
            return `SELECT 
  TO_CHAR(o.created_at, 'YYYY-MM') AS month,
  ROUND(SUM(o.amount), 2) AS total_revenue,
  COUNT(o.id) AS order_count
FROM orders o
WHERE o.status = 'completed'
GROUP BY TO_CHAR(o.created_at, 'YYYY-MM')
ORDER BY month ASC;`;
        }
        if (/categor.*revenue/i.test(lower) || /revenue.*categor/i.test(lower)) {
            return `SELECT 
  p.category AS category,
  ROUND(SUM(o.amount), 2) AS total_revenue,
  COUNT(o.id) AS orders_count
FROM products p
JOIN orders o ON p.id = o.product_id
WHERE o.status = 'completed'
GROUP BY p.category
ORDER BY total_revenue DESC;`;
        }
        if (/(completed|this month).*orders/i.test(lower) || /orders.*(this month|october)/i.test(lower)) {
            return `SELECT 
  o.id AS order_id,
  u.name AS customer_name,
  p.title AS product_title,
  p.category AS product_category,
  o.amount AS amount,
  o.status AS status,
  TO_CHAR(o.created_at, 'YYYY-MM-DD HH24:MI') AS order_date
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN products p ON o.product_id = p.id
WHERE o.status = 'completed' 
  AND o.created_at >= '2026-10-01' 
  AND o.created_at < '2026-11-01'
ORDER BY o.created_at DESC;`;
        }
        if (/product.*(highest|most).*orders/i.test(lower) || /most.*order.*product/i.test(lower) || /top.*product/i.test(lower)) {
            return `SELECT 
  p.title AS product_title,
  p.category AS category,
  COUNT(o.id) AS total_orders,
  ROUND(SUM(CASE WHEN o.status = 'completed' THEN o.amount ELSE 0 END), 2) AS total_revenue
FROM products p
LEFT JOIN orders o ON p.id = o.product_id
GROUP BY p.id, p.title, p.category
ORDER BY total_orders DESC
LIMIT 5;`;
        }
        if (/total.*revenue/i.test(lower) || /overall.*revenue/i.test(lower)) {
            return `SELECT 
  ROUND(SUM(amount), 2) AS total_revenue,
  COUNT(id) AS total_completed_orders,
  ROUND(AVG(amount), 2) AS average_order_value
FROM orders
WHERE status = 'completed';`;
        }
        if (/order.*status/i.test(lower) || /status.*breakdown/i.test(lower)) {
            return `SELECT 
  status AS order_status,
  COUNT(id) AS order_count,
  ROUND(SUM(amount), 2) AS total_amount
FROM orders
GROUP BY status
ORDER BY order_count DESC;`;
        }
        if (intent.tables.includes('users') && intent.tables.includes('orders')) {
            return `SELECT 
  u.name AS customer_name,
  u.country AS country,
  ROUND(SUM(o.amount), 2) AS total_revenue
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.status = 'completed'
GROUP BY u.id, u.name, u.country
ORDER BY total_revenue DESC
LIMIT 10;`;
        }
        return `SELECT 
  p.category AS category,
  COUNT(o.id) AS order_count,
  ROUND(SUM(o.amount), 2) AS total_revenue
FROM products p
JOIN orders o ON p.id = o.product_id
WHERE o.status = 'completed'
GROUP BY p.category
ORDER BY total_revenue DESC
LIMIT 10;`;
    }
};
exports.SqlGenerationService = SqlGenerationService;
exports.SqlGenerationService = SqlGenerationService = SqlGenerationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [schema_context_service_1.SchemaContextService])
], SqlGenerationService);
//# sourceMappingURL=sql-generation.service.js.map