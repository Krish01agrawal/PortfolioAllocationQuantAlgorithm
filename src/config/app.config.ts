/**
 * Application Configuration
 * 
 * Purpose: Type-safe configuration interface
 */
export interface AppConfig {
  nodeEnv: string;
  port: number;
  allowedOrigins: string[];
  logLevel: string;
}

export const appConfig = (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  logLevel: process.env.LOG_LEVEL || 'log',
});

