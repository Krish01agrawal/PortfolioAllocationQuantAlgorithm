import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  Param,
  Logger,
} from '@nestjs/common';
import { MutualFundService } from '../services/mutual-fund.service';
import { IngestFundsRequestDto } from '../dtos/ingest-funds-request.dto';
import { MorningstarParserService } from '../../morningstar/services/morningstar-parser.service';

/**
 * Mutual Fund API Controller
 * 
 * Endpoints:
 * - POST /api/mutual-funds/ingest - Manual data ingestion
 * - GET /api/mutual-funds - Get all funds
 * - GET /api/mutual-funds/:id - Get fund by ID
 * - GET /api/mutual-funds/:id/history - Get fund history
 */
@Controller('api/mutual-funds')
export class MutualFundController {
  private readonly logger = new Logger(MutualFundController.name);

  constructor(
    private readonly mutualFundService: MutualFundService,
    private readonly parserService: MorningstarParserService,
  ) {}

  /**
   * POST /api/mutual-funds/ingest
   * 
   * Manual data ingestion endpoint for testing
   * 
   * Body:
   * {
   *   "funds": [
   *     {
   *       "Fund_ID": "LC001",
   *       "Fund_Name": "Nippon India Large Cap Fund",
   *       "Category": "Large Cap",
   *       "NAV": 85.5,
   *       "5Y_CAGR": 18.86,
   *       ...
   *     }
   *   ],
   *   "timestamp": "2025-10-01" // Optional, defaults to current month
   * }
   * 
   * Response:
   * {
   *   "success": true,
   *   "message": "Successfully ingested 5/5 funds",
   *   "data": {
   *     "fundsProcessed": 5,
   *     "fundsAdded": 3,
   *     "fundsUpdated": 2,
   *     "errors": [],
   *     "timestamp": "2025-10-01T00:00:00.000Z"
   *   }
   * }
   */
  @Post('ingest')
  @HttpCode(HttpStatus.OK)
  async ingestFunds(@Body() request: IngestFundsRequestDto) {
    this.logger.log(`📥 Received ingestion request with ${request.funds.length} funds`);

    try {
      // Step 1: Parse and validate all funds
      this.logger.log('🔍 Validating funds...');
      const validatedFunds = await this.parserService.parseString(
        JSON.stringify(request.funds),
      );

      if (validatedFunds.length === 0) {
        return {
          success: false,
          message: 'No valid funds to ingest. All funds failed validation.',
          data: {
            fundsProcessed: 0,
            fundsAdded: 0,
            fundsUpdated: 0,
            errors: ['All funds failed validation'],
            timestamp: new Date(),
          },
        };
      }

      this.logger.log(`✅ Validated ${validatedFunds.length}/${request.funds.length} funds`);

      // Step 2: Determine timestamp (use provided or default to current month)
      const timestamp = request.timestamp
        ? new Date(request.timestamp)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      this.logger.log(`📅 Using timestamp: ${timestamp.toISOString()}`);

      // Step 3: Ingest funds
      const result = await this.mutualFundService.ingestMonthlyData(
        validatedFunds,
        timestamp,
      );

      // Step 4: Return response
      const message = result.success
        ? `Successfully ingested ${result.fundsProcessed}/${request.funds.length} funds`
        : `Ingestion completed with errors: ${result.fundsProcessed}/${request.funds.length} funds processed`;

      this.logger.log(`✅ ${message}`);

      return {
        success: result.success,
        message,
        data: {
          fundsProcessed: result.fundsProcessed,
          fundsAdded: result.fundsAdded,
          fundsUpdated: result.fundsUpdated,
          errors: result.errors,
          timestamp: result.timestamp,
        },
      };
    } catch (error) {
      this.logger.error(`❌ Ingestion failed: ${error.message}`, error.stack);

      return {
        success: false,
        message: `Ingestion failed: ${error.message}`,
        data: {
          fundsProcessed: 0,
          fundsAdded: 0,
          fundsUpdated: 0,
          errors: [error.message],
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * GET /api/mutual-funds
   * 
   * Get all funds with optional filters
   * 
   * Query params:
   * - category: Filter by category (e.g., "Large Cap Equity")
   * - status: Filter by status (e.g., "Active")
   * 
   * Response:
   * {
   *   "success": true,
   *   "data": [
   *     {
   *       "Fund_ID": "LC001",
   *       "Fund_Name": "Nippon India Large Cap Fund",
   *       "Category": "Large Cap Equity",
   *       "status": "Active"
   *     }
   *   ],
   *   "count": 6
   * }
   */
  @Get()
  async getAllFunds(
    @Query('category') category?: string,
    @Query('status') status?: string,
  ) {
    this.logger.log(`📊 Fetching funds (category: ${category || 'all'}, status: ${status || 'all'})`);

    try {
      const filter: any = {};
      if (category) filter.Category = category;
      if (status) filter.status = status;

      const funds = await this.mutualFundService.getAllFunds(filter);

      return {
        success: true,
        data: funds,
        count: funds.length,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to fetch funds: ${error.message}`);
      return {
        success: false,
        message: error.message,
        data: [],
        count: 0,
      };
    }
  }

  /**
   * GET /api/mutual-funds/:id
   * 
   * Get fund by Fund_ID
   * 
   * Response:
   * {
   *   "success": true,
   *   "data": {
   *     "Fund_ID": "LC001",
   *     "Fund_Name": "Nippon India Large Cap Fund",
   *     "Category": "Large Cap Equity",
   *     "status": "Active",
   *     "schemeMonthTrackList": [...]
   *   }
   * }
   */
  @Get(':id')
  async getFundById(@Param('id') fundId: string) {
    this.logger.log(`📊 Fetching fund: ${fundId}`);

    try {
      const fund = await this.mutualFundService.getFundById(fundId);

      if (!fund) {
        return {
          success: false,
          message: `Fund not found: ${fundId}`,
          data: null,
        };
      }

      return {
        success: true,
        data: fund,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to fetch fund ${fundId}: ${error.message}`);
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * GET /api/mutual-funds/:id/history
   * 
   * Get historical snapshots for a fund
   * 
   * Query params:
   * - fromDate: Start date (ISO string)
   * - toDate: End date (ISO string)
   * 
   * Response:
   * {
   *   "success": true,
   *   "data": [
   *     {
   *       "timestamp": "2025-10-01T00:00:00.000Z",
   *       "Fund_ID": "LC001",
   *       "NAV": 85.5,
   *       "5Y_CAGR": 18.86,
   *       ...
   *     }
   *   ],
   *   "count": 12
   * }
   */
  @Get(':id/history')
  async getFundHistory(
    @Param('id') fundId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    this.logger.log(`📊 Fetching history for fund: ${fundId}`);

    try {
      const from = fromDate ? new Date(fromDate) : undefined;
      const to = toDate ? new Date(toDate) : undefined;

      const history = await this.mutualFundService.getFundHistory(
        fundId,
        from,
        to,
      );

      return {
        success: true,
        data: history,
        count: history.length,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to fetch history for ${fundId}: ${error.message}`);
      return {
        success: false,
        message: error.message,
        data: [],
        count: 0,
      };
    }
  }
}

