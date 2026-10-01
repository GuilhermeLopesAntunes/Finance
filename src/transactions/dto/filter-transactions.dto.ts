import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '../enums/transaction-type.enum.js';

export class FilterTransactionsDto {
  @ApiPropertyOptional({ enum: TransactionType, description: 'Filtrar por tipo' })
  type?: TransactionType;

  @ApiPropertyOptional({ example: 'uuid-da-tag', description: 'Filtrar por tag' })
  tagId?: string;

  @ApiPropertyOptional({ example: '2026-10-01T00:00:00.000Z', description: 'Data inicial (ISO 8601)' })
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-10-31T23:59:59.999Z', description: 'Data final (ISO 8601)' })
  endDate?: string;
}
