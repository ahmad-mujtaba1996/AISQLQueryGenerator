"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsModule = void 0;
const common_1 = require("@nestjs/common");
const analytics_controller_1 = require("./analytics.controller");
const analytics_service_1 = require("./analytics.service");
const intent_analysis_service_1 = require("./services/intent-analysis.service");
const schema_context_service_1 = require("./services/schema-context.service");
const sql_generation_service_1 = require("./services/sql-generation.service");
const sql_security_validation_service_1 = require("./services/sql-security-validation.service");
const sql_execution_service_1 = require("./services/sql-execution.service");
const sql_self_correction_service_1 = require("./services/sql-self-correction.service");
const business_summary_service_1 = require("./services/business-summary.service");
let AnalyticsModule = class AnalyticsModule {
};
exports.AnalyticsModule = AnalyticsModule;
exports.AnalyticsModule = AnalyticsModule = __decorate([
    (0, common_1.Module)({
        controllers: [analytics_controller_1.AnalyticsController],
        providers: [
            analytics_service_1.AnalyticsService,
            intent_analysis_service_1.IntentAnalysisService,
            schema_context_service_1.SchemaContextService,
            sql_generation_service_1.SqlGenerationService,
            sql_security_validation_service_1.SqlSecurityValidationService,
            sql_execution_service_1.SqlExecutionService,
            sql_self_correction_service_1.SqlSelfCorrectionService,
            business_summary_service_1.BusinessSummaryService,
        ],
        exports: [
            analytics_service_1.AnalyticsService,
            sql_security_validation_service_1.SqlSecurityValidationService,
            sql_execution_service_1.SqlExecutionService,
            intent_analysis_service_1.IntentAnalysisService,
        ],
    })
], AnalyticsModule);
//# sourceMappingURL=analytics.module.js.map