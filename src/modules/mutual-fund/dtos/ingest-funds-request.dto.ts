import { IsArray, IsDateString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MorningstarRawDto } from '../../morningstar/dtos/morningstar-raw.dto';

/**
 * DTO for manual fund data ingestion via API
 * 
 * POST /api/mutual-funds/ingest
 * Body: { funds: [...], timestamp: "2025-10-01" }
 */
export class IngestFundsRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MorningstarRawDto)
  funds: MorningstarRawDto[];

  @IsOptional()
  @IsDateString()
  timestamp?: string; // ISO date string, defaults to current month if not provided
}

