import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MfSchemeDataMonthwise } from '../schemas/mf-scheme-data-monthwise.schema';
import { FundDataDto } from '../dtos/fund-data.dto';

/**
 * MF Scheme Data Monthwise DAO (Data Access Object)
 * 
 * Purpose: Repository pattern for Collection 2
 * SOLID: Single Responsibility - Only handles DB operations for Collection 2
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
      fundCategory: category,
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
   * Insert new monthly snapshot
   */
  async create(
    fundId: string,
    timestamp: Date,
    fundData: FundDataDto,
  ): Promise<MfSchemeDataMonthwise> {
    const snapshot = new this.model({
      timestamp,
      fundId: new Types.ObjectId(fundId),
      fund_name: fundData.fund_name,
      fund_category: fundData.fund_category,
      // Quantitative parameters
      five_year_cagr_equity: fundData.five_year_cagr_equity,
      five_year_cagr_debt_hybrid: fundData.five_year_cagr_debt_hybrid,
      three_year_rolling_consistency: fundData.three_year_rolling_consistency,
      sharpe_ratio: fundData.sharpe_ratio,
      sortino_ratio: fundData.sortino_ratio,
      alpha: fundData.alpha,
      beta: fundData.beta,
      std_dev_equity: fundData.std_dev_equity,
      std_dev_debt_hybrid: fundData.std_dev_debt_hybrid,
      max_drawdown: fundData.max_drawdown,
      recovery_period: fundData.recovery_period,
      downside_capture_ratio: fundData.downside_capture_ratio,
      expense_ratio_equity: fundData.expense_ratio_equity,
      expense_ratio_debt: fundData.expense_ratio_debt,
      aum_equity: fundData.aum_equity,
      aum_debt: fundData.aum_debt,
      liquidity_risk: fundData.liquidity_risk,
      portfolio_turnover_ratio: fundData.portfolio_turnover_ratio,
      concentration_sector_fit: fundData.concentration_sector_fit,
      style_fit: fundData.style_fit,
      // Qualitative parameters
      fund_house_reputation: fundData.fund_house_reputation,
      fund_manager_tenure: fundData.fund_manager_tenure,
      fund_manager_track_record: fundData.fund_manager_track_record,
      amc_risk_management: fundData.amc_risk_management,
      esg_governance: fundData.esg_governance,
      // Forward-looking parameters
      benchmark_consistency: fundData.benchmark_consistency,
      peer_comparison: fundData.peer_comparison,
      tax_efficiency: fundData.tax_efficiency,
      fund_innovation: fundData.fund_innovation,
      forward_risk_mitigation: fundData.forward_risk_mitigation,
    });

    return snapshot.save();
  }

  /**
   * Update existing monthly snapshot
   */
  async update(
    id: string,
    fundData: FundDataDto,
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
      { $match: { fund_category: category } },
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

