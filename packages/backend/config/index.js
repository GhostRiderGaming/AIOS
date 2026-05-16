/**
 * @fileoverview Centralized configuration loader.
 * Reads from environment variables with sensible defaults.
 */

import { DEFAULT_PORT } from '@aios/shared/constants';

const config = Object.freeze({
  port: parseInt(process.env.PORT, 10) || DEFAULT_PORT,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiry: '24h',
  },

  db: {
    path: process.env.DB_PATH || './data/aios.db',
  },

  ai: {
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    ollamaModel: process.env.OLLAMA_MODEL || 'llama3',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  },

  demo: {
    // Only force demo mode if explicitly set to 'true'
    // Otherwise, auto-detect: use Gemini if key is set
    enabled: process.env.DEMO_MODE === 'true',
  },

  upload: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['.log', '.csv', '.txt', '.json', '.xml', '.yaml', '.yml'],
    dir: process.env.UPLOAD_DIR || './data/uploads',
  },
});

export default config;
