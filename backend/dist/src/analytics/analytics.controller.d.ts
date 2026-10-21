import { AnalyticsService } from './analytics.service';
import { QueryRequestDto } from './dto/query-request.dto';
import { QueryResponseDto } from './dto/query-response.dto';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    executeQuery(dto: QueryRequestDto): Promise<QueryResponseDto>;
    getSchema(): Promise<import("./services/schema-context.service").DatabaseSchemaMetadata>;
}
