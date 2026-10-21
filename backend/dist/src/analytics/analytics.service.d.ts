import { IntentAnalysisService } from './services/intent-analysis.service';
import { SchemaContextService } from './services/schema-context.service';
import { SqlGenerationService } from './services/sql-generation.service';
import { SqlSecurityValidationService } from './services/sql-security-validation.service';
import { SqlSelfCorrectionService } from './services/sql-self-correction.service';
import { BusinessSummaryService } from './services/business-summary.service';
import { QueryRequestDto } from './dto/query-request.dto';
import { QueryResponseDto } from './dto/query-response.dto';
export declare class AnalyticsService {
    private readonly intentService;
    private readonly schemaService;
    private readonly sqlGenService;
    private readonly securityValidator;
    private readonly selfCorrectionService;
    private readonly summaryService;
    private readonly logger;
    constructor(intentService: IntentAnalysisService, schemaService: SchemaContextService, sqlGenService: SqlGenerationService, securityValidator: SqlSecurityValidationService, selfCorrectionService: SqlSelfCorrectionService, summaryService: BusinessSummaryService);
    processQuery(dto: QueryRequestDto): Promise<QueryResponseDto>;
    getSchema(): import("./services/schema-context.service").DatabaseSchemaMetadata;
}
