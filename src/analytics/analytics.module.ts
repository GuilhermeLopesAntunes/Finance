import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../transactions/entities/transaction.entity.js';
import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsRepository } from './analytics.repository.js';
import { AnalyticsService } from './analytics.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsRepository],
})
export class AnalyticsModule {}
