import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Tag } from '../tags/entities/tag.entity.js';
import { TagsRepository } from '../tags/tags.repository.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { FilterTransactionsDto } from './dto/filter-transactions.dto.js';
import { Transaction } from './entities/transaction.entity.js';
import { TransactionType } from './enums/transaction-type.enum.js';
import { TransactionsRepository } from './transactions.repository.js';
import { TransactionsService } from './transactions.service.js';

const makeTag = (overrides: Partial<Tag> = {}): Tag =>
  ({
    id: 'tag-uuid-1',
    name: 'Transporte',
    colorHex: '#FF5733',
    createdAt: new Date(),
    updatedAt: new Date(),
    transactions: [],
    ...overrides,
  }) as Tag;

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    id: 'tr-uuid-1',
    description: 'UBER',
    amountInCents: 830,
    type: TransactionType.EXPENSE,
    tagId: 'tag-uuid-1',
    tag: makeTag(),
    transactedAt: new Date('2026-10-01T14:30:00.000Z'),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Transaction;

const makeTransactionsRepo = (): TransactionsRepository =>
  ({
    create: vi.fn((data) => ({ ...data }) as Transaction),
    save: vi.fn(async (t) => t),
    findAll: vi.fn(async () => []),
    findById: vi.fn(async () => null),
    delete: vi.fn(async () => undefined),
  }) as unknown as TransactionsRepository;

const makeTagsRepo = (): TagsRepository =>
  ({
    findById: vi.fn(async () => null),
  }) as unknown as TagsRepository;

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionsRepo: TransactionsRepository;
  let tagsRepo: TagsRepository;

  beforeEach(() => {
    transactionsRepo = makeTransactionsRepo();
    tagsRepo = makeTagsRepo();
    service = new TransactionsService(transactionsRepo, tagsRepo);
  });

  describe('create', () => {
    it('creates a transaction with valid data', async () => {
      vi.mocked(tagsRepo.findById).mockResolvedValue(makeTag());
      const transaction = makeTransaction();
      vi.mocked(transactionsRepo.save).mockResolvedValue(transaction);

      const dto: CreateTransactionDto = {
        description: 'UBER',
        amountInCents: 830,
        type: TransactionType.EXPENSE,
        tagId: 'tag-uuid-1',
        transactedAt: '2026-10-01T14:30:00.000Z',
      };

      const result = await service.create(dto);

      expect(result).toEqual(transaction);
      expect(transactionsRepo.save).toHaveBeenCalledOnce();
    });

    it('throws BadRequestException for invalid transaction type', async () => {
      const dto = {
        description: 'UBER',
        amountInCents: 830,
        type: 'INVALID' as TransactionType,
        tagId: 'tag-uuid-1',
        transactedAt: '2026-10-01T14:30:00.000Z',
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for invalid ISO 8601 date', async () => {
      const dto: CreateTransactionDto = {
        description: 'UBER',
        amountInCents: 830,
        type: TransactionType.EXPENSE,
        tagId: 'tag-uuid-1',
        transactedAt: 'not-a-date',
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when tag does not exist', async () => {
      vi.mocked(tagsRepo.findById).mockResolvedValue(null);

      const dto: CreateTransactionDto = {
        description: 'UBER',
        amountInCents: 830,
        type: TransactionType.EXPENSE,
        tagId: 'non-existent-tag',
        transactedAt: '2026-10-01T14:30:00.000Z',
      };

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('registers INCOME transaction correctly', async () => {
      vi.mocked(tagsRepo.findById).mockResolvedValue(makeTag({ id: 'tag-uuid-2', name: 'Fixo', colorHex: '#28A745' }));
      const transaction = makeTransaction({
        description: 'Estágio',
        amountInCents: 100000,
        type: TransactionType.INCOME,
      });
      vi.mocked(transactionsRepo.save).mockResolvedValue(transaction);

      const dto: CreateTransactionDto = {
        description: 'Estágio',
        amountInCents: 100000,
        type: TransactionType.INCOME,
        tagId: 'tag-uuid-2',
        transactedAt: '2026-10-01T14:30:00.000Z',
      };

      const result = await service.create(dto);

      expect(result.type).toBe(TransactionType.INCOME);
      expect(result.amountInCents).toBe(100000);
    });
  });

  describe('findAll', () => {
    it('returns filtered transactions', async () => {
      const transactions = [makeTransaction()];
      vi.mocked(transactionsRepo.findAll).mockResolvedValue(transactions);

      const filters: FilterTransactionsDto = { type: TransactionType.EXPENSE };
      const result = await service.findAll(filters);

      expect(result).toHaveLength(1);
      expect(transactionsRepo.findAll).toHaveBeenCalledWith(filters);
    });
  });

  describe('findOne', () => {
    it('returns transaction with tag data', async () => {
      const transaction = makeTransaction();
      vi.mocked(transactionsRepo.findById).mockResolvedValue(transaction);

      const result = await service.findOne('tr-uuid-1');

      expect(result).toEqual(transaction);
      expect(result.tag.name).toBe('Transporte');
      expect(result.tag.colorHex).toBe('#FF5733');
    });

    it('throws NotFoundException when transaction does not exist', async () => {
      vi.mocked(transactionsRepo.findById).mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes existing transaction', async () => {
      vi.mocked(transactionsRepo.findById).mockResolvedValue(makeTransaction());

      await expect(service.remove('tr-uuid-1')).resolves.toBeUndefined();
      expect(transactionsRepo.delete).toHaveBeenCalledWith('tr-uuid-1');
    });

    it('throws NotFoundException when transaction does not exist', async () => {
      vi.mocked(transactionsRepo.findById).mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
