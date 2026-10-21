import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { IntentAnalysisService } from './services/intent-analysis.service';
import { SchemaContextService } from './services/schema-context.service';
import { SqlGenerationService } from './services/sql-generation.service';
import { SqlSecurityValidationService } from './services/sql-security-validation.service';
import { SqlExecutionService } from './services/sql-execution.service';
import { SqlSelfCorrectionService } from './services/sql-self-correction.service';
import { BusinessSummaryService } from './services/business-summary.service';

@Module({
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    IntentAnalysisService,
    SchemaContextService,
    SqlGenerationService,
    SqlSecurityValidationService,
    SqlExecutionService,
    SqlSelfCorrectionService,
    BusinessSummaryService,
  ],
  exports: [
    AnalyticsService,
    SqlSecurityValidationService,
    SqlExecutionService,
    IntentAnalysisService,
  ],
})
export class AnalyticsModule {}
