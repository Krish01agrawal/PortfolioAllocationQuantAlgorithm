import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Morningstar Raw Data DTO
 * 
 * Purpose: Validate incoming data from Morningstar API
 * Format: EXACT format as received from Morningstar (PascalCase_Underscore)
 * 
 * NOTE: This is the ACTUAL format from Morningstar, not our internal format
 */
export class MorningstarRawDto {
  // ==========================================
  // IDENTIFICATION FIELDS (Required)
  // ==========================================

  @IsString()
  @IsNotEmpty()
  Fund_ID: string;

  @IsString()
  @IsNotEmpty()
  Fund_Name: string;

  @IsString()
  @IsNotEmpty()
  Category: string;

  // ==========================================
  // BASIC METRICS
  // ==========================================

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value === '' || value === null ? null : Number(value))
  NAV?: number | null;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value === '' || value === null ? null : Number(value))
  AUM_Cr?: number | null;

  // ==========================================
  // PERFORMANCE METRICS (Quantitative)
  // ==========================================

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value === '' || value === null ? null : Number(value))
  '5Y_CAGR'?: number | null;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value === '' || value === null ? null : Number(value))
  '3Y_Rolling'?: number | null;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value === '' || value === null ? null : Number(value))
  Sharpe_3Y?: number | null;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value === '' || value === null ? null : Number(value))
  Sortino_3Y?: number | null;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value === '' || value === null ? null : Number(value))
  Alpha?: number | null;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value === '' || value === null ? null : Number(value))
  Beta?: number | null;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value === '' || value === null ? null : Number(value))
  Std_Dev?: number | null;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value === '' || value === null ? null : Number(value))
  Max_DD?: number | null;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value === '' || value === null ? null : Number(value))
  Recovery_Mo?: number | null;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value === '' || value === null ? null : Number(value))
  Downside_Capture?: number | null;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value === '' || value === null ? null : Number(value))
  Expense?: number | null;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value === '' || value === null ? null : Number(value))
  Turnover?: number | null;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value === '' || value === null ? null : Number(value))
  Concentration?: number | null;

  // ==========================================
  // QUALITATIVE METRICS (Text Values)
  // ==========================================

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value === '' ? null : value)
  Fund_House?: string | null;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value === '' || value === null ? null : Number(value))
  Manager_Tenure?: number | null;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value === '' ? null : value)
  Manager_Record?: string | null;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value === '' ? null : value)
  AMC_Risk?: string | null;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value === '' ? null : value)
  ESG?: string | null;
}

