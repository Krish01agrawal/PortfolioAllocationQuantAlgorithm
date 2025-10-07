import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Embedded subdocument for tracking monthly data references
 */
@Schema({ _id: false })
export class SchemeMonthTrack {
  @Prop({ required: true, type: Date })
  timestamp: Date;

  @Prop({ required: true, type: Types.ObjectId, ref: 'MfSchemeDataMonthwise' })
  mfDataId: Types.ObjectId;
}

export const SchemeMonthTrackSchema = SchemaFactory.createForClass(SchemeMonthTrack);

/**
 * Collection 1: MF Scheme Track Record
 * 
 * Purpose: Master registry of all mutual funds
 * Design Pattern: Registry Pattern + Reference Pattern
 */
@Schema({ 
  collection: 'mfSchemeTrackRecord',
  timestamps: true,
})
export class MfSchemeTrackRecord extends Document {
  @Prop({ required: true, index: true, unique: true, trim: true })
  fund_name: string;

  @Prop({ index: true, trim: true })
  amc?: string;

  @Prop({ unique: true, sparse: true, trim: true })
  schemeCode?: string;

  @Prop({ trim: true })
  isin?: string;

  @Prop({ default: 'Regular', enum: ['Regular', 'Direct'] })
  plan: string;

  @Prop({ default: 'Growth', enum: ['Growth', 'IDCW'] })
  option: string;

  @Prop({ type: Date })
  inceptionDate?: Date;

  @Prop({ default: 'Active', enum: ['Active', 'Closed', 'Merged', 'Suspended'], index: true })
  status: string;

  @Prop({ type: [SchemeMonthTrackSchema], default: [] })
  schemeMonthTrackList: SchemeMonthTrack[];
}

export const MfSchemeTrackRecordSchema = SchemaFactory.createForClass(MfSchemeTrackRecord);

// Indexes
MfSchemeTrackRecordSchema.index({ fund_name: 1 });
MfSchemeTrackRecordSchema.index({ schemeCode: 1 }, { unique: true, sparse: true });
MfSchemeTrackRecordSchema.index({ status: 1 });
MfSchemeTrackRecordSchema.index({ amc: 1 });

