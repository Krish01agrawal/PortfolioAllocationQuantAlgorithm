import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { DatabaseModule } from '../database/database.module';
import { MutualFundModule } from '../modules/mutual-fund/mutual-fund.module';
import { MorningstarModule } from '../modules/morningstar/morningstar.module';
import { CronModule } from '../modules/cron/cron.module';

/**
 * Application Root Module
 * 
 * Purpose: Bootstrap the entire NestJS application
 * 
 * Structure:
 * - Config: Global configuration
 * - Database: MongoDB connection
 * - Modules: Feature modules (mutual-fund, morningstar, cron)
 */
@Module({
  imports: [
    // Core
    ConfigModule,
    DatabaseModule,

    // Feature Modules
    MutualFundModule,
    MorningstarModule,
    CronModule,

    // TODO: Future modules
    // ScoringEngineModule (Collections 3 & 4)
    // AllocationModule (Portfolio construction)
    // BseIntegrationModule (Trade execution)
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

