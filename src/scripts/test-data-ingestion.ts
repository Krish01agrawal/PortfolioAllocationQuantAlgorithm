import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app/app.module';
import { MorningstarParserService } from '../modules/morningstar/services/morningstar-parser.service';
import { MutualFundService } from '../modules/mutual-fund/services/mutual-fund.service';

/**
 * Test Data Ingestion Script
 * 
 * Purpose: Test Collections 1 & 2 with sample data
 * Usage: npx ts-node src/scripts/test-data-ingestion.ts
 */
async function testIngestion() {
  const logger = new Logger('TestIngestion');

  logger.log('🚀 Initializing NestJS application...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  try {
    const parserService = app.get(MorningstarParserService);
    const mutualFundService = app.get(MutualFundService);

    logger.log('📂 Services initialized successfully');

    // ACTUAL Morningstar format (as received from their API)
    const sampleData = [
      {
        Fund_ID: "LC001",
        Fund_Name: "Nippon India Large Cap Fund",
        Category: "Large Cap",
        NAV: 85.5,
        AUM_Cr: 35700,
        "5Y_CAGR": 18.86,
        "3Y_Rolling": 85,
        Sharpe_3Y: 1.22,
        Sortino_3Y: 1.52,
        Alpha: 1.5,
        Beta: 0.95,
        Std_Dev: 13.8,
        Max_DD: -14.2,
        Recovery_Mo: 9,
        Downside_Capture: 65,
        Expense: 0.66,
        Turnover: 32,
        Concentration: 38,
        Fund_House: "Tier 1",
        Manager_Tenure: 8,
        Manager_Record: "Excellent",
        AMC_Risk: "Good",
        ESG: "Strong"
      },
      {
        Fund_ID: "LC002",
        Fund_Name: "ICICI Pru Bluechip Fund",
        Category: "Large Cap",
        NAV: 120.4,
        AUM_Cr: 63264,
        "5Y_CAGR": 18.17,
        "3Y_Rolling": 82,
        Sharpe_3Y: 1.18,
        Sortino_3Y: 1.45,
        Alpha: 1.38,
        Beta: 0.96,
        Std_Dev: 14.1,
        Max_DD: -15.1,
        Recovery_Mo: 10,
        Downside_Capture: 68,
        Expense: 0.91,
        Turnover: 35,
        Concentration: 42,
        Fund_House: "Tier 1",
        Manager_Tenure: 9,
        Manager_Record: "Excellent",
        AMC_Risk: "Excellent",
        ESG: "Strong"
      },
      {
        Fund_ID: "DC007",
        Fund_Name: "Aditya Birla SL Corp Bond",
        Category: "Debt-Corp",
        NAV: 125.6,
        AUM_Cr: 16000,
        "5Y_CAGR": 6.7,
        "3Y_Rolling": 84,
        Sharpe_3Y: 1.56,
        Sortino_3Y: 1.78,
        Alpha: 0.31,
        Beta: 0.3,
        Std_Dev: 3.2,
        Max_DD: -3.8,
        Recovery_Mo: 5,
        Downside_Capture: 34,
        Expense: 0.52,
        Turnover: 20,
        Concentration: 30,
        Fund_House: "Tier 1",
        Manager_Tenure: 9,
        Manager_Record: "Good",
        AMC_Risk: "Good",
        ESG: "Moderate"
      },
      {
        Fund_ID: "DS001",
        Fund_Name: "Aditya Birla SL Short Term",
        Category: "Debt-Short",
        NAV: 52.4,
        AUM_Cr: 8500,
        "5Y_CAGR": 6.57,
        "3Y_Rolling": 86,
        Sharpe_3Y: 1.7,
        Sortino_3Y: 1.95,
        Alpha: 0.38,
        Beta: 0.22,
        Std_Dev: 2.5,
        Max_DD: -2.8,
        Recovery_Mo: 3,
        Downside_Capture: 25,
        Expense: 0.42,
        Turnover: 12,
        Concentration: 22,
        Fund_House: "Tier 1",
        Manager_Tenure: 8,
        Manager_Record: "Excellent",
        AMC_Risk: "Excellent",
        ESG: "Strong"
      },
      {
        Fund_ID: "MC006",
        Fund_Name: "Axis Midcap Fund",
        Category: "Mid Cap",
        NAV: 68.5,
        AUM_Cr: 22000,
        "5Y_CAGR": 23.5,
        "3Y_Rolling": 75,
        Sharpe_3Y: 1.08,
        Sortino_3Y: 1.35,
        Alpha: 2.2,
        Beta: 1.05,
        Std_Dev: 17.5,
        Max_DD: -21.5,
        Recovery_Mo: 13,
        Downside_Capture: 75,
        Expense: 0.88,
        Turnover: 49,
        Concentration: 46,
        Fund_House: "Tier 1",
        Manager_Tenure: 6,
        Manager_Record: "Good",
        AMC_Risk: "Good",
        ESG: "Moderate"
      },
      {
        Fund_ID: "DB001",
        Fund_Name: "ICICI Pru Banking & PSU",
        Category: "Debt-Banking",
        NAV: 32.5,
        AUM_Cr: 15000,
        "5Y_CAGR": 6.9,
        "3Y_Rolling": "",
        Sharpe_3Y: "",
        Sortino_3Y: "",
        Alpha: "",
        Beta: "",
        Std_Dev: "",
        Max_DD: "",
        Recovery_Mo: "",
        Downside_Capture: "",
        Expense: "",
        Turnover: "",
        Concentration: "",
        Fund_House: "",
        Manager_Tenure: "",
        Manager_Record: "",
        AMC_Risk: "",
        ESG: ""
      }
    ];

    logger.log(`📊 Created ${sampleData.length} sample funds`);

    // Parse and validate
    logger.log('🔍 Parsing and validating data...');
    const validatedFunds = await parserService.parseString(
      JSON.stringify(sampleData),
    );

    logger.log(`✅ Validated ${validatedFunds.length} funds`);

    // Ingest into database
    const timestamp = new Date('2025-09-01T00:00:00Z');

    logger.log(`📥 Ingesting data for ${timestamp.toISOString()}...`);

    const result = await mutualFundService.ingestMonthlyData(
      validatedFunds,
      timestamp,
    );

    // Display results
    logger.log('\n' + '='.repeat(60));
    logger.log('📊 INGESTION RESULTS');
    logger.log('='.repeat(60));
    logger.log(`Success: ${result.success ? '✅ YES' : '❌ NO'}`);
    logger.log(`Funds Processed: ${result.fundsProcessed}`);
    logger.log(`Funds Added: ${result.fundsAdded}`);
    logger.log(`Funds Updated: ${result.fundsUpdated}`);
    logger.log(`Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      logger.error(`\n⚠️ Errors:\n${result.errors.join('\n')}`);
    }

    logger.log('='.repeat(60) + '\n');

    logger.log('✅ Test completed successfully!');
    logger.log('🔍 Check your MongoDB database:');
    logger.log('   - Collection: mfSchemeTrackRecord');
    logger.log('   - Collection: mfSchemeDataMonthwise');
  } catch (error) {
    logger.error(`❌ Test failed: ${error.message}`);
    logger.error(error.stack);
  } finally {
    await app.close();
  }
}

testIngestion().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

