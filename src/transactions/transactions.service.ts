import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TagsRepository } from '../tags/tags.repository.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { FilterTransactionsDto } from './dto/filter-transactions.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { Transaction } from './entities/transaction.entity.js';
import { TransactionType } from './enums/transaction-type.enum.js';
import { TransactionsRepository } from './transactions.repository.js';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly tagsRepository: TagsRepository,
  ) {}

  async create(dto: CreateTransactionDto): Promise<Transaction> {
    if (!Object.values(TransactionType).includes(dto.type)) {
      throw new BadRequestException(
        `Invalid transaction type: "${dto.type}". Must be EXPENSE or INCOME.`,
      );
    }

    const transactedAt = new Date(dto.transactedAt);
    if (isNaN(transactedAt.getTime())) {
      throw new BadRequestException(
        `Invalid transactedAt date: "${dto.transactedAt}". Expected ISO 8601 format.`,
      );
    }

    const tag = await this.tagsRepository.findById(dto.tagId);
    if (!tag) {
      throw new NotFoundException(`Tag "${dto.tagId}" not found.`);
    }

    const transaction = this.transactionsRepository.create({
      description: dto.description,
      amountInCents: dto.amountInCents,
      type: dto.type,
      tagId: dto.tagId,
      transactedAt,
    });

    return this.transactionsRepository.save(transaction);
  }

  async findAll(filters: FilterTransactionsDto): Promise<Transaction[]> {
    return this.transactionsRepository.findAll(filters);
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findById(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction "${id}" not found.`);
    }
    return transaction;
  }

  async update(id: string, dto: UpdateTransactionDto): Promise<Transaction> {
    await this.findOne(id);

    if (dto.type !== undefined && !Object.values(TransactionType).includes(dto.type)) {
      throw new BadRequestException(
        `Invalid transaction type: "${dto.type}". Must be EXPENSE or INCOME.`,
      );
    }

    let transactedAt: Date | undefined;
    if (dto.transactedAt !== undefined) {
      transactedAt = new Date(dto.transactedAt);
      if (isNaN(transactedAt.getTime())) {
        throw new BadRequestException(
          `Invalid transactedAt date: "${dto.transactedAt}". Expected ISO 8601 format.`,
        );
      }
    }

    if (dto.tagId !== undefined) {
      const tag = await this.tagsRepository.findById(dto.tagId);
      if (!tag) {
        throw new NotFoundException(`Tag "${dto.tagId}" not found.`);
      }
    }

    const updates: Partial<Transaction> = {};
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.amountInCents !== undefined) updates.amountInCents = dto.amountInCents;
    if (dto.type !== undefined) updates.type = dto.type;
    if (dto.tagId !== undefined) updates.tagId = dto.tagId;
    if (transactedAt !== undefined) updates.transactedAt = transactedAt;

    await this.transactionsRepository.update(id, updates);
    return this.transactionsRepository.findById(id) as Promise<Transaction>;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.transactionsRepository.delete(id);
  }
}
