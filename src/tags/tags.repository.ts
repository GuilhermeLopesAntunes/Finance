import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity.js';

@Injectable()
export class TagsRepository {
  constructor(
    @InjectRepository(Tag)
    private readonly repo: Repository<Tag>,
  ) {}

  create(data: Partial<Tag>): Tag {
    return this.repo.create(data);
  }

  async save(tag: Tag): Promise<Tag> {
    return this.repo.save(tag);
  }

  async findAll(): Promise<Tag[]> {
    return this.repo.find();
  }

  async findById(id: string): Promise<Tag | null> {
    return this.repo.findOneBy({ id });
  }

  async findByName(name: string): Promise<Tag | null> {
    return this.repo.findOneBy({ name });
  }

  async hasTransactions(id: string): Promise<boolean> {
    const tag = await this.repo.findOne({
      where: { id },
      relations: ['transactions'],
    });
    return (tag?.transactions?.length ?? 0) > 0;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
