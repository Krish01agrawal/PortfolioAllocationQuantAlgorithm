import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

/**
 * MongoDB Database Configuration
 * 
 * Purpose: Centralized database connection settings
 * SOLID Principle: Single Responsibility - Only handles DB config
 */
export const getDatabaseConfig = (
  configService: ConfigService,
): MongooseModuleOptions => {
  const uri = configService.get<string>('MONGODB_URI');
  
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  return {
    uri,
    // Connection settings for optimal performance
    maxPoolSize: 10,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    // Automatically create indexes from schemas
    autoIndex: true,
  };
};

