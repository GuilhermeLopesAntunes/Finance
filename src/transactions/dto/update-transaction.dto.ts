import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '../enums/transaction-type.enum.js';

export class UpdateTransactionDto {
  @ApiPropertyOptional({ example: 'UBER', description: 'Descrição da transação' })
  description?: string;

  @ApiPropertyOptional({ example: 830, description: 'Valor em centavos (ex: 830 = R$ 8,30)' })
  amountInCents?: number;

  @ApiPropertyOptional({ enum: TransactionType, example: TransactionType.EXPENSE, description: 'Tipo: EXPENSE ou INCOME' })
  type?: TransactionType;

  @ApiPropertyOptional({ example: 'uuid-da-tag', description: 'ID da tag existente' })
  tagId?: string;

  @ApiPropertyOptional({ example: '2026-10-01T14:30:00.000Z', description: 'Data e hora do evento em ISO 8601 (UTC)' })
  transactedAt?: string;
}
