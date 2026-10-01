import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Tag } from '../../tags/entities/tag.entity.js';
import { TransactionType } from '../enums/transaction-type.enum.js';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'bigint' })
  amountInCents: number;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'uuid' })
  tagId: string;

  @ManyToOne(() => Tag, (tag) => tag.transactions, { eager: false })
  @JoinColumn({ name: 'tagId' })
  tag: Relation<Tag>;

  @Column({ type: 'datetime' })
  transactedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
