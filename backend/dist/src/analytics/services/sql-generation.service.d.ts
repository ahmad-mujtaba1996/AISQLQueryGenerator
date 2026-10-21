import { SchemaContextService } from './schema-context.service';
import { AnalyzedIntent } from './intent-analysis.service';
export declare class SqlGenerationService {
    private readonly schemaService;
    private readonly logger;
    private genAiClient;
    constructor(schemaService: SchemaContextService);
    generateSql(prompt: string, intent: AnalyzedIntent, correctionContext?: string): Promise<string>;
    private generateWithGemini;
    private extractSqlFromText;
    private generateDeterministicFallback;
}
