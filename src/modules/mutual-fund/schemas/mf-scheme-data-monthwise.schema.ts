import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Collection 2: MF Scheme Data Monthwise
 * 
 * Purpose: Time-series storage of monthly fund parameters
 * Design Pattern: Time-Series Pattern
 * Schema: Matches EXACT Morningstar API format (snake_case)
 */
@Schema({ 
  collection: 'mfSchemeDataMonthwise',
  timestamps: { createdAt: true, updatedAt: false },
})
export class MfSchemeDataMonthwise extends Document {
  @Prop({ required: true, index: true, type: Date })
  timestamp: Date;

  @Prop({ required: true, type: Types.ObjectId, ref: 'MfSchemeTrackRecord', index: true })
  fundId: Types.ObjectId;

  // ==========================================
  // REQUIRED FIELDS (Matching Morningstar)
  // ==========================================
  
  @Prop({ required: true, trim: true })
  fund_name: string;

  @Prop({ required: true, index: true })
  fund_category: string;

  // ==========================================
  // QUANTITATIVE PARAMETERS (17)
  // ==========================================
  
  @Prop({ type: Number })
  five_year_cagr_equity?: number;

  @Prop({ type: Number })
  five_year_cagr_debt_hybrid?: number;

  @Prop({ type: Number, min: 0, max: 100 })
  three_year_rolling_consistency?: number;

  @Prop({ type: Number })
  sharpe_ratio?: number;

  @Prop({ type: Number })
  sortino_ratio?: number;

  @Prop({ type: Number })
  alpha?: number;

  @Prop({ type: Number })
  beta?: number;

  @Prop({ type: Number })
  std_dev_equity?: number;

  @Prop({ type: Number })
  std_dev_debt_hybrid?: number;

  @Prop({ type: Number })
  max_drawdown?: number;

  @Prop({ type: Number })
  recovery_period?: number;

  @Prop({ type: Number })
  downside_capture_ratio?: number;

  @Prop({ type: Number })
  expense_ratio_equity?: number;

  @Prop({ type: Number })
  expense_ratio_debt?: number;

  @Prop({ type: Number })
  aum_equity?: number;

  @Prop({ type: Number })
  aum_debt?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  liquidity_risk?: number;

  @Prop({ type: Number })
  portfolio_turnover_ratio?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  concentration_sector_fit?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  style_fit?: number;

  // ==========================================
  // QUALITATIVE PARAMETERS (5)
  // ==========================================
  
  @Prop({ type: Number, min: 1, max: 5 })
  fund_house_reputation?: number;

  @Prop({ type: Number })
  fund_manager_tenure?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  fund_manager_track_record?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  amc_risk_management?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  esg_governance?: number;

  // ==========================================
  // FORWARD-LOOKING PARAMETERS (5)
  // ==========================================
  
  @Prop({ type: Number, min: 1, max: 5 })
  benchmark_consistency?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  peer_comparison?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  tax_efficiency?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  fund_innovation?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  forward_risk_mitigation?: number;
}

export const MfSchemeDataMonthwiseSchema = SchemaFactory.createForClass(MfSchemeDataMonthwise);

// Compound index for efficient queries
MfSchemeDataMonthwiseSchema.index({ fundId: 1, timestamp: -1 });
MfSchemeDataMonthwiseSchema.index({ fund_category: 1, timestamp: -1 });
MfSchemeDataMonthwiseSchema.index({ timestamp: -1 });
