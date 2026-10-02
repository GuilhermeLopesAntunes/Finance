import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TransactionType } from '../transactions/enums/transaction-type.enum.js';
import { AnalyticsService } from './analytics.service.js';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumo financeiro do período' })
  @ApiResponse({ status: 200, description: 'Totais, saldo, taxa de poupança e tickets médios' })
  @ApiQuery({ name: 'startDate', required: false, example: '2026-10-01T00:00:00.000Z' })
  @ApiQuery({ name: 'endDate', required: false, example: '2026-10-31T23:59:59.999Z' })
  getSummary(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.analyticsService.getSummary(startDate, endDate);
  }

  @Get('tags-distribution')
  @ApiOperation({ summary: 'Distribuição de gastos ou ganhos por tag' })
  @ApiResponse({ status: 200, description: 'Totais e percentuais por tag com cor HEX' })
  @ApiQuery({ name: 'type', required: false, enum: TransactionType })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getTagsDistribution(
    @Query('type') type: TransactionType = TransactionType.EXPENSE,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getTagsDistribution(type, startDate, endDate);
  }

  @Get('time-patterns')
  @ApiOperation({ summary: 'Padrões temporais: gastos por hora e por dia da semana' })
  @ApiResponse({ status: 200, description: 'Agrupamentos por hora (0-23) e dia da semana' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getTimePatterns(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.analyticsService.getTimePatterns(startDate, endDate);
  }

  @Get('timeline')
  @ApiOperation({ summary: 'Fluxo temporal de entradas e saídas' })
  @ApiResponse({ status: 200, description: 'Série temporal agrupada por day, week ou month' })
  @ApiQuery({ name: 'interval', required: false, enum: ['day', 'week', 'month'] })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getTimeline(
    @Query('interval') interval?: 'day' | 'week' | 'month',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getTimeline(interval, startDate, endDate);
  }
}
