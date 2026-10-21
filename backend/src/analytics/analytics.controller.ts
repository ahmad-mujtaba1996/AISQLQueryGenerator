import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { QueryRequestDto } from './dto/query-request.dto';
import { QueryResponseDto } from './dto/query-response.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('query')
  @HttpCode(HttpStatus.OK)
  async executeQuery(@Body() dto: QueryRequestDto): Promise<QueryResponseDto> {
    return this.analyticsService.processQuery(dto);
  }

  @Get('schema')
  async getSchema() {
    return this.analyticsService.getSchema();
  }
}
