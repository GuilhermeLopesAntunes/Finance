import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateTagDto } from './dto/create-tag.dto.js';
import { UpdateTagDto } from './dto/update-tag.dto.js';
import { Tag } from './entities/tag.entity.js';
import { TagsRepository } from './tags.repository.js';
import { TagsService } from './tags.service.js';

const makeTag = (overrides: Partial<Tag> = {}): Tag =>
  ({
    id: 'uuid-1',
    name: 'Transporte',
    colorHex: '#FF5733',
    createdAt: new Date(),
    updatedAt: new Date(),
    transactions: [],
    ...overrides,
  }) as Tag;

const makeRepo = (): TagsRepository =>
  ({
    create: vi.fn((data) => ({ ...data }) as Tag),
    save: vi.fn(async (tag) => tag),
    findAll: vi.fn(async () => []),
    findById: vi.fn(async () => null),
    findByName: vi.fn(async () => null),
    hasTransactions: vi.fn(async () => false),
    delete: vi.fn(async () => undefined),
  }) as unknown as TagsRepository;

describe('TagsService', () => {
  let service: TagsService;
  let repo: TagsRepository;

  beforeEach(() => {
    repo = makeRepo();
    service = new TagsService(repo);
  });

  describe('create', () => {
    it('creates a tag with valid data', async () => {
      const dto: CreateTagDto = { name: 'Transporte', colorHex: '#FF5733' };
      const tag = makeTag();
      vi.mocked(repo.save).mockResolvedValue(tag);

      const result = await service.create(dto);

      expect(result).toEqual(tag);
      expect(repo.save).toHaveBeenCalledOnce();
    });

    it('throws BadRequestException for invalid hex color', async () => {
      const dto: CreateTagDto = { name: 'Lazer', colorHex: 'red' };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for hex color without #', async () => {
      const dto: CreateTagDto = { name: 'Lazer', colorHex: 'FF5733' };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('accepts 3-digit hex color', async () => {
      const dto: CreateTagDto = { name: 'Lazer', colorHex: '#F53' };
      const tag = makeTag({ colorHex: '#F53', name: 'Lazer' });
      vi.mocked(repo.save).mockResolvedValue(tag);

      const result = await service.create(dto);

      expect(result.colorHex).toBe('#F53');
    });

    it('throws ConflictException if tag name already exists', async () => {
      vi.mocked(repo.findByName).mockResolvedValue(makeTag());
      const dto: CreateTagDto = { name: 'Transporte', colorHex: '#FF5733' };

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('returns tag when found', async () => {
      const tag = makeTag();
      vi.mocked(repo.findById).mockResolvedValue(tag);

      const result = await service.findOne('uuid-1');

      expect(result).toEqual(tag);
    });

    it('throws NotFoundException when tag does not exist', async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates name and color', async () => {
      const tag = makeTag();
      vi.mocked(repo.findById).mockResolvedValue(tag);
      vi.mocked(repo.save).mockResolvedValue(makeTag({ name: 'Lazer', colorHex: '#28A745' }));
      const dto: UpdateTagDto = { name: 'Lazer', colorHex: '#28A745' };

      const result = await service.update('uuid-1', dto);

      expect(result.name).toBe('Lazer');
      expect(result.colorHex).toBe('#28A745');
    });

    it('throws BadRequestException for invalid color on update', async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeTag());
      const dto: UpdateTagDto = { colorHex: 'invalid' };

      await expect(service.update('uuid-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException if new name already taken', async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeTag({ name: 'Transporte' }));
      vi.mocked(repo.findByName).mockResolvedValue(makeTag({ id: 'uuid-2', name: 'Lazer' }));
      const dto: UpdateTagDto = { name: 'Lazer' };

      await expect(service.update('uuid-1', dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('deletes tag without transactions', async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeTag());
      vi.mocked(repo.hasTransactions).mockResolvedValue(false);

      await expect(service.remove('uuid-1')).resolves.toBeUndefined();
      expect(repo.delete).toHaveBeenCalledWith('uuid-1');
    });

    it('throws ConflictException when tag has transactions', async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeTag());
      vi.mocked(repo.hasTransactions).mockResolvedValue(true);

      await expect(service.remove('uuid-1')).rejects.toThrow(ConflictException);
    });
  });
});
