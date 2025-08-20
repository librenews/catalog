// Environment Configuration
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') });

export interface EnvironmentConfig {
  // API Keys
  giphyApiKey: string;
  
  // Server Configuration
  apiPort: number;
  webPort: number;
  
  // Bluesky Configuration (for future use)
  blueskyIdentifier?: string;
  blueskyPassword?: string;
  
  // Development Settings
  nodeEnv: string;
  debug: boolean;
}

export function loadEnvironment(): EnvironmentConfig {
  return {
    // API Keys
    giphyApiKey: process.env.GIPHY_API_KEY || 'dc6zaTOxFJmzC',
    
    // Server Configuration
    apiPort: parseInt(process.env.API_PORT || '3001', 10),
    webPort: parseInt(process.env.WEB_PORT || '1111', 10),
    
    // Bluesky Configuration
    blueskyIdentifier: process.env.BLUESKY_IDENTIFIER,
    blueskyPassword: process.env.BLUESKY_PASSWORD,
    
    // Development Settings
    nodeEnv: process.env.NODE_ENV || 'development',
    debug: process.env.DEBUG === 'true',
  };
}

export function validateEnvironment(config: EnvironmentConfig): void {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check for demo API key
  if (config.giphyApiKey === 'dc6zaTOxFJmzC') {
    warnings.push('Using Giphy demo API key - limited functionality. Set GIPHY_API_KEY in .env for full access.');
  }

  // Check for missing API key
  if (!config.giphyApiKey) {
    errors.push('GIPHY_API_KEY is required. Set it in your .env file.');
  }

  // Validate ports
  if (config.apiPort < 1 || config.apiPort > 65535) {
    errors.push(`Invalid API_PORT: ${config.apiPort}. Must be between 1 and 65535.`);
  }

  if (config.webPort < 1 || config.webPort > 65535) {
    errors.push(`Invalid WEB_PORT: ${config.webPort}. Must be between 1 and 65535.`);
  }

  // Log warnings
  if (warnings.length > 0) {
    console.log('🛰️ Environment Warnings:');
    warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
  }

  // Throw errors
  if (errors.length > 0) {
    console.error('❌ Environment Errors:');
    errors.forEach(error => console.error(`  ❌ ${error}`));
    throw new Error('Environment validation failed');
  }

  console.log('✅ Environment configuration loaded successfully');
}

// Export default configuration
export const env = loadEnvironment();

// Validate on import
try {
  validateEnvironment(env);
} catch (error) {
  console.error('Failed to load environment configuration:', error);
  process.exit(1);
}
