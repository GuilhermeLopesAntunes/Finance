import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionType } from '../transactions/enums/transaction-type.enum.js';
import { AnalyticsRepository } from './analytics.repository.js';
import { AnalyticsService } from './analytics.service.js';

const makeAnalyticsRepo = (): AnalyticsRepository =>
  ({
    getSummaryRaw: vi.fn(),
    getTagsDistributionRaw: vi.fn(),
    getHourPatternsRaw: vi.fn(),
    getDayOfWeekPatternsRaw: vi.fn(),
    getTimelineRaw: vi.fn(),
  }) as unknown as AnalyticsRepository;

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let repo: AnalyticsRepository;

  beforeEach(() => {
    repo = makeAnalyticsRepo();
    service = new AnalyticsService(repo);
  });

  describe('getSummary', () => {
    it('calculates summary correctly', async () => {
      vi.mocked(repo.getSummaryRaw).mockResolvedValue({
        totalIncomes: '120000',
        totalExpenses: '3830',
        countExpenses: '2',
        countIncomes: '2',
      });

      const result = await service.getSummary();

      expect(result.totalIncomesInCents).toBe(120000);
      expect(result.totalExpensesInCents).toBe(3830);
      expect(result.netBalanceInCents).toBe(116170);
      expect(result.savingsRatePercent).toBe(96.81);
      expect(result.averageExpenseInCents).toBe(1915);
      expect(result.averageIncomeInCents).toBe(60000);
      expect(result.transactionCount).toEqual({ expenses: 2, incomes: 2, total: 4 });
    });

    it('handles zero incomes without division by zero', async () => {
      vi.mocked(repo.getSummaryRaw).mockResolvedValue({
        totalIncomes: '0',
        totalExpenses: '0',
        countExpenses: '0',
        countIncomes: '0',
      });

      const result = await service.getSummary();

      expect(result.savingsRatePercent).toBe(0);
      expect(result.averageExpenseInCents).toBe(0);
      expect(result.averageIncomeInCents).toBe(0);
      expect(result.netBalanceInCents).toBe(0);
    });

    it('returns negative net balance when expenses exceed incomes', async () => {
      vi.mocked(repo.getSummaryRaw).mockResolvedValue({
        totalIncomes: '1000',
        totalExpenses: '2000',
        countExpenses: '1',
        countIncomes: '1',
      });

      const result = await service.getSummary();

      expect(result.netBalanceInCents).toBe(-1000);
      expect(result.savingsRatePercent).toBe(-100);
    });

    it('passes date range to repository', async () => {
      vi.mocked(repo.getSummaryRaw).mockResolvedValue({
        totalIncomes: '0',
        totalExpenses: '0',
        countExpenses: '0',
        countIncomes: '0',
      });

      await service.getSummary('2026-10-01T00:00:00.000Z', '2026-10-31T23:59:59.999Z');

      expect(repo.getSummaryRaw).toHaveBeenCalledWith('2026-10-01T00:00:00.000Z', '2026-10-31T23:59:59.999Z');
    });
  });

  describe('getTagsDistribution', () => {
    it('calculates percentages and totals correctly', async () => {
      vi.mocked(repo.getTagsDistributionRaw).mockResolvedValue([
        { tagId: 'tag-lazer-id', tagName: 'Lazer', colorHex: '#E63946', totalInCents: '3000', count: '1' },
        { tagId: 'tag-transp-id', tagName: 'Transporte', colorHex: '#457B9D', totalInCents: '830', count: '1' },
      ]);

      const result = await service.getTagsDistribution(TransactionType.EXPENSE);

      expect(result.type).toBe(TransactionType.EXPENSE);
      expect(result.totalInCents).toBe(3830);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].percentage).toBe(78.33);
      expect(result.items[1].percentage).toBe(21.67);
    });

    it('returns empty items and zero total when no transactions', async () => {
      vi.mocked(repo.getTagsDistributionRaw).mockResolvedValue([]);

      const result = await service.getTagsDistribution(TransactionType.EXPENSE);

      expect(result.totalInCents).toBe(0);
      expect(result.items).toHaveLength(0);
    });

    it('handles single tag with 100% percentage', async () => {
      vi.mocked(repo.getTagsDistributionRaw).mockResolvedValue([
        { tagId: 'tag-1', tagName: 'Alimentação', colorHex: '#FF0000', totalInCents: '5000', count: '3' },
      ]);

      const result = await service.getTagsDistribution(TransactionType.EXPENSE);

      expect(result.items[0].percentage).toBe(100);
      expect(result.items[0].count).toBe(3);
    });
  });

  describe('getTimePatterns', () => {
    it('maps hour and day patterns correctly', async () => {
      vi.mocked(repo.getHourPatternsRaw).mockResolvedValue([
        { hour: '8', totalExpensesInCents: '830', count: '1' },
        { hour: '21', totalExpensesInCents: '3000', count: '1' },
      ]);
      vi.mocked(repo.getDayOfWeekPatternsRaw).mockResolvedValue([
        { dayOfWeek: '6', totalExpensesInCents: '3830', count: '2' },
      ]);

      const result = await service.getTimePatterns();

      expect(result.byHour).toHaveLength(2);
      expect(result.byHour[0]).toEqual({ hour: 8, totalExpensesInCents: 830, count: 1 });
      expect(result.byHour[1]).toEqual({ hour: 21, totalExpensesInCents: 3000, count: 1 });
      expect(result.byDayOfWeek[0].dayName).toBe('Friday');
      expect(result.byDayOfWeek[0].totalExpensesInCents).toBe(3830);
    });

    it('returns empty arrays when no expense data', async () => {
      vi.mocked(repo.getHourPatternsRaw).mockResolvedValue([]);
      vi.mocked(repo.getDayOfWeekPatternsRaw).mockResolvedValue([]);

      const result = await service.getTimePatterns();

      expect(result.byHour).toHaveLength(0);
      expect(result.byDayOfWeek).toHaveLength(0);
    });
  });

  describe('getTimeline', () => {
    it('calculates net balance per point', async () => {
      vi.mocked(repo.getTimelineRaw).mockResolvedValue([
        { period: '2026-10-01', incomesInCents: '120000', expensesInCents: '3830' },
      ]);

      const result = await service.getTimeline('day');

      expect(result.interval).toBe('day');
      expect(result.points).toHaveLength(1);
      expect(result.points[0]).toEqual({
        date: '2026-10-01',
        incomesInCents: 120000,
        expensesInCents: 3830,
        netBalanceInCents: 116170,
      });
    });

    it('defaults to day interval', async () => {
      vi.mocked(repo.getTimelineRaw).mockResolvedValue([]);

      await service.getTimeline();

      expect(repo.getTimelineRaw).toHaveBeenCalledWith('day', undefined, undefined);
    });

    it('returns empty points for empty period', async () => {
      vi.mocked(repo.getTimelineRaw).mockResolvedValue([]);

      const result = await service.getTimeline('month');

      expect(result.points).toHaveLength(0);
    });
  });
});
