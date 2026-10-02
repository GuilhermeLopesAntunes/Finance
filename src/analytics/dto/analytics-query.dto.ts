import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '../../transactions/enums/transaction-type.enum.js';

export class AnalyticsPeriodDto {
  @ApiPropertyOptional({ example: '2026-10-01T00:00:00.000Z', description: 'Data inicial (ISO 8601)' })
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-10-31T23:59:59.999Z', description: 'Data final (ISO 8601)' })
  endDate?: string;
}

export class AnalyticsTagsDistributionDto extends AnalyticsPeriodDto {
  @ApiPropertyOptional({ enum: TransactionType, description: 'Tipo: EXPENSE ou INCOME' })
  type?: TransactionType;
}

export type TimelineInterval = 'day' | 'week' | 'month';

export class AnalyticsTimelineDto extends AnalyticsPeriodDto {
  @ApiPropertyOptional({ enum: ['day', 'week', 'month'], description: 'Intervalo de agrupamento' })
  interval?: TimelineInterval;
}
