// Test setup file
import { jest } from '@jest/globals';

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.GIPHY_API_KEY = 'test-giphy-key';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Global test timeout
jest.setTimeout(10000);
