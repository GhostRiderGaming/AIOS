/**
 * @fileoverview AI Engine entry point.
 * Exports a configured ModelRouter singleton.
 */

import { ModelRouter } from './router.js';

let _router = null;

/**
 * Get or create the AI engine router.
 * @param {Object} [config] - Override config (uses env defaults otherwise)
 * @returns {ModelRouter}
 */
export function getAIEngine(config = {}) {
  if (!_router) {
    _router = new ModelRouter({
      ollamaBaseUrl: config.ollamaBaseUrl || process.env.OLLAMA_BASE_URL,
      ollamaModel: config.ollamaModel || process.env.OLLAMA_MODEL,
      geminiApiKey: config.geminiApiKey || process.env.GEMINI_API_KEY,
      geminiModel: config.geminiModel || process.env.GEMINI_MODEL,
      forceDemoMode: config.forceDemoMode ?? (process.env.DEMO_MODE === 'true'),
    });
  }
  return _router;
}

export { ModelRouter } from './router.js';
export { BaseProvider } from './providers/base.provider.js';
export { DemoProvider } from './providers/demo.provider.js';
export { OllamaProvider } from './providers/ollama.provider.js';
export { GeminiProvider } from './providers/gemini.provider.js';
