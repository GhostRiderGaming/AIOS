/**
 * @fileoverview Ollama provider — local AI inference via Ollama API.
 * Stub implementation — activate when Ollama is installed.
 */

import { BaseProvider } from './base.provider.js';
import { ProviderError } from '@aios/shared/errors';

export class OllamaProvider extends BaseProvider {
  /**
   * @param {string} [baseUrl='http://localhost:11434']
   * @param {string} [model='llama3']
   */
  constructor(baseUrl = 'http://localhost:11434', model = 'llama3') {
    super('ollama');
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async isAvailable() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(2000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async complete(prompt, options = {}) {
    if (!(await this.isAvailable())) {
      throw new ProviderError('ollama', 'Ollama is not running');
    }

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt,
        system: options.systemPrompt || '',
        stream: false,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens ?? 1024,
        },
      }),
    });

    if (!response.ok) {
      throw new ProviderError('ollama', `HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.response,
      provider: 'ollama',
      metadata: {
        model: this.model,
        totalDuration: data.total_duration,
        evalCount: data.eval_count,
      },
    };
  }

  async agentResponse(agentType, input, options = {}) {
    const { AGENT_PROFILES } = await import('@aios/shared/constants');
    const profile = AGENT_PROFILES[agentType];

    const systemPrompt = `You are ${profile.name}, an AI agent with the following personality: ${profile.personality}. ${profile.description}. Respond in character.`;

    const result = await this.complete(input, { ...options, systemPrompt });
    return {
      content: result.content,
      agentType,
      metadata: { ...result.metadata, agentType },
    };
  }
}
