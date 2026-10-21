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
var SqlSelfCorrectionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlSelfCorrectionService = void 0;
const common_1 = require("@nestjs/common");
const sql_generation_service_1 = require("./sql-generation.service");
const sql_security_validation_service_1 = require("./sql-security-validation.service");
const sql_execution_service_1 = require("./sql-execution.service");
let SqlSelfCorrectionService = SqlSelfCorrectionService_1 = class SqlSelfCorrectionService {
    sqlGenService;
    securityValidator;
    sqlExecution;
    logger = new common_1.Logger(SqlSelfCorrectionService_1.name);
    MAX_RETRIES = 2;
    constructor(sqlGenService, securityValidator, sqlExecution) {
        this.sqlGenService = sqlGenService;
        this.securityValidator = securityValidator;
        this.sqlExecution = sqlExecution;
    }
    async executeWithSelfCorrection(prompt, intent, initialValidation) {
        let currentValidation = initialValidation;
        let retries = 0;
        const correctionLog = [];
        while (true) {
            try {
                const execution = await this.sqlExecution.execute(currentValidation.sanitizedSql);
                return {
                    execution,
                    validation: currentValidation,
                    retriesAttempted: retries,
                    corrected: retries > 0,
                    correctionLog,
                };
            }
            catch (err) {
                const execErr = err;
                if (execErr.isAuthorizationError) {
                    this.logger.warn(`Authorization failure encountered. Self-correction aborted: ${execErr.message}`);
                    throw execErr;
                }
                if (retries >= this.MAX_RETRIES) {
                    this.logger.error(`Exceeded maximum self-correction retries (${this.MAX_RETRIES}). Aborting.`);
                    throw new Error(`Database execution failed after ${this.MAX_RETRIES} self-correction attempts: ${execErr.message}`);
                }
                retries++;
                this.logger.warn(`Query execution failed (attempt ${retries}/${this.MAX_RETRIES}): ${execErr.message}. Initiating controlled self-correction.`);
                correctionLog.push(`Attempt ${retries} failed: ${execErr.message}. Requesting corrected SQL.`);
                const sanitizedErrorContext = `PostgreSQL error: ${execErr.message.slice(0, 150)}`;
                const correctedSql = await this.sqlGenService.generateSql(prompt, intent, sanitizedErrorContext);
                try {
                    currentValidation = this.securityValidator.validate(correctedSql);
                    correctionLog.push(`Attempt ${retries} corrected query passed AST validation.`);
                }
                catch (secErr) {
                    this.logger.warn(`Corrected SQL failed security re-validation: ${secErr.message}`);
                    throw secErr;
                }
            }
        }
    }
};
exports.SqlSelfCorrectionService = SqlSelfCorrectionService;
exports.SqlSelfCorrectionService = SqlSelfCorrectionService = SqlSelfCorrectionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sql_generation_service_1.SqlGenerationService,
        sql_security_validation_service_1.SqlSecurityValidationService,
        sql_execution_service_1.SqlExecutionService])
], SqlSelfCorrectionService);
//# sourceMappingURL=sql-self-correction.service.js.map