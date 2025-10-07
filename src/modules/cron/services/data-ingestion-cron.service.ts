import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MorningstarParserService } from '../../morningstar/services/morningstar-parser.service';
import { MutualFundService } from '../../mutual-fund/services/mutual-fund.service';

/**
 * Data Ingestion Cron Service
 * 
 * Purpose: Scheduled monthly data ingestion from Morningstar
 * Runs: 1st working day of every month at 2:00 AM
 * 
 * Workflow:
 * 1. Fetch/Read Morningstar data
 * 2. Parse and validate
 * 3. Ingest into Collections 1 & 2
 * 4. Log results
 */
@Injectable()
export class DataIngestionCronService {
  private readonly logger = new Logger(DataIngestionCronService.name);

  constructor(
    private readonly morningstarParser: MorningstarParserService,
    private readonly mutualFundService: MutualFundService,
  ) {}

  /**
   * Monthly data ingestion job
   * Runs on 1st day of month at 2:00 AM
   * 
   * Cron: '0 2 1 * *' = At 02:00 on day-of-month 1
   */
  @Cron('0 2 1 * *', {
    name: 'monthly-data-ingestion',
    timeZone: 'Asia/Kolkata', // IST
  })
  async handleMonthlyIngestion() {
    this.logger.log('🔔 Monthly data ingestion cron job started');

    try {
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      // TODO: Replace with actual Morningstar API call
      // For now, this would need a file path or API integration
      this.logger.warn('⚠️ Morningstar API integration pending - skipping ingestion');
      
      // Example implementation (when API is ready):
      // const rawData = await this.morningstarApi.fetchLatestData();
      // const validatedFunds = await this.morningstarParser.parseString(JSON.stringify(rawData));
      // const result = await this.mutualFundService.ingestMonthlyData(validatedFunds, currentMonth);
      
      // this.logger.log(`✅ Ingestion completed: ${result.fundsProcessed} funds processed`);

    } catch (error) {
      this.logger.error(`❌ Monthly ingestion failed: ${error.message}`);
      // TODO: Send alert/notification
    }
  }

  /**
   * Manual trigger for ingestion (for testing)
   */
  async triggerManualIngestion(filePath: string) {
    this.logger.log(`🔧 Manual ingestion triggered for file: ${filePath}`);

    try {
      const validatedFunds = await this.morningstarParser.parseFile(filePath);
      
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const result = await this.mutualFundService.ingestMonthlyData(
        validatedFunds,
        currentMonth,
      );

      this.logger.log(`✅ Manual ingestion completed: ${result.fundsProcessed} funds processed`);
      
      return result;
    } catch (error) {
      this.logger.error(`❌ Manual ingestion failed: ${error.message}`);
      throw error;
    }
  }
}

