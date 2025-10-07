import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DataIngestionCronService } from './services/data-ingestion-cron.service';
import { MorningstarModule } from '../morningstar/morningstar.module';
import { MutualFundModule } from '../mutual-fund/mutual-fund.module';

/**
 * Cron Module
 * 
 * Purpose: Handle scheduled tasks
 * - Monthly data ingestion (1st of every month)
 * - Future: Rebalancing, reporting, cleanup
 * 
 * Structure:
 * - Services: Cron job handlers
 * - Dependencies: Morningstar, MutualFund modules
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    MorningstarModule,
    MutualFundModule,
  ],
  providers: [DataIngestionCronService],
  exports: [DataIngestionCronService],
})
export class CronModule {}

