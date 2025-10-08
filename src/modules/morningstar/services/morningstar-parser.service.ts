import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { MorningstarRawDto } from '../dtos/morningstar-raw.dto';
import { normalizeFundCategory } from '../../../utils/category-mapper.util';

/**
 * Morningstar Parser Service
 * 
 * Purpose: Parse and validate Morningstar JSON data
 * Philosophy: STORE AS-IS, Morningstar format is SOURCE OF TRUTH
 * 
 * Responsibilities:
 * 1. Validate required fields
 * 2. Normalize categories (for our enum)
 * 3. Handle empty strings → null
 * 4. Return validated Morningstar format AS-IS
 */
@Injectable()
export class MorningstarParserService {
  private readonly logger = new Logger(MorningstarParserService.name);

  // Required fields in Morningstar format (PascalCase_Underscore)
  private readonly REQUIRED_FIELDS = ['Fund_ID', 'Fund_Name', 'Category'];
  private readonly CRITICAL_FIELDS = ['Sharpe_3Y', 'Expense', 'AUM_Cr'];

  /**
   * Parse data from file
   */
  async parseFile(filePath: string): Promise<MorningstarRawDto[]> {
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
  async parseString(data: string): Promise<MorningstarRawDto[]> {
    try {
      const rawData = JSON.parse(data);

      if (!Array.isArray(rawData)) {
        throw new Error('Expected JSON array of funds');
      }

      this.logger.log(`📊 Parsing ${rawData.length} funds...`);

      const validatedFunds: MorningstarRawDto[] = [];
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
   * Returns Morningstar format AS-IS (source of truth)
   */
  async validateFund(fundData: any): Promise<MorningstarRawDto | null> {
    // Step 1: Check required fields
    if (!this.hasRequiredFields(fundData)) {
      return null;
    }

    // Step 2: Normalize category (for our enum validation)
    if (fundData.Category) {
      fundData.Category = normalizeFundCategory(fundData.Category);
    }

    // Step 3: Validate Morningstar format
    const fundDto = plainToClass(MorningstarRawDto, fundData);
    
    const validationErrors = await validate(fundDto, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });

    if (validationErrors.length > 0) {
      const errorMessages = validationErrors
        .map((err) => Object.values(err.constraints || {}).join(', '))
        .join('; ');

      this.logger.warn(`⚠️ Validation errors for ${fundData.Fund_Name}: ${errorMessages}`);
      return null;
    }

    // Step 4: Additional checks (warnings only)
    this.checkCriticalFields(fundDto);
    this.detectOutliers(fundDto);

    // Return AS-IS (no transformation)
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

  private checkCriticalFields(fundDto: MorningstarRawDto): void {
    const missingCritical = this.CRITICAL_FIELDS.filter(
      (field) => !(field in fundDto) || fundDto[field] === null,
    );

    if (missingCritical.length > 0) {
      this.logger.warn(
        `⚠️ Missing critical fields for ${fundDto.Fund_Name}: ${missingCritical.join(', ')}`,
      );
    }
  }

  private detectOutliers(fundDto: MorningstarRawDto): void {
    const outliers: string[] = [];

    if (fundDto['5Y_CAGR'] !== undefined && fundDto['5Y_CAGR'] !== null) {
      if (fundDto['5Y_CAGR'] < -50 || fundDto['5Y_CAGR'] > 100) {
        outliers.push(`5Y_CAGR=${fundDto['5Y_CAGR']}%`);
      }
    }

    if (fundDto.Expense !== undefined && fundDto.Expense !== null) {
      if (fundDto.Expense < 0.1 || fundDto.Expense > 3) {
        outliers.push(`Expense=${fundDto.Expense}%`);
      }
    }

    if (outliers.length > 0) {
      this.logger.warn(`⚠️ Outliers in ${fundDto.Fund_Name}: ${outliers.join(', ')}`);
    }
  }
}
