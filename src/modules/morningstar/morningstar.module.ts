import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MorningstarParserService } from './services/morningstar-parser.service';
import { MorningstarApiService } from './services/morningstar-api.service';

/**
 * Morningstar Module
 * 
 * Purpose: Handle Morningstar data source
 * - API integration for fetching fund data
 * - JSON parsing and validation
 * - Category normalization
 * 
 * Philosophy: Store Morningstar data AS-IS (source of truth)
 * 
 * Structure:
 * - Services: API client (HTTP), Parser (validation)
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 30000, // 30 seconds
      maxRedirects: 5,
    }),
  ],
  providers: [
    MorningstarParserService,
    MorningstarApiService,
  ],
  exports: [
    MorningstarParserService,
    MorningstarApiService,
  ],
})
export class MorningstarModule {}

