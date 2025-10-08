import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MfSchemeTrackRecord, MfSchemeTrackRecordSchema } from './schemas/mf-scheme-track-record.schema';
import { MfSchemeDataMonthwise, MfSchemeDataMonthwiseSchema } from './schemas/mf-scheme-data-monthwise.schema';
import { MfSchemeTrackRecordDao } from './dao/mf-scheme-track-record.dao';
import { MfSchemeDataMonthwiseDao } from './dao/mf-scheme-data-monthwise.dao';
import { MutualFundService } from './services/mutual-fund.service';
import { MutualFundController } from './controllers/mutual-fund.controller';
import { MorningstarModule } from '../morningstar/morningstar.module';

/**
 * Mutual Fund Module
 * 
 * Purpose: Manages Collections 1 & 2
 * - Master fund registry
 * - Monthly snapshots
 * - Data ingestion
 * - REST API endpoints
 * 
 * Structure:
 * - Schemas: MongoDB collections
 * - DAOs: Database access layer (Repository pattern)
 * - Services: Business logic
 * - Controllers: REST API endpoints
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MfSchemeTrackRecord.name,
        schema: MfSchemeTrackRecordSchema,
      },
      {
        name: MfSchemeDataMonthwise.name,
        schema: MfSchemeDataMonthwiseSchema,
      },
    ]),
    MorningstarModule, // Import for MorningstarParserService
  ],
  controllers: [MutualFundController],
  providers: [
    MfSchemeTrackRecordDao,
    MfSchemeDataMonthwiseDao,
    MutualFundService,
  ],
  exports: [
    MutualFundService,
    MfSchemeTrackRecordDao,
    MfSchemeDataMonthwiseDao,
  ],
})
export class MutualFundModule {}

