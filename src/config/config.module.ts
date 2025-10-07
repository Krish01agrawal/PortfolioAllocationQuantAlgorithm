import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { appConfig } from './app.config';

/**
 * Configuration Module
 * 
 * Purpose: Global configuration management
 * - Loads environment variables
 * - Provides type-safe config access
 * 
 * @Global decorator makes this available everywhere
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
      load: [appConfig],
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
