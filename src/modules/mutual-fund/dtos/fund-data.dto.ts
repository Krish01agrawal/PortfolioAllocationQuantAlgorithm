import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  Min, 
  Max, 
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { FUND_CATEGORIES } from '../../../enums';

/**
 * DTO for Morningstar Fund Data Validation
 * 
 * Purpose: Validate incoming fund data matching EXACT Morningstar schema
 * Format: snake_case (as received from Morningstar API)
 */
export class FundDataDto {
  // ==========================================
  // REQUIRED FIELDS
  // ==========================================

  @IsString()
  @IsNotEmpty({ message: 'fund_name is required' })
  @Transform(({ value }) => value?.trim())
  fund_name: string;

  @IsString()
  @IsNotEmpty({ message: 'fund_category is required' })
  @IsEnum(FUND_CATEGORIES, { message: 'Invalid fund_category' })
  fund_category: string;

  // ==========================================
  // OPTIONAL METADATA
  // ==========================================

  @IsOptional()
  @IsString()
  risk_profile?: string;

  @IsOptional()
  @IsString()
  amc?: string;

  @IsOptional()
  @IsString()
  scheme_code?: string;

  @IsOptional()
  @IsString()
  isin?: string;

  // ==========================================
  // QUANTITATIVE PARAMETERS (17)
  // ==========================================

  @IsOptional()
  @IsNumber({}, { message: 'five_year_cagr_equity must be a number' })
  @Min(-50)
  @Max(100)
  five_year_cagr_equity?: number;

  @IsOptional()
  @IsNumber()
  @Min(-10)
  @Max(20)
  five_year_cagr_debt_hybrid?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  three_year_rolling_consistency?: number;

  @IsOptional()
  @IsNumber()
  sharpe_ratio?: number;

  @IsOptional()
  @IsNumber()
  sortino_ratio?: number;

  @IsOptional()
  @IsNumber()
  alpha?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  beta?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  std_dev_equity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  std_dev_debt_hybrid?: number;

  @IsOptional()
  @IsNumber()
  @Max(0)
  max_drawdown?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  recovery_period?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  downside_capture_ratio?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  expense_ratio_equity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  expense_ratio_debt?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  aum_equity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  aum_debt?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  liquidity_risk?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  portfolio_turnover_ratio?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  concentration_sector_fit?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  style_fit?: number;

  // ==========================================
  // QUALITATIVE PARAMETERS (5)
  // ==========================================

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  fund_house_reputation?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fund_manager_tenure?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  fund_manager_track_record?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  amc_risk_management?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  esg_governance?: number;

  // ==========================================
  // FORWARD-LOOKING PARAMETERS (5)
  // ==========================================

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  benchmark_consistency?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  peer_comparison?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  tax_efficiency?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  fund_innovation?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  forward_risk_mitigation?: number;
}
