import { Module } from '@nestjs/common';
import { MorningstarParserService } from './services/morningstar-parser.service';
import { MorningstarApiService } from './services/morningstar-api.service';

/**
 * Morningstar Module
 * 
 * Purpose: Handle Morningstar data source
 * - API integration (future)
 * - JSON parsing and validation
 * 
 * Structure:
 * - Services: API client, Parser
 */
@Module({
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

