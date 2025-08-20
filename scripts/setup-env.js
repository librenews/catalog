#!/usr/bin/env node

// Environment Setup Script
import { writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envTemplate = `# Comlink Environment Configuration
# Copy this file to .env and fill in your actual values

# API Keys
GIPHY_API_KEY=dc6zaTOxFJmzC

# Server Configuration
API_PORT=3001
WEB_PORT=1111

# Bluesky Configuration (for future use)
BLUESKY_IDENTIFIER=
BLUESKY_PASSWORD=

# Development Settings
NODE_ENV=development
DEBUG=false
`;

const envPath = resolve(process.cwd(), '.env');

console.log('🛰️ Comlink Environment Setup');
console.log('============================\n');

if (existsSync(envPath)) {
  console.log('⚠️  .env file already exists!');
  console.log('   If you want to overwrite it, delete the existing file first.\n');
  process.exit(0);
}

try {
  writeFileSync(envPath, envTemplate);
  console.log('✅ Created .env file successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Edit .env file with your API keys');
  console.log('2. Get a Giphy API key from: https://developers.giphy.com/');
  console.log('3. Replace GIPHY_API_KEY=dc6zaTOxFJmzC with your actual key');
  console.log('4. Run: npm run build && npm run dev:full');
  console.log('\n🔒 Note: .env is already in .gitignore for security');
} catch (error) {
  console.error('❌ Failed to create .env file:', error.message);
  process.exit(1);
}
