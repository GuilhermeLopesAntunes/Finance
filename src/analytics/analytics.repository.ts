import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transactions/entities/transaction.entity.js';
import { TransactionType } from '../transactions/enums/transaction-type.enum.js';
import type { TimelineInterval } from './dto/analytics-query.dto.js';

export interface SummaryRaw {
  totalIncomes: string;
  totalExpenses: string;
  countExpenses: string;
  countIncomes: string;
}

export interface TagDistributionRaw {
  tagId: string;
  tagName: string;
  colorHex: string;
  totalInCents: string;
  count: string;
}

export interface HourPatternRaw {
  hour: string;
  totalExpensesInCents: string;
  count: string;
}

export interface DayOfWeekPatternRaw {
  dayOfWeek: string;
  totalExpensesInCents: string;
  count: string;
}

export interface TimelinePointRaw {
  period: string;
  incomesInCents: string;
  expensesInCents: string;
}

@Injectable()
export class AnalyticsRepository {
  constructor(
    @InjectRepository(Transaction)
    private readonly repo: Repository<Transaction>,
  ) {}

  private applyDateRange(
    qb: ReturnType<typeof this.repo.createQueryBuilder>,
    alias: string,
    startDate?: string,
    endDate?: string,
  ) {
    if (startDate) {
      qb.andWhere(`${alias}.transactedAt >= :startDate`, { startDate: new Date(startDate) });
    }
    if (endDate) {
      qb.andWhere(`${alias}.transactedAt <= :endDate`, { endDate: new Date(endDate) });
    }
  }

  async getSummaryRaw(startDate?: string, endDate?: string): Promise<SummaryRaw> {
    const qb = this.repo
      .createQueryBuilder('t')
      .select([
        `COALESCE(SUM(CASE WHEN t.type = 'INCOME' THEN t.amountInCents ELSE 0 END), 0) AS totalIncomes`,
        `COALESCE(SUM(CASE WHEN t.type = 'EXPENSE' THEN t.amountInCents ELSE 0 END), 0) AS totalExpenses`,
        `COALESCE(SUM(CASE WHEN t.type = 'EXPENSE' THEN 1 ELSE 0 END), 0) AS countExpenses`,
        `COALESCE(SUM(CASE WHEN t.type = 'INCOME' THEN 1 ELSE 0 END), 0) AS countIncomes`,
      ]);

    this.applyDateRange(qb, 't', startDate, endDate);

    const raw = await qb.getRawOne<SummaryRaw>();
    return raw ?? { totalIncomes: '0', totalExpenses: '0', countExpenses: '0', countIncomes: '0' };
  }

  async getTagsDistributionRaw(
    type: TransactionType,
    startDate?: string,
    endDate?: string,
  ): Promise<TagDistributionRaw[]> {
    const qb = this.repo
      .createQueryBuilder('t')
      .innerJoin('t.tag', 'tag')
      .select([
        't.tagId AS tagId',
        'tag.name AS tagName',
        'tag.colorHex AS colorHex',
        'SUM(t.amountInCents) AS totalInCents',
        'COUNT(*) AS count',
      ])
      .where('t.type = :type', { type })
      .groupBy('t.tagId')
      .addGroupBy('tag.name')
      .addGroupBy('tag.colorHex')
      .orderBy('totalInCents', 'DESC');

    this.applyDateRange(qb, 't', startDate, endDate);

    return qb.getRawMany<TagDistributionRaw>();
  }

  async getHourPatternsRaw(startDate?: string, endDate?: string): Promise<HourPatternRaw[]> {
    const qb = this.repo
      .createQueryBuilder('t')
      .select([
        'EXTRACT(HOUR FROM t.transactedAt) AS hour',
        'SUM(t.amountInCents) AS totalExpensesInCents',
        'COUNT(*) AS count',
      ])
      .where('t.type = :type', { type: TransactionType.EXPENSE })
      .groupBy('hour')
      .orderBy('hour', 'ASC');

    this.applyDateRange(qb, 't', startDate, endDate);

    return qb.getRawMany<HourPatternRaw>();
  }

  async getDayOfWeekPatternsRaw(startDate?: string, endDate?: string): Promise<DayOfWeekPatternRaw[]> {
    const qb = this.repo
      .createQueryBuilder('t')
      .select([
        'DAYOFWEEK(t.transactedAt) AS dayOfWeek',
        'SUM(t.amountInCents) AS totalExpensesInCents',
        'COUNT(*) AS count',
      ])
      .where('t.type = :type', { type: TransactionType.EXPENSE })
      .groupBy('dayOfWeek')
      .orderBy('dayOfWeek', 'ASC');

    this.applyDateRange(qb, 't', startDate, endDate);

    return qb.getRawMany<DayOfWeekPatternRaw>();
  }

  async getTimelineRaw(
    interval: TimelineInterval,
    startDate?: string,
    endDate?: string,
  ): Promise<TimelinePointRaw[]> {
    const periodExpr =
      interval === 'day'
        ? `DATE_FORMAT(t.transactedAt, '%Y-%m-%d')`
        : interval === 'week'
          ? `DATE_FORMAT(DATE_SUB(t.transactedAt, INTERVAL WEEKDAY(t.transactedAt) DAY), '%Y-%m-%d')`
          : `DATE_FORMAT(t.transactedAt, '%Y-%m-01')`;

    const qb = this.repo
      .createQueryBuilder('t')
      .select([
        `${periodExpr} AS period`,
        `COALESCE(SUM(CASE WHEN t.type = 'INCOME' THEN t.amountInCents ELSE 0 END), 0) AS incomesInCents`,
        `COALESCE(SUM(CASE WHEN t.type = 'EXPENSE' THEN t.amountInCents ELSE 0 END), 0) AS expensesInCents`,
      ])
      .groupBy('period')
      .orderBy('period', 'ASC');

    this.applyDateRange(qb, 't', startDate, endDate);

    return qb.getRawMany<TimelinePointRaw>();
  }
}
