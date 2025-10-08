import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MfSchemeDataMonthwise } from '../schemas/mf-scheme-data-monthwise.schema';
import { MorningstarRawDto } from '../../morningstar/dtos/morningstar-raw.dto';

/**
 * MF Scheme Data Monthwise DAO (Data Access Object)
 * 
 * Purpose: Repository pattern for Collection 2
 * SOLID: Single Responsibility - Only handles DB operations for Collection 2
 * 
 * IMPORTANT: Works with Morningstar format AS-IS (PascalCase_Underscore)
 */
@Injectable()
export class MfSchemeDataMonthwiseDao {
  private readonly logger = new Logger(MfSchemeDataMonthwiseDao.name);

  constructor(
    @InjectModel(MfSchemeDataMonthwise.name)
    private readonly model: Model<MfSchemeDataMonthwise>,
  ) {}

  /**
   * Find by fund ID and timestamp
   */
  async findByFundAndTimestamp(
    fundId: string,
    timestamp: Date,
  ): Promise<MfSchemeDataMonthwise | null> {
    return this.model.findOne({
      fundId: new Types.ObjectId(fundId),
      timestamp,
    }).exec();
  }

  /**
   * Find all funds for a specific category and timestamp
   */
  async findByCategoryAndTimestamp(
    category: string,
    timestamp: Date,
  ): Promise<MfSchemeDataMonthwise[]> {
    return this.model.find({
      Category: category,
      timestamp,
    }).exec();
  }

  /**
   * Find historical data for a fund
   */
  async findFundHistory(
    fundId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<MfSchemeDataMonthwise[]> {
    const query: any = { fundId: new Types.ObjectId(fundId) };

    if (fromDate || toDate) {
      query.timestamp = {};
      if (fromDate) query.timestamp.$gte = fromDate;
      if (toDate) query.timestamp.$lte = toDate;
    }

    return this.model.find(query).sort({ timestamp: -1 }).exec();
  }

  /**
   * Find all funds for a specific timestamp
   */
  async findByTimestamp(timestamp: Date): Promise<MfSchemeDataMonthwise[]> {
    return this.model.find({ timestamp }).exec();
  }

  /**
   * Insert new monthly snapshot (Morningstar format AS-IS)
   */
  async create(
    fundId: string,
    timestamp: Date,
    fundData: MorningstarRawDto,
  ): Promise<MfSchemeDataMonthwise> {
    const snapshot = new this.model({
      timestamp,
      fundId: new Types.ObjectId(fundId),
      // Store Morningstar data AS-IS (source of truth)
      ...fundData,
    });

    return snapshot.save();
  }

  /**
   * Update existing monthly snapshot
   */
  async update(
    id: string,
    fundData: MorningstarRawDto,
  ): Promise<MfSchemeDataMonthwise | null> {
    return this.model.findByIdAndUpdate(
      id,
      { $set: fundData },
      { new: true },
    ).exec();
  }

  /**
   * Get latest snapshot for each fund in a category
   */
  async findLatestByCategory(category: string): Promise<MfSchemeDataMonthwise[]> {
    return this.model.aggregate([
      { $match: { Category: category } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$fundId',
          latestSnapshot: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$latestSnapshot' } },
    ]);
  }

  /**
   * Count documents
   */
  async count(filter: any = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }
}
