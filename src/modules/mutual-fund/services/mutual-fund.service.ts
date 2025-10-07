import { Injectable, Logger } from '@nestjs/common';
import { MfSchemeTrackRecordDao } from '../dao/mf-scheme-track-record.dao';
import { MfSchemeDataMonthwiseDao } from '../dao/mf-scheme-data-monthwise.dao';
import { FundDataDto } from '../dtos/fund-data.dto';

/**
 * Ingestion Result Interface
 */
export interface IngestionResult {
  success: boolean;
  fundsProcessed: number;
  fundsAdded: number;
  fundsUpdated: number;
  errors: string[];
  timestamp: Date;
}

/**
 * Mutual Fund Service
 * 
 * Purpose: Business logic for mutual fund operations
 * - Uses DAOs for database access
 * - Handles ingestion workflow
 * - Maintains referential integrity
 * 
 * SOLID: Single Responsibility - Only handles mutual fund business logic
 */
@Injectable()
export class MutualFundService {
  private readonly logger = new Logger(MutualFundService.name);

  constructor(
    private readonly trackRecordDao: MfSchemeTrackRecordDao,
    private readonly monthwiseDao: MfSchemeDataMonthwiseDao,
  ) {}

  /**
   * Ingest monthly fund data
   * 
   * Workflow:
   * 1. Normalize timestamp
   * 2. For each fund:
   *    a. Upsert master record
   *    b. Insert/update snapshot
   *    c. Update reference list
   */
  async ingestMonthlyData(
    fundData: FundDataDto[],
    timestamp: Date,
  ): Promise<IngestionResult> {
    this.logger.log(
      `🚀 Starting ingestion of ${fundData.length} funds for ${timestamp.toISOString()}`,
    );

    const normalizedTimestamp = this.normalizeTimestamp(timestamp);

    const result: IngestionResult = {
      success: false,
      fundsProcessed: 0,
      fundsAdded: 0,
      fundsUpdated: 0,
      errors: [],
      timestamp: normalizedTimestamp,
    };

    for (const fund of fundData) {
      try {
        // Step 1: Upsert master record
        const fundMaster = await this.trackRecordDao.upsert(fund.fund_name, {
          fund_name: fund.fund_name,
          amc: fund.amc,
          scheme_code: fund.scheme_code,
          isin: fund.isin,
        } as any);

        const fundId = fundMaster._id.toString();

        // Step 2: Check if snapshot exists
        const existingSnapshot = await this.monthwiseDao.findByFundAndTimestamp(
          fundId,
          normalizedTimestamp,
        );

        if (existingSnapshot) {
          // Update existing
          await this.monthwiseDao.update(existingSnapshot._id.toString(), fund);
          result.fundsUpdated++;
          this.logger.debug(`✏️ Updated snapshot for ${fund.fund_name}`);
        } else {
          // Insert new
          const snapshot = await this.monthwiseDao.create(
            fundId,
            normalizedTimestamp,
            fund,
          );
          result.fundsAdded++;
          this.logger.debug(`➕ Added snapshot for ${fund.fund_name}`);

          // Step 3: Update reference list
          await this.trackRecordDao.addMonthlyReference(
            fundId,
            normalizedTimestamp,
            snapshot._id.toString(),
          );
        }

        result.fundsProcessed++;
      } catch (error) {
        const errorMsg = `${fund.fund_name}: ${error.message}`;
        result.errors.push(errorMsg);
        this.logger.error(`❌ ${errorMsg}`);
      }
    }

    result.success = result.errors.length < fundData.length / 2;

    this.logger.log(
      `✅ Ingestion complete: ${result.fundsProcessed}/${fundData.length} processed`,
    );

    return result;
  }

  /**
   * Get all active funds
   */
  async getAllActiveFunds() {
    return this.trackRecordDao.findAllActive();
  }

  /**
   * Get fund history
   */
  async getFundHistory(fundId: string, fromDate?: Date, toDate?: Date) {
    return this.monthwiseDao.findFundHistory(fundId, fromDate, toDate);
  }

  /**
   * Get funds by category for a specific month
   */
  async getFundsByCategory(category: string, timestamp: Date) {
    return this.monthwiseDao.findByCategoryAndTimestamp(category, timestamp);
  }

  /**
   * Normalize timestamp to start of month
   */
  private normalizeTimestamp(date: Date): Date {
    const normalized = new Date(date);
    normalized.setUTCDate(1);
    normalized.setUTCHours(0, 0, 0, 0);
    return normalized;
  }
}

