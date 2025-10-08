import { Injectable, Logger } from '@nestjs/common';
import { MfSchemeTrackRecordDao } from '../dao/mf-scheme-track-record.dao';
import { MfSchemeDataMonthwiseDao } from '../dao/mf-scheme-data-monthwise.dao';
import { MorningstarRawDto } from '../../morningstar/dtos/morningstar-raw.dto';

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
 * SOLID: Single Responsibility - Orchestrates fund data ingestion
 * 
 * IMPORTANT: Works with Morningstar format AS-IS (source of truth)
 */
@Injectable()
export class MutualFundService {
  private readonly logger = new Logger(MutualFundService.name);

  constructor(
    private readonly trackRecordDao: MfSchemeTrackRecordDao,
    private readonly monthwiseDao: MfSchemeDataMonthwiseDao,
  ) {}

  /**
   * Ingest monthly fund data (Morningstar format AS-IS)
   * 
   * Process:
   * 1. Upsert master record (Collection 1)
   * 2. Check if snapshot exists for this month
   * 3. Insert or update snapshot (Collection 2)
   * 4. Update reference list in master record
   */
  async ingestMonthlyData(
    fundData: MorningstarRawDto[],
    timestamp: Date,
  ): Promise<IngestionResult> {
    const normalizedTimestamp = this.normalizeTimestamp(timestamp);

    this.logger.log(`🚀 Starting ingestion of ${fundData.length} funds for ${normalizedTimestamp.toISOString()}`);

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
        // Step 1: Upsert master record (using Morningstar Fund_ID)
        const fundMaster = await this.trackRecordDao.upsert(fund.Fund_ID, {
          Fund_ID: fund.Fund_ID,
          Fund_Name: fund.Fund_Name,
          Category: fund.Category,
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
          this.logger.debug(`✏️ Updated snapshot for ${fund.Fund_Name}`);
        } else {
          // Insert new (store Morningstar data AS-IS)
          const snapshot = await this.monthwiseDao.create(
            fundId,
            normalizedTimestamp,
            fund,
          );
          result.fundsAdded++;
          this.logger.debug(`➕ Added snapshot for ${fund.Fund_Name}`);

          // Step 3: Update reference list
          await this.trackRecordDao.addMonthlyReference(
            fundId,
            normalizedTimestamp,
            snapshot._id.toString(),
          );
        }

        result.fundsProcessed++;
      } catch (error) {
        const errorMsg = `${fund.Fund_Name}: ${error.message}`;
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
   * Get all funds with optional filters
   */
  async getAllFunds(filter: any = {}) {
    return this.trackRecordDao.findAll(filter);
  }

  /**
   * Get fund by Fund_ID
   */
  async getFundById(fundId: string) {
    return this.trackRecordDao.findByFundID(fundId);
  }

  /**
   * Get fund history (monthly snapshots)
   */
  async getFundHistory(fundId: string, fromDate?: Date, toDate?: Date) {
    // First, get the fund master to get the internal _id
    const fund = await this.trackRecordDao.findByFundID(fundId);
    if (!fund) {
      return [];
    }

    return this.monthwiseDao.findFundHistory(fund._id.toString(), fromDate, toDate);
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
