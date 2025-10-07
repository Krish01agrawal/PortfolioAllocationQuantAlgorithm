import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { FundDataDto } from '../../mutual-fund/dtos/fund-data.dto';
import { normalizeFundCategory } from '../../../utils/category-mapper.util';

/**
 * Morningstar Parser Service
 * 
 * Purpose: Parse and validate Morningstar JSON data
 * SOLID: Single Responsibility - Only handles parsing/validation
 */
@Injectable()
export class MorningstarParserService {
  private readonly logger = new Logger(MorningstarParserService.name);

  private readonly REQUIRED_FIELDS = ['fund_name', 'fund_category'];
  private readonly CRITICAL_FIELDS = ['sharpe_ratio', 'expense_ratio_equity', 'expense_ratio_debt'];

  /**
   * Parse data from file
   */
  async parseFile(filePath: string): Promise<FundDataDto[]> {
    this.logger.log(`📂 Reading file: ${filePath}`);

    try {
      const fileContent = readFileSync(filePath, 'utf-8');
      return await this.parseString(fileContent);
    } catch (error) {
      this.logger.error(`❌ Failed to read file: ${error.message}`);
      throw new Error(`File read error: ${error.message}`);
    }
  }

  /**
   * Parse data from string
   */
  async parseString(data: string): Promise<FundDataDto[]> {
    try {
      const rawData = JSON.parse(data);

      if (!Array.isArray(rawData)) {
        throw new Error('Expected JSON array of funds');
      }

      this.logger.log(`📊 Parsing ${rawData.length} funds...`);

      const validatedFunds: FundDataDto[] = [];
      const errors: string[] = [];

      for (let i = 0; i < rawData.length; i++) {
        try {
          const validatedFund = await this.validateFund(rawData[i]);
          
          if (validatedFund) {
            validatedFunds.push(validatedFund);
          } else {
            errors.push(`Fund at index ${i}: Validation failed`);
          }
        } catch (error) {
          errors.push(`Fund at index ${i}: ${error.message}`);
          this.logger.warn(`⚠️ Skipping fund at index ${i}: ${error.message}`);
        }
      }

      this.logger.log(`✅ Validated ${validatedFunds.length}/${rawData.length} funds`);

      if (errors.length > 0) {
        this.logger.warn(`⚠️ ${errors.length} validation errors`);
      }

      return validatedFunds;
    } catch (error) {
      this.logger.error(`❌ JSON parse error: ${error.message}`);
      throw new Error(`JSON parse error: ${error.message}`);
    }
  }

  /**
   * Validate single fund
   */
  async validateFund(fundData: any): Promise<FundDataDto | null> {
    if (!this.hasRequiredFields(fundData)) {
      return null;
    }

    // Normalize category name before validation
    if (fundData.fund_category) {
      fundData.fund_category = normalizeFundCategory(fundData.fund_category);
    }

    const fundDto = plainToClass(FundDataDto, fundData);

    const validationErrors = await validate(fundDto, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });

    if (validationErrors.length > 0) {
      const errorMessages = validationErrors
        .map((err) => Object.values(err.constraints || {}).join(', '))
        .join('; ');

      this.logger.warn(`⚠️ Validation errors for ${fundDto.fund_name}: ${errorMessages}`);
      return null;
    }

    this.checkCriticalFields(fundDto);
    this.detectOutliers(fundDto);

    return fundDto;
  }

  private hasRequiredFields(fundData: any): boolean {
    const missingFields = this.REQUIRED_FIELDS.filter(
      (field) => !(field in fundData) || !fundData[field],
    );

    if (missingFields.length > 0) {
      this.logger.debug(`Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }

    return true;
  }

  private checkCriticalFields(fundDto: FundDataDto): void {
    const missingCritical = this.CRITICAL_FIELDS.filter(
      (field) => !(field in fundDto) || fundDto[field] === null,
    );

    if (missingCritical.length > 0) {
      this.logger.warn(
        `⚠️ Missing critical fields for ${fundDto.fund_name}: ${missingCritical.join(', ')}`,
      );
    }
  }

  private detectOutliers(fundDto: FundDataDto): void {
    const outliers: string[] = [];

    if (fundDto.five_year_cagr_equity !== undefined) {
      if (fundDto.five_year_cagr_equity < -50 || fundDto.five_year_cagr_equity > 100) {
        outliers.push(`CAGR=${fundDto.five_year_cagr_equity}%`);
      }
    }

    if (fundDto.expense_ratio_equity !== undefined) {
      if (fundDto.expense_ratio_equity < 0.1 || fundDto.expense_ratio_equity > 3) {
        outliers.push(`Expense=${fundDto.expense_ratio_equity}%`);
      }
    }

    if (outliers.length > 0) {
      this.logger.warn(`⚠️ Outliers in ${fundDto.fund_name}: ${outliers.join(', ')}`);
    }
  }
}

