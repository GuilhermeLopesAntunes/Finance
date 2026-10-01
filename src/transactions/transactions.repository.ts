import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { FilterTransactionsDto } from './dto/filter-transactions.dto.js';
import { Transaction } from './entities/transaction.entity.js';

@Injectable()
export class TransactionsRepository {
  constructor(
    @InjectRepository(Transaction)
    private readonly repo: Repository<Transaction>,
  ) {}

  create(data: Partial<Transaction>): Transaction {
    return this.repo.create(data);
  }

  async save(transaction: Transaction): Promise<Transaction> {
    return this.repo.save(transaction);
  }

  async findAll(filters: FilterTransactionsDto): Promise<Transaction[]> {
    const where: FindOptionsWhere<Transaction> = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.tagId) {
      where.tagId = filters.tagId;
    }

    if (filters.startDate && filters.endDate) {
      where.transactedAt = Between(
        new Date(filters.startDate),
        new Date(filters.endDate),
      );
    }

    return this.repo.find({ where, relations: ['tag'] });
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.repo.findOne({ where: { id }, relations: ['tag'] });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
