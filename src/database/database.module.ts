import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from './database.config';

/**
 * Database Module
 * 
 * Purpose: Configure and provide MongoDB connection
 * Used by: All feature modules that need database access
 */
@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}

