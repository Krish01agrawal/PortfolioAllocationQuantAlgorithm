import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Collection 2: MF Scheme Data Monthwise
 * 
 * Purpose: Time-series storage of monthly fund parameters
 * Design Pattern: Time-Series Pattern
 * 
 * IMPORTANT: Stores Morningstar data AS-IS (PascalCase_Underscore)
 * This is the SOURCE OF TRUTH - no transformation!
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
  // MORNINGSTAR FIELDS (AS-IS, SOURCE OF TRUTH)
  // ==========================================
  
  @Prop({ required: true, trim: true })
  Fund_ID: string;

  @Prop({ required: true, trim: true })
  Fund_Name: string;

  @Prop({ required: true, index: true })
  Category: string;

  // Basic metrics
  @Prop({ type: Number })
  NAV?: number;

  @Prop({ type: Number })
  AUM_Cr?: number;

  // Performance metrics
  @Prop({ type: Number })
  '5Y_CAGR'?: number;

  @Prop({ type: Number })
  '3Y_Rolling'?: number;

  @Prop({ type: Number })
  Sharpe_3Y?: number;

  @Prop({ type: Number })
  Sortino_3Y?: number;

  @Prop({ type: Number })
  Alpha?: number;

  @Prop({ type: Number })
  Beta?: number;

  @Prop({ type: Number })
  Std_Dev?: number;

  @Prop({ type: Number })
  Max_DD?: number;

  @Prop({ type: Number })
  Recovery_Mo?: number;

  @Prop({ type: Number })
  Downside_Capture?: number;

  @Prop({ type: Number })
  Expense?: number;

  @Prop({ type: Number })
  Turnover?: number;

  @Prop({ type: Number })
  Concentration?: number;

  // Qualitative fields (TEXT - store AS-IS from Morningstar)
  @Prop({ type: String })
  Fund_House?: string;

  @Prop({ type: Number })
  Manager_Tenure?: number;

  @Prop({ type: String })
  Manager_Record?: string;

  @Prop({ type: String })
  AMC_Risk?: string;

  @Prop({ type: String })
  ESG?: string;
}

export const MfSchemeDataMonthwiseSchema = SchemaFactory.createForClass(MfSchemeDataMonthwise);

// Compound index for efficient queries (using Morningstar field names)
MfSchemeDataMonthwiseSchema.index({ fundId: 1, timestamp: -1 });
MfSchemeDataMonthwiseSchema.index({ Category: 1, timestamp: -1 });
MfSchemeDataMonthwiseSchema.index({ Fund_ID: 1, timestamp: -1 });
MfSchemeDataMonthwiseSchema.index({ timestamp: -1 });
