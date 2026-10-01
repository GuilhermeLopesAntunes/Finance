import { TransactionType } from '../enums/transaction-type.enum.js';

export class FilterTransactionsDto {
  type?: TransactionType;
  tagId?: string;
  startDate?: string;
  endDate?: string;
}
