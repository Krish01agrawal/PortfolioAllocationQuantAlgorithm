import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MfSchemeTrackRecord, MfSchemeTrackRecordSchema } from './schemas/mf-scheme-track-record.schema';
import { MfSchemeDataMonthwise, MfSchemeDataMonthwiseSchema } from './schemas/mf-scheme-data-monthwise.schema';
import { MfSchemeTrackRecordDao } from './dao/mf-scheme-track-record.dao';
import { MfSchemeDataMonthwiseDao } from './dao/mf-scheme-data-monthwise.dao';
import { MutualFundService } from './services/mutual-fund.service';

/**
 * Mutual Fund Module
 * 
 * Purpose: Manages Collections 1 & 2
 * - Master fund registry
 * - Monthly snapshots
 * - Data ingestion
 * 
 * Structure:
 * - Schemas: MongoDB collections
 * - DAOs: Database access layer (Repository pattern)
 * - Services: Business logic
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
  ],
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

