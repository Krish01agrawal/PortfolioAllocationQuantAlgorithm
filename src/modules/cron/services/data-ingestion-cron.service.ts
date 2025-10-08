import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { MorningstarApiService } from '../../morningstar/services/morningstar-api.service';
import { MorningstarParserService } from '../../morningstar/services/morningstar-parser.service';
import { MutualFundService } from '../../mutual-fund/services/mutual-fund.service';

/**
 * Data Ingestion Cron Service
 * 
 * Purpose: Scheduled monthly data ingestion from Morningstar API
 * Schedule: 1st day of every month at 2:00 AM IST
 * 
 * Complete Production Workflow:
 * 1. Fetch raw data from Morningstar API (HTTP)
 * 2. Parse and validate (normalize categories, check types)
 * 3. Ingest to MongoDB (Collections 1 & 2)
 * 4. Log results and send alerts if needed
 */
@Injectable()
export class DataIngestionCronService {
  private readonly logger = new Logger(DataIngestionCronService.name);
  private readonly cronEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly morningstarApi: MorningstarApiService,
    private readonly morningstarParser: MorningstarParserService,
    private readonly mutualFundService: MutualFundService,
  ) {
    this.cronEnabled = this.configService.get<string>('CRON_ENABLED') !== 'false';
    
    if (this.cronEnabled) {
      this.logger.log('✅ Monthly data ingestion cron is ENABLED');
    } else {
      this.logger.warn('⚠️ Monthly data ingestion cron is DISABLED');
    }
  }

  /**
   * PRODUCTION: Monthly data ingestion job
   * 
   * Cron Schedule: '0 2 1 * *'
   * - Minute: 0 (top of the hour)
   * - Hour: 2 (2 AM)
   * - Day of Month: 1 (1st of month)
   * - Month: * (every month)
   * - Day of Week: * (any day)
   * 
   * Runs: 1st of January, February, March... at 2:00 AM IST
   */
  @Cron('0 2 1 * *', {
    name: 'monthly-data-ingestion',
    timeZone: 'Asia/Kolkata', // IST timezone
  })
  async handleMonthlyIngestion() {
    if (!this.cronEnabled) {
      this.logger.log('⏸️ Cron is disabled, skipping...');
      return;
    }

    const startTime = Date.now();
    this.logger.log('🚀 ========================================');
    this.logger.log('🚀 MONTHLY DATA INGESTION STARTED');
    this.logger.log('🚀 ========================================');

    try {
      // STEP 1: Fetch from Morningstar API
      this.logger.log('📡 Step 1: Fetching data from Morningstar API...');
      const rawData = await this.morningstarApi.fetchMonthlyData();
      this.logger.log(`✅ Fetched ${rawData.length} funds from Morningstar`);

      // STEP 2: Parse and Validate
      this.logger.log('🔍 Step 2: Parsing and validating data...');
      const validatedFunds = await this.morningstarParser.parseString(
        JSON.stringify(rawData),
      );
      this.logger.log(`✅ Validated ${validatedFunds.length}/${rawData.length} funds`);

      // Alert if too many failures
      const failureRate = (rawData.length - validatedFunds.length) / rawData.length;
      if (failureRate > 0.1) {
        this.logger.warn(
          `⚠️ HIGH FAILURE RATE: ${(failureRate * 100).toFixed(1)}% of funds failed validation`,
        );
      }

      // STEP 3: Determine timestamp (last completed month)
      const timestamp = this.getLastMonthTimestamp();
      this.logger.log(`📅 Data timestamp: ${timestamp.toISOString()}`);

      // STEP 4: Ingest to Database
      this.logger.log('💾 Step 3: Ingesting to database...');
      const result = await this.mutualFundService.ingestMonthlyData(
        validatedFunds,
        timestamp,
      );

      // STEP 5: Report Results
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      this.logger.log('');
      this.logger.log('========================================');
      this.logger.log('📊 INGESTION RESULTS');
      this.logger.log('========================================');
      this.logger.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      this.logger.log(`Funds Fetched: ${rawData.length}`);
      this.logger.log(`Funds Validated: ${validatedFunds.length}`);
      this.logger.log(`Funds Processed: ${result.fundsProcessed}`);
      this.logger.log(`Funds Added: ${result.fundsAdded}`);
      this.logger.log(`Funds Updated: ${result.fundsUpdated}`);
      this.logger.log(`Errors: ${result.errors.length}`);
      this.logger.log(`Duration: ${duration}s`);
      this.logger.log(`Timestamp: ${result.timestamp.toISOString()}`);
      this.logger.log('========================================');

      if (result.errors.length > 0) {
        this.logger.error('⚠️ Errors encountered:');
        result.errors.slice(0, 10).forEach(err => {
          this.logger.error(`  - ${err}`);
        });
        if (result.errors.length > 10) {
          this.logger.error(`  ... and ${result.errors.length - 10} more`);
        }
      }

      if (result.success) {
        this.logger.log('✅ Monthly ingestion completed successfully! 🎉');
      } else {
        this.logger.error('❌ Monthly ingestion completed with errors');
        // TODO: Send alert email/notification
      }

    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      this.logger.error('');
      this.logger.error('========================================');
      this.logger.error('💥 INGESTION FAILED');
      this.logger.error('========================================');
      this.logger.error(`Error: ${error.message}`);
      this.logger.error(`Duration: ${duration}s`);
      this.logger.error('========================================');
      
      if (error.stack) {
        this.logger.error(`Stack trace:\n${error.stack}`);
      }

      // TODO: Send critical alert (email, Slack, PagerDuty)
      // await this.sendCriticalAlert(error);
    }
  }

  /**
   * Manual trigger for testing/debugging
   * Useful for:
   * - Testing ingestion outside of schedule
   * - Re-ingesting specific month
   * - Emergency data update
   */
  async triggerManualIngestion(customTimestamp?: Date) {
    this.logger.log('🔧 ========================================');
    this.logger.log('🔧 MANUAL INGESTION TRIGGERED');
    this.logger.log('🔧 ========================================');

    const startTime = Date.now();

    try {
      // Fetch from API
      const rawData = await this.morningstarApi.fetchMonthlyData();
      
      // Parse and validate
      const validatedFunds = await this.morningstarParser.parseString(
        JSON.stringify(rawData),
      );

      // Use custom timestamp or default to last month
      const timestamp = customTimestamp || this.getLastMonthTimestamp();

      // Ingest
      const result = await this.mutualFundService.ingestMonthlyData(
        validatedFunds,
        timestamp,
      );

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      this.logger.log(`✅ Manual ingestion completed in ${duration}s`);
      this.logger.log(`   Processed: ${result.fundsProcessed}/${validatedFunds.length}`);
      
      return result;

    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.error(`❌ Manual ingestion failed after ${duration}s: ${error.message}`);
      throw error;
    }
  }

  /**
   * Manual trigger from file (for testing without API)
   */
  async triggerManualIngestionFromFile(filePath: string, customTimestamp?: Date) {
    this.logger.log(`🔧 Manual ingestion from file: ${filePath}`);

    try {
      const validatedFunds = await this.morningstarParser.parseFile(filePath);
      
      const timestamp = customTimestamp || this.getLastMonthTimestamp();

      const result = await this.mutualFundService.ingestMonthlyData(
        validatedFunds,
        timestamp,
      );

      this.logger.log(`✅ File ingestion completed: ${result.fundsProcessed} funds`);
      return result;

    } catch (error) {
      this.logger.error(`❌ File ingestion failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get timestamp for last completed month
   * Example: If today is Oct 1, 2025 → returns Sep 1, 2025 00:00:00
   */
  private getLastMonthTimestamp(): Date {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    lastMonth.setHours(0, 0, 0, 0);
    return lastMonth;
  }

  /**
   * Health check for cron service
   */
  async getStatus() {
    const apiHealth = await this.morningstarApi.healthCheck();
    
    return {
      cronEnabled: this.cronEnabled,
      nextRun: '1st of next month at 2:00 AM IST',
      morningstarApi: apiHealth,
    };
  }
}

