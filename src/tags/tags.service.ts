import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto.js';
import { UpdateTagDto } from './dto/update-tag.dto.js';
import { Tag } from './entities/tag.entity.js';
import { TagsRepository } from './tags.repository.js';

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

@Injectable()
export class TagsService {
  constructor(private readonly tagsRepository: TagsRepository) {}

  private validateColor(colorHex: string): void {
    if (!HEX_COLOR_REGEX.test(colorHex)) {
      throw new BadRequestException(
        `Invalid hex color format: "${colorHex}". Expected #RGB or #RRGGBB.`,
      );
    }
  }

  async create(dto: CreateTagDto): Promise<Tag> {
    this.validateColor(dto.colorHex);

    const existing = await this.tagsRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictException(`Tag with name "${dto.name}" already exists.`);
    }

    const tag = this.tagsRepository.create(dto);
    return this.tagsRepository.save(tag);
  }

  async findAll(): Promise<Tag[]> {
    return this.tagsRepository.findAll();
  }

  async findOne(id: string): Promise<Tag> {
    const tag = await this.tagsRepository.findById(id);
    if (!tag) {
      throw new NotFoundException(`Tag "${id}" not found.`);
    }
    return tag;
  }

  async update(id: string, dto: UpdateTagDto): Promise<Tag> {
    const tag = await this.findOne(id);

    if (dto.colorHex !== undefined) {
      this.validateColor(dto.colorHex);
      tag.colorHex = dto.colorHex;
    }

    if (dto.name !== undefined) {
      if (dto.name !== tag.name) {
        const existing = await this.tagsRepository.findByName(dto.name);
        if (existing) {
          throw new ConflictException(
            `Tag with name "${dto.name}" already exists.`,
          );
        }
      }
      tag.name = dto.name;
    }

    return this.tagsRepository.save(tag);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    const hasTransactions = await this.tagsRepository.hasTransactions(id);
    if (hasTransactions) {
      throw new ConflictException(
        `Tag "${id}" cannot be deleted because it has associated transactions.`,
      );
    }

    await this.tagsRepository.delete(id);
  }
}
