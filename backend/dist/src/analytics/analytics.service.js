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
var AnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const intent_analysis_service_1 = require("./services/intent-analysis.service");
const schema_context_service_1 = require("./services/schema-context.service");
const sql_generation_service_1 = require("./services/sql-generation.service");
const sql_security_validation_service_1 = require("./services/sql-security-validation.service");
const sql_self_correction_service_1 = require("./services/sql-self-correction.service");
const business_summary_service_1 = require("./services/business-summary.service");
let AnalyticsService = AnalyticsService_1 = class AnalyticsService {
    intentService;
    schemaService;
    sqlGenService;
    securityValidator;
    selfCorrectionService;
    summaryService;
    logger = new common_1.Logger(AnalyticsService_1.name);
    constructor(intentService, schemaService, sqlGenService, securityValidator, selfCorrectionService, summaryService) {
        this.intentService = intentService;
        this.schemaService = schemaService;
        this.sqlGenService = sqlGenService;
        this.securityValidator = securityValidator;
        this.selfCorrectionService = selfCorrectionService;
        this.summaryService = summaryService;
    }
    async processQuery(dto) {
        const prompt = dto.prompt.trim();
        this.logger.log(`Processing analytical query: "${prompt}"`);
        const intent = this.intentService.analyze(prompt);
        if (!intent.isSafe) {
            return {
                status: 'rejected',
                prompt,
                intent,
                sql: '-- Query rejected: Adversarial or destructive pattern detected',
                data: [],
                columns: [],
                rowCount: 0,
                executionDurationMs: 0,
                summary: `Request blocked by DataPulse AI Security Guard: ${intent.securityNotes || 'Destructive or injection keywords detected.'}`,
                keyInsights: ['Execution rejected by determinist server-side intent analyzer.'],
                chartConfig: { suitable: false, type: 'none', title: 'Query Blocked', series: [] },
                kpis: [],
                security: {
                    astValidated: false,
                    statementType: 'BLOCKED',
                    tablesAccessed: [],
                    functionsUsed: [],
                    readOnlyEnforced: true,
                    hasLimitClause: false,
                    enforcedLimit: 0,
                    executionTimeoutMs: 5000,
                    auditNotes: [intent.securityNotes || 'Destructive SQL instruction blocked.'],
                },
                mode: 'secure_sandbox',
                roleUsed: 'datapulse_security_guard',
                errorMessage: intent.securityNotes,
            };
        }
        let rawSql;
        try {
            rawSql = await this.sqlGenService.generateSql(prompt, intent);
        }
        catch (genErr) {
            this.logger.error(`SQL Generation failed: ${genErr.message}`);
            throw new common_1.BadRequestException(`Failed to synthesize query from prompt: ${genErr.message}`);
        }
        let validationResult;
        try {
            validationResult = this.securityValidator.validate(rawSql);
        }
        catch (secErr) {
            const err = secErr;
            this.logger.warn(`Generated SQL rejected by AST Security Validator: ${err.message}`);
            return {
                status: 'rejected',
                prompt,
                intent,
                sql: rawSql,
                data: [],
                columns: [],
                rowCount: 0,
                executionDurationMs: 0,
                summary: `Query rejected by AST Security Engine: ${err.message}`,
                keyInsights: [
                    `Security violation: ${err.message}`,
                    'AI-generated SQL attempted to execute unapproved syntax or access restricted resources.',
                ],
                chartConfig: { suitable: false, type: 'none', title: 'Security Rejection', series: [] },
                kpis: [],
                security: {
                    astValidated: false,
                    statementType: 'REJECTED',
                    tablesAccessed: [],
                    functionsUsed: [],
                    readOnlyEnforced: true,
                    hasLimitClause: false,
                    enforcedLimit: 0,
                    executionTimeoutMs: 5000,
                    auditNotes: [`AST validation failure (${err.code}): ${err.message}`],
                },
                mode: 'secure_sandbox',
                roleUsed: 'datapulse_security_guard',
                errorMessage: err.message,
            };
        }
        let executionResult;
        let retriesCount = 0;
        try {
            const correctionResult = await this.selfCorrectionService.executeWithSelfCorrection(prompt, intent, validationResult);
            executionResult = correctionResult.execution;
            validationResult = correctionResult.validation;
            retriesCount = correctionResult.retriesAttempted;
        }
        catch (execErr) {
            this.logger.error(`Database execution failed: ${execErr.message}`);
            return {
                status: 'error',
                prompt,
                intent,
                sql: validationResult.sanitizedSql,
                data: [],
                columns: [],
                rowCount: 0,
                executionDurationMs: 0,
                summary: `Database query execution error: ${execErr.message}`,
                keyInsights: ['The query passed AST validation but encountered a runtime database execution error.'],
                chartConfig: { suitable: false, type: 'none', title: 'Execution Error', series: [] },
                kpis: [],
                security: {
                    astValidated: true,
                    statementType: validationResult.statementType,
                    tablesAccessed: validationResult.tablesAccessed,
                    functionsUsed: validationResult.functionsUsed,
                    readOnlyEnforced: true,
                    hasLimitClause: validationResult.hasLimitClause,
                    enforcedLimit: validationResult.enforcedLimit,
                    executionTimeoutMs: 5000,
                    auditNotes: validationResult.auditNotes,
                },
                mode: 'secure_sandbox',
                roleUsed: 'error_handler',
                retriesAttempted: retriesCount,
                errorMessage: execErr.message,
            };
        }
        const summaryResponse = await this.summaryService.generateSummary(prompt, intent, executionResult.rows, executionResult.columns);
        return {
            status: 'success',
            prompt,
            intent,
            sql: validationResult.sanitizedSql,
            data: executionResult.rows,
            columns: executionResult.columns,
            rowCount: executionResult.rowCount,
            executionDurationMs: executionResult.durationMs,
            summary: summaryResponse.summary,
            keyInsights: summaryResponse.keyInsights,
            chartConfig: summaryResponse.chartConfig,
            kpis: summaryResponse.kpis,
            security: {
                astValidated: true,
                statementType: validationResult.statementType,
                tablesAccessed: validationResult.tablesAccessed,
                functionsUsed: validationResult.functionsUsed,
                readOnlyEnforced: true,
                hasLimitClause: validationResult.hasLimitClause,
                enforcedLimit: validationResult.enforcedLimit,
                executionTimeoutMs: 5000,
                auditNotes: validationResult.auditNotes,
            },
            mode: executionResult.mode,
            roleUsed: executionResult.roleUsed,
            retriesAttempted: retriesCount,
        };
    }
    getSchema() {
        return this.schemaService.getSchemaMetadata();
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = AnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [intent_analysis_service_1.IntentAnalysisService,
        schema_context_service_1.SchemaContextService,
        sql_generation_service_1.SqlGenerationService,
        sql_security_validation_service_1.SqlSecurityValidationService,
        sql_self_correction_service_1.SqlSelfCorrectionService,
        business_summary_service_1.BusinessSummaryService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map