import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MfSchemeTrackRecord } from '../schemas/mf-scheme-track-record.schema';

/**
 * MF Scheme Track Record DAO (Data Access Object)
 * 
 * Purpose: Repository pattern for Collection 1
 * SOLID: Single Responsibility - Only handles DB operations for Collection 1
 */
@Injectable()
export class MfSchemeTrackRecordDao {
  private readonly logger = new Logger(MfSchemeTrackRecordDao.name);

  constructor(
    @InjectModel(MfSchemeTrackRecord.name)
    private readonly model: Model<MfSchemeTrackRecord>,
  ) {}

  /**
   * Find fund by name
   */
  async findByFundName(fundName: string): Promise<MfSchemeTrackRecord | null> {
    return this.model.findOne({ fund_name: fundName }).exec();
  }

  /**
   * Find fund by ID
   */
  async findById(id: string): Promise<MfSchemeTrackRecord | null> {
    return this.model.findById(id).exec();
  }

  /**
   * Find all active funds
   */
  async findAllActive(): Promise<MfSchemeTrackRecord[]> {
    return this.model.find({ status: 'Active' }).exec();
  }

  /**
   * Find by AMC
   */
  async findByAmc(amc: string): Promise<MfSchemeTrackRecord[]> {
    return this.model.find({ amc }).exec();
  }

  /**
   * Upsert fund master
   */
  async upsert(
    fundName: string,
    data: Partial<MfSchemeTrackRecord>,
  ): Promise<MfSchemeTrackRecord> {
    return this.model.findOneAndUpdate(
      { fund_name: fundName },
      { $set: data },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  /**
   * Add monthly snapshot reference to track list
   */
  async addMonthlyReference(
    fundId: string,
    timestamp: Date,
    snapshotId: string,
  ): Promise<void> {
    const fund = await this.model.findById(fundId);

    if (!fund) {
      throw new Error(`Fund not found: ${fundId}`);
    }

    const existingRef = fund.schemeMonthTrackList.find(
      (track) => track.timestamp.getTime() === timestamp.getTime(),
    );

    if (!existingRef) {
      await this.model.findByIdAndUpdate(fundId, {
        $push: {
          schemeMonthTrackList: {
            timestamp,
            mfDataId: new Types.ObjectId(snapshotId),
          },
        },
      });
    } else {
      await this.model.findOneAndUpdate(
        {
          _id: new Types.ObjectId(fundId),
          'schemeMonthTrackList.timestamp': timestamp,
        },
        {
          $set: {
            'schemeMonthTrackList.$.mfDataId': new Types.ObjectId(snapshotId),
          },
        },
      );
    }
  }

  /**
   * Count total funds
   */
  async count(filter: any = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }
}

