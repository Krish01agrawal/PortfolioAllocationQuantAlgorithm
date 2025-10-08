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
 * 
 * IMPORTANT: Uses Morningstar field names (PascalCase_Underscore)
 */
@Schema({ 
  collection: 'mfSchemeTrackRecord',
  timestamps: true,
})
export class MfSchemeTrackRecord extends Document {
  @Prop({ required: true, index: true, unique: true, trim: true })
  Fund_ID: string;

  @Prop({ required: true, trim: true })
  Fund_Name: string;

  @Prop({ required: true, index: true })
  Category: string;

  @Prop({ default: 'Active', enum: ['Active', 'Closed', 'Merged', 'Suspended'], index: true })
  status: string;

  @Prop({ type: [SchemeMonthTrackSchema], default: [] })
  schemeMonthTrackList: SchemeMonthTrack[];
}

export const MfSchemeTrackRecordSchema = SchemaFactory.createForClass(MfSchemeTrackRecord);

// Indexes (using Morningstar field names)
MfSchemeTrackRecordSchema.index({ Fund_ID: 1 }, { unique: true });
MfSchemeTrackRecordSchema.index({ Fund_Name: 1 });
MfSchemeTrackRecordSchema.index({ Category: 1 });
MfSchemeTrackRecordSchema.index({ status: 1 });

