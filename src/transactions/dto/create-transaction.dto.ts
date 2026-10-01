import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '../enums/transaction-type.enum.js';

export class CreateTransactionDto {
  @ApiProperty({ example: 'UBER', description: 'Descrição da transação' })
  description: string;

  @ApiProperty({ example: 830, description: 'Valor em centavos (ex: 830 = R$ 8,30)' })
  amountInCents: number;

  @ApiProperty({ enum: TransactionType, example: TransactionType.EXPENSE, description: 'Tipo: EXPENSE ou INCOME' })
  type: TransactionType;

  @ApiProperty({ example: 'uuid-da-tag', description: 'ID da tag existente' })
  tagId: string;

  @ApiProperty({ example: '2026-10-01T14:30:00.000Z', description: 'Data e hora do evento em ISO 8601 (UTC)' })
  transactedAt: string;
}
