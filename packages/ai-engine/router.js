/**
 * @fileoverview AI model router — selects provider based on availability.
 * Priority: Gemini (if key set) → Ollama (if running) → Demo (always available)
 */

import { DemoProvider } from './providers/demo.provider.js';
import { OllamaProvider } from './providers/ollama.provider.js';
import { GeminiProvider } from './providers/gemini.provider.js';
import { ProviderError } from '@aios/shared/errors';
import { AGENT_TYPES } from '@aios/shared/constants';

export class ModelRouter {
  /**
   * @param {{ ollamaBaseUrl?: string, ollamaModel?: string, geminiApiKey?: string, geminiModel?: string, forceDemoMode?: boolean }} config
   */
  constructor(config = {}) {
    this.demoProvider = new DemoProvider();
    this.ollamaProvider = new OllamaProvider(config.ollamaBaseUrl, config.ollamaModel);
    this.geminiProvider = new GeminiProvider(config.geminiApiKey, config.geminiModel);
    this.forceDemoMode = config.forceDemoMode ?? false;

    // Log active provider on creation
    this._logProviderStatus();
  }

  /**
   * @private
   */
  async _logProviderStatus() {
    const geminiAvailable = await this.geminiProvider.isAvailable();
    const ollamaAvailable = await this.ollamaProvider.isAvailable();
    if (this.forceDemoMode) {
      console.log('[AI Router] Force Demo Mode — using pre-scripted responses');
    } else if (geminiAvailable) {
      console.log(`[AI Router] Gemini active (model: ${this.geminiProvider.model})`);
    } else if (ollamaAvailable) {
      console.log('[AI Router] Ollama active (local inference)');
    } else {
      console.log('[AI Router] No live provider — falling back to Demo Mode');
    }
  }

  /**
   * Get the best available provider.
   * Priority: Gemini → Ollama → Demo
   * @returns {Promise<import('./providers/base.provider.js').BaseProvider>}
   */
  async getProvider() {
    // Demo mode override
    if (this.forceDemoMode) {
      return this.demoProvider;
    }

    // Try Gemini first (cloud, primary for hackathon)
    if (await this.geminiProvider.isAvailable()) {
      return this.geminiProvider;
    }

    // Try Ollama (local inference)
    if (await this.ollamaProvider.isAvailable()) {
      return this.ollamaProvider;
    }

    // Fall back to demo
    return this.demoProvider;
  }

  /**
   * Get the provider name that will be used.
   * @returns {Promise<string>}
   */
  async getActiveProviderName() {
    const provider = await this.getProvider();
    return provider.name;
  }

  /**
   * Generate a completion using the best available provider.
   * @param {string} prompt
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async complete(prompt, options = {}) {
    const provider = await this.getProvider();
    try {
      return await provider.complete(prompt, options);
    } catch (error) {
      // Fallback to demo if live provider fails
      if (provider.name !== 'demo') {
        console.warn(`[AI Router] ${provider.name} failed: ${error.message}, falling back to demo`);
        return this.demoProvider.complete(prompt, options);
      }
      throw error;
    }
  }

  /**
   * Generate an agent-specific response with fallback.
   * @param {string} agentType
   * @param {string} input
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async agentResponse(agentType, input, options = {}) {
    const provider = await this.getProvider();
    try {
      return await provider.agentResponse(agentType, input, options);
    } catch (error) {
      // Fallback to demo if live provider fails
      if (provider.name !== 'demo') {
        console.warn(`[AI Router] ${provider.name} agent response failed for ${agentType}: ${error.message}, falling back to demo`);
        return this.demoProvider.agentResponse(agentType, input, options);
      }
      throw error;
    }
  }

  /**
   * Get which agents should respond to given input.
   * Works across all providers.
   * @param {string} input
   * @returns {Promise<string[]>}
   */
  async getRespondingAgents(input) {
    const provider = await this.getProvider();
    return provider.getRespondingAgents(input);
  }

  /**
   * Get current provider status.
   * @returns {Promise<Object>}
   */
  async getStatus() {
    const activeProvider = await this.getProvider();
    return {
      activeProvider: activeProvider.name,
      demo: await this.demoProvider.isAvailable(),
      ollama: await this.ollamaProvider.isAvailable(),
      gemini: await this.geminiProvider.isAvailable(),
      forceDemoMode: this.forceDemoMode,
      geminiModel: this.geminiProvider.model,
    };
  }
}
