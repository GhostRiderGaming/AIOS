/**
 * @fileoverview Abstract base agent class with pipeline context support.
 * All specialized agents extend this class.
 */

import { AGENT_STATUS, AGENT_PROFILES } from '@aios/shared/constants';

export class BaseAgent {
  /**
   * @param {string} type - Agent type from AGENT_TYPES
   */
  constructor(type) {
    const profile = AGENT_PROFILES[type];
    if (!profile) {
      throw new Error(`Unknown agent type: ${type}`);
    }

    this.type = type;
    this.name = profile.name;
    this.emoji = profile.emoji;
    this.color = profile.color;
    this.description = profile.description;
    this.personality = profile.personality;
    this.status = AGENT_STATUS.IDLE;
    this.lastActive = null;
  }

  /**
   * Process an input with pipeline context and return a result.
   * @param {string} input - User input
   * @param {{ pipelineContext?: Array, aiEngine?: object, fileContents?: string }} options
   * @returns {Promise<{ content: string, agentType: string, agentName: string, emoji: string, metadata: object }>}
   */
  async process(input, options = {}) {
    this.status = AGENT_STATUS.PROCESSING;
    this.lastActive = new Date().toISOString();

    try {
      const result = await this._execute(input, options);
      this.status = AGENT_STATUS.COMPLETED;
      return {
        agentType: this.type,
        agentName: this.name,
        emoji: this.emoji,
        content: result.content,
        metadata: {
          ...result.metadata,
          agentType: this.type,
          agentName: this.name,
          provider: result.metadata?.provider || 'unknown',
          processedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.status = AGENT_STATUS.ERROR;
      throw error;
    }
  }

  /**
   * Determine if this agent should activate for the given input.
   * Subclasses can override for smarter activation logic.
   * @param {string} input
   * @param {Array} pipelineContext - Results from prior agents
   * @returns {boolean}
   */
  shouldActivate(input, pipelineContext = []) {
    return true; // Default: always activate when selected
  }

  /**
   * Internal execution logic — override in subclasses for custom behavior.
   * @param {string} input
   * @param {Object} options
   * @returns {Promise<{ content: string, metadata: object }>}
   * @protected
   */
  async _execute(input, options) {
    const { aiEngine, pipelineContext, fileContents } = options;
    if (aiEngine) {
      return aiEngine.agentResponse(this.type, input, {
        pipelineContext,
        fileContents,
      });
    }
    return {
      content: `${this.emoji} ${this.name}: Processing complete.`,
      metadata: {},
    };
  }

  /**
   * Get agent status summary.
   * @returns {Object}
   */
  getStatus() {
    return {
      type: this.type,
      name: this.name,
      emoji: this.emoji,
      color: this.color,
      description: this.description,
      status: this.status,
      lastActive: this.lastActive,
    };
  }
}
