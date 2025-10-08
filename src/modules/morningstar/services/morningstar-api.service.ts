import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

/**
 * Morningstar API Service
 * 
 * Purpose: Fetch mutual fund data from Morningstar API
 * SOLID: Single Responsibility - Only handles API communication
 * 
 * Features:
 * - Automatic retries with exponential backoff
 * - Timeout handling
 * - Error classification
 * - Rate limiting awareness
 */
@Injectable()
export class MorningstarApiService {
  private readonly logger = new Logger(MorningstarApiService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.apiUrl = this.configService.get<string>('MORNINGSTAR_API_URL') || 'https://api.morningstar.com/v1';
    this.apiKey = this.configService.get<string>('MORNINGSTAR_API_KEY') || '';
    this.timeout = this.configService.get<number>('MORNINGSTAR_TIMEOUT') || 30000; // 30 seconds
    this.maxRetries = this.configService.get<number>('MORNINGSTAR_MAX_RETRIES') || 3;
  }

  /**
   * Fetch monthly mutual fund data from Morningstar
   * 
   * @returns Array of raw fund objects with all 27+ parameters
   * @throws HttpException if API fails after retries
   */
  async fetchMonthlyData(): Promise<any[]> {
    this.logger.log('📡 Fetching mutual fund data from Morningstar API...');

    this.validateConfiguration();

    let lastError: Error;

    // Retry logic with exponential backoff
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await firstValueFrom(
          this.httpService.get(`${this.apiUrl}/funds/india`, {
            headers: {
              'X-API-Key': this.apiKey,
              'Accept': 'application/json',
              'User-Agent': 'PlutoMoney/1.0',
              'Content-Type': 'application/json',
            },
            timeout: this.timeout,
          }),
        );

        // Validate response structure
        if (!response.data) {
          throw new Error('Empty response from Morningstar API');
        }

        const data = Array.isArray(response.data) ? response.data : response.data.funds;

        if (!Array.isArray(data)) {
          throw new Error('Invalid API response: Expected array of funds');
        }

        if (data.length === 0) {
          this.logger.warn('⚠️ Morningstar returned empty fund list');
        }

        this.logger.log(`✅ Successfully fetched ${data.length} funds from Morningstar`);
        return data;

      } catch (error) {
        lastError = error;
        
        const errorDetails = this.classifyError(error);
        
        this.logger.warn(
          `⚠️ Attempt ${attempt}/${this.maxRetries} failed: ${errorDetails.message}`,
        );

        // Don't retry if it's a client error (4xx)
        if (errorDetails.shouldRetry === false) {
          throw new HttpException(
            errorDetails.message,
            errorDetails.statusCode,
          );
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.maxRetries) {
          const delay = this.calculateBackoffDelay(attempt);
          this.logger.log(`⏳ Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    this.logger.error(`❌ Failed to fetch from Morningstar after ${this.maxRetries} attempts`);
    throw new HttpException(
      `Morningstar API failed: ${lastError.message}`,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  /**
   * Fetch specific fund by scheme code
   * Useful for debugging or specific fund updates
   */
  async fetchFundBySchemeCode(schemeCode: string): Promise<any> {
    this.logger.log(`📡 Fetching fund with scheme code: ${schemeCode}`);

    this.validateConfiguration();

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/funds/india/${schemeCode}`, {
          headers: {
            'X-API-Key': this.apiKey,
            'Accept': 'application/json',
          },
          timeout: this.timeout,
        }),
      );

      return response.data;
    } catch (error) {
      const errorDetails = this.classifyError(error);
      throw new HttpException(errorDetails.message, errorDetails.statusCode);
    }
  }

  /**
   * Health check for Morningstar API
   * Tests connectivity and authentication
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    this.logger.log('🔍 Checking Morningstar API health...');

    if (!this.apiUrl || !this.apiKey) {
      return {
        healthy: false,
        message: 'API credentials not configured',
      };
    }

    try {
      // Try to fetch a small sample
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/health`, {
          headers: { 'X-API-Key': this.apiKey },
          timeout: 5000, // 5 seconds for health check
        }),
      );

      return {
        healthy: true,
        message: 'Morningstar API is healthy',
      };
    } catch (error) {
      const errorDetails = this.classifyError(error);
      return {
        healthy: false,
        message: errorDetails.message,
      };
    }
  }

  /**
   * Validate that API is properly configured
   */
  private validateConfiguration(): void {
    if (!this.apiUrl || !this.apiKey) {
      throw new HttpException(
        'Morningstar API credentials not configured. Set MORNINGSTAR_API_URL and MORNINGSTAR_API_KEY',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Classify error and determine retry strategy
   */
  private classifyError(error: any): {
    message: string;
    statusCode: number;
    shouldRetry: boolean;
  } {
    // Axios error with response
    if (error.response) {
      const status = error.response.status;
      
      // 4xx client errors - don't retry
      if (status >= 400 && status < 500) {
        return {
          message: `Morningstar API error: ${status} - ${error.response.statusText}`,
          statusCode: status,
          shouldRetry: false,
        };
      }

      // 5xx server errors - retry
      return {
        message: `Morningstar server error: ${status}`,
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        shouldRetry: true,
      };
    }

    // Network error (no response)
    if (error.request) {
      return {
        message: 'Network error: Unable to reach Morningstar API',
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        shouldRetry: true,
      };
    }

    // Timeout error
    if (error.code === 'ECONNABORTED') {
      return {
        message: `Request timeout after ${this.timeout}ms`,
        statusCode: HttpStatus.REQUEST_TIMEOUT,
        shouldRetry: true,
      };
    }

    // Other errors
    return {
      message: error.message || 'Unknown error',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      shouldRetry: false,
    };
  }

  /**
   * Calculate exponential backoff delay
   * Attempt 1: 1 second
   * Attempt 2: 2 seconds
   * Attempt 3: 4 seconds
   */
  private calculateBackoffDelay(attempt: number): number {
    const baseDelay = 1000; // 1 second
    return baseDelay * Math.pow(2, attempt - 1);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

