import { TransactionType } from '../enums/transaction-type.enum.js';

export class CreateTransactionDto {
  description: string;
  amountInCents: number;
  type: TransactionType;
  tagId: string;
  transactedAt: string;
}
