import { Injectable } from '@nestjs/common';
import { TransactionType } from '../transactions/enums/transaction-type.enum.js';
import type { TimelineInterval } from './dto/analytics-query.dto.js';
import { AnalyticsRepository } from './analytics.repository.js';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Injectable()
export class AnalyticsService {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  async getSummary(startDate?: string, endDate?: string) {
    const raw = await this.analyticsRepository.getSummaryRaw(startDate, endDate);

    const totalIncomesInCents = parseInt(raw.totalIncomes, 10);
    const totalExpensesInCents = parseInt(raw.totalExpenses, 10);
    const countExpenses = parseInt(raw.countExpenses, 10);
    const countIncomes = parseInt(raw.countIncomes, 10);
    const netBalanceInCents = totalIncomesInCents - totalExpensesInCents;

    const savingsRatePercent =
      totalIncomesInCents > 0
        ? Math.round((netBalanceInCents / totalIncomesInCents) * 10000) / 100
        : 0;

    const averageExpenseInCents = countExpenses > 0 ? Math.round(totalExpensesInCents / countExpenses) : 0;
    const averageIncomeInCents = countIncomes > 0 ? Math.round(totalIncomesInCents / countIncomes) : 0;

    return {
      totalIncomesInCents,
      totalExpensesInCents,
      netBalanceInCents,
      savingsRatePercent,
      averageExpenseInCents,
      averageIncomeInCents,
      transactionCount: {
        expenses: countExpenses,
        incomes: countIncomes,
        total: countExpenses + countIncomes,
      },
    };
  }

  async getTagsDistribution(type: TransactionType, startDate?: string, endDate?: string) {
    const rows = await this.analyticsRepository.getTagsDistributionRaw(type, startDate, endDate);

    const totalInCents = rows.reduce((sum, r) => sum + parseInt(r.totalInCents, 10), 0);

    const items = rows.map((r) => {
      const rowTotal = parseInt(r.totalInCents, 10);
      const percentage =
        totalInCents > 0 ? Math.round((rowTotal / totalInCents) * 10000) / 100 : 0;

      return {
        tagId: r.tagId,
        tagName: r.tagName,
        colorHex: r.colorHex,
        totalInCents: rowTotal,
        percentage,
        count: parseInt(r.count, 10),
      };
    });

    return { type, totalInCents, items };
  }

  async getTimePatterns(startDate?: string, endDate?: string) {
    const [hourRows, dayRows] = await Promise.all([
      this.analyticsRepository.getHourPatternsRaw(startDate, endDate),
      this.analyticsRepository.getDayOfWeekPatternsRaw(startDate, endDate),
    ]);

    const byHour = hourRows.map((r) => ({
      hour: parseInt(r.hour, 10),
      totalExpensesInCents: parseInt(r.totalExpensesInCents, 10),
      count: parseInt(r.count, 10),
    }));

    const byDayOfWeek = dayRows.map((r) => {
      const dayIndex = parseInt(r.dayOfWeek, 10) - 1;
      return {
        dayOfWeek: parseInt(r.dayOfWeek, 10),
        dayName: DAY_NAMES[dayIndex] ?? 'Unknown',
        totalExpensesInCents: parseInt(r.totalExpensesInCents, 10),
        count: parseInt(r.count, 10),
      };
    });

    return { byHour, byDayOfWeek };
  }

  async getTimeline(interval: TimelineInterval = 'day', startDate?: string, endDate?: string) {
    const rows = await this.analyticsRepository.getTimelineRaw(interval, startDate, endDate);

    const points = rows.map((r) => {
      const incomesInCents = parseInt(r.incomesInCents, 10);
      const expensesInCents = parseInt(r.expensesInCents, 10);
      return {
        date: r.period,
        incomesInCents,
        expensesInCents,
        netBalanceInCents: incomesInCents - expensesInCents,
      };
    });

    return { interval, points };
  }
}
