/**
 * @fileoverview Abstract base provider interface.
 * All AI providers (Demo, Ollama, Gemini) must extend this class.
 */

export class BaseProvider {
  /**
   * @param {string} name - Provider identifier
   */
  constructor(name) {
    this.name = name;
  }

  /**
   * Check if the provider is available.
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    throw new Error(`${this.name}: isAvailable() not implemented`);
  }

  /**
   * Generate a completion from the given prompt.
   * @param {string} prompt - User prompt
   * @param {{ systemPrompt?: string, temperature?: number, maxTokens?: number }} options
   * @returns {Promise<{ content: string, provider: string, metadata: object }>}
   */
  async complete(prompt, options = {}) {
    throw new Error(`${this.name}: complete() not implemented`);
  }

  /**
   * Generate an agent-specific response.
   * @param {string} agentType - Agent type identifier
   * @param {string} input - User input
   * @param {{ context?: object }} options
   * @returns {Promise<{ content: string, agentType: string, metadata: object }>}
   */
  async agentResponse(agentType, input, options = {}) {
    throw new Error(`${this.name}: agentResponse() not implemented`);
  }

  /**
   * Determine which agents should respond to input.
   * Override in subclasses for intelligent routing.
   * @param {string} input
   * @returns {Promise<string[]>}
   */
  async getRespondingAgents(input) {
    // Default: use all agents
    const { AGENT_TYPES } = await import('@aios/shared/constants');
    return Object.values(AGENT_TYPES);
  }
}
