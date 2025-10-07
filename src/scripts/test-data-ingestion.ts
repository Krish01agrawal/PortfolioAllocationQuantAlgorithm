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

    // Sample data
    const sampleData = [
        {
          fund_name: "Axis Bluechip Fund",
          fund_category: "Large Cap Equity",
          risk_profile: "Aggressive Explorer",
          five_year_cagr_equity: 13.8,
          five_year_cagr_debt_hybrid: null,
          three_year_rolling_consistency: 84,
          sharpe_ratio: 1.12,
          sortino_ratio: 1.48,
          alpha: 2.3,
          beta: 0.88,
          std_dev_equity: 12.1,
          std_dev_debt_hybrid: null,
          max_drawdown: -11.2,
          recovery_period: 5,
          downside_capture_ratio: 82,
          expense_ratio_equity: 0.9,
          expense_ratio_debt: null,
          aum_equity: 18000,
          aum_debt: null,
          liquidity_risk: 2,
          portfolio_turnover_ratio: 48,
          concentration_sector_fit: 4,
          style_fit: 5,
          fund_house_reputation: 5,
          fund_manager_tenure: 8,
          fund_manager_track_record: 4.7,
          amc_risk_management: 4.5,
          esg_governance: 3.9,
          benchmark_consistency: 4.6,
          peer_comparison: 4.3,
          tax_efficiency: 3.8,
          fund_innovation: 4.2,
          forward_risk_mitigation: 4.5
        },
        {
          fund_name: "HDFC Balanced Advantage Fund",
          fund_category: "Hybrid – Equity-Oriented",
          risk_profile: "Balanced Achiever",
          five_year_cagr_equity: 11.5,
          five_year_cagr_debt_hybrid: 8.3,
          three_year_rolling_consistency: 80,
          sharpe_ratio: 1.05,
          sortino_ratio: 1.35,
          alpha: 1.8,
          beta: 0.95,
          std_dev_equity: 10.5,
          std_dev_debt_hybrid: 4.9,
          max_drawdown: -9.4,
          recovery_period: 4,
          downside_capture_ratio: 86,
          expense_ratio_equity: 0.8,
          expense_ratio_debt: 0.6,
          aum_equity: 23500,
          aum_debt: 12000,
          liquidity_risk: 2,
          portfolio_turnover_ratio: 40,
          concentration_sector_fit: 4,
          style_fit: 4,
          fund_house_reputation: 5,
          fund_manager_tenure: 10,
          fund_manager_track_record: 4.6,
          amc_risk_management: 4.3,
          esg_governance: 3.8,
          benchmark_consistency: 4.4,
          peer_comparison: 4.1,
          tax_efficiency: 3.9,
          fund_innovation: 4.0,
          forward_risk_mitigation: 4.2
        },
        {
          fund_name: "ICICI Corporate Bond Fund",
          fund_category: "Debt – Corporate",
          risk_profile: "Conservative Guardian",
          five_year_cagr_equity: null,
          five_year_cagr_debt_hybrid: 7.8,
          three_year_rolling_consistency: 88,
          sharpe_ratio: 0.85,
          sortino_ratio: 1.10,
          alpha: 0.7,
          beta: 0.35,
          std_dev_equity: null,
          std_dev_debt_hybrid: 3.2,
          max_drawdown: -2.4,
          recovery_period: 2,
          downside_capture_ratio: 90,
          expense_ratio_equity: null,
          expense_ratio_debt: 0.5,
          aum_equity: null,
          aum_debt: 14200,
          liquidity_risk: 1,
          portfolio_turnover_ratio: 20,
          concentration_sector_fit: 4,
          style_fit: 3,
          fund_house_reputation: 5,
          fund_manager_tenure: 6,
          fund_manager_track_record: 4.4,
          amc_risk_management: 4.6,
          esg_governance: 3.7,
          benchmark_consistency: 4.5,
          peer_comparison: 4.2,
          tax_efficiency: 3.5,
          fund_innovation: 3.8,
          forward_risk_mitigation: 4.4
        },
        {
          fund_name: "Parag Parikh Flexi Cap Fund",
          fund_category: "Flexi Cap Equity",
          risk_profile: "Balanced Achiever",
          five_year_cagr_equity: 15.2,
          five_year_cagr_debt_hybrid: null,
          three_year_rolling_consistency: 86,
          sharpe_ratio: 1.25,
          sortino_ratio: 1.60,
          alpha: 3.1,
          beta: 0.92,
          std_dev_equity: 13.0,
          std_dev_debt_hybrid: null,
          max_drawdown: -10.3,
          recovery_period: 6,
          downside_capture_ratio: 78,
          expense_ratio_equity: 0.9,
          expense_ratio_debt: null,
          aum_equity: 20500,
          aum_debt: null,
          liquidity_risk: 3,
          portfolio_turnover_ratio: 35,
          concentration_sector_fit: 5,
          style_fit: 5,
          fund_house_reputation: 5,
          fund_manager_tenure: 9,
          fund_manager_track_record: 4.8,
          amc_risk_management: 4.4,
          esg_governance: 4.0,
          benchmark_consistency: 4.7,
          peer_comparison: 4.5,
          tax_efficiency: 3.9,
          fund_innovation: 4.3,
          forward_risk_mitigation: 4.6
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
    const timestamp = new Date('2025-10-02T00:00:00Z');

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

