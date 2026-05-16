/**
 * @fileoverview Gemini provider — Google AI Studio integration.
 * Uses Gemini 2.0 Flash for real-time agent inference.
 */

import { BaseProvider } from './base.provider.js';
import { ProviderError } from '@aios/shared/errors';
import { AGENT_PROFILES, AGENT_TYPES } from '@aios/shared/constants';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

export class GeminiProvider extends BaseProvider {
  /**
   * @param {string} apiKey
   * @param {string} [model]
   */
  constructor(apiKey = '', model = '') {
    super('gemini');
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.model = model || 'gemini-2.0-flash';
  }

  async isAvailable() {
    return !!this.apiKey;
  }

  /**
   * Generate a completion with retry logic.
   * @param {string} prompt
   * @param {Object} options
   * @returns {Promise<{ content: string, provider: string, metadata: Object }>}
   */
  async complete(prompt, options = {}) {
    if (!this.apiKey) {
      throw new ProviderError('gemini', 'No API key configured');
    }

    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

    const body = {
      contents: [],
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 1500,
        topP: 0.95,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      ],
    };

    // System instruction
    if (options.systemPrompt) {
      body.systemInstruction = { parts: [{ text: options.systemPrompt }] };
    }

    // Conversation history support
    if (options.history?.length) {
      for (const msg of options.history) {
        body.contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        });
      }
    }

    // Current user message
    body.contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    // Retry loop
    let lastError;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(30000), // 30s timeout
        });

        if (response.status === 429) {
          // Rate limited — wait and retry
          const waitMs = RETRY_DELAY_MS * Math.pow(2, attempt);
          console.warn(`[Gemini] Rate limited, retrying in ${waitMs}ms (attempt ${attempt + 1})`);
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new ProviderError('gemini', `HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (!content) {
          throw new ProviderError('gemini', 'Empty response from model');
        }

        return {
          content,
          provider: 'gemini',
          metadata: {
            model: this.model,
            tokenCount: data.usageMetadata,
            finishReason: data.candidates?.[0]?.finishReason,
          },
        };
      } catch (error) {
        lastError = error;
        if (error instanceof ProviderError) throw error;
        if (attempt < MAX_RETRIES) {
          const waitMs = RETRY_DELAY_MS * Math.pow(2, attempt);
          console.warn(`[Gemini] Error: ${error.message}, retrying in ${waitMs}ms`);
          await new Promise((r) => setTimeout(r, waitMs));
        }
      }
    }

    throw lastError || new ProviderError('gemini', 'Max retries exceeded');
  }

  /**
   * Generate an agent-specific response with personality injection.
   * @param {string} agentType
   * @param {string} input
   * @param {Object} [options]
   * @returns {Promise<{ content: string, agentType: string, metadata: Object }>}
   */
  async agentResponse(agentType, input, options = {}) {
    const profile = AGENT_PROFILES[agentType];
    if (!profile) {
      throw new ProviderError('gemini', `Unknown agent type: ${agentType}`);
    }

    // Build system prompt from the rich profile
    let systemPrompt = profile.systemPrompt;

    // Inject context from previous agents if available
    if (options.pipelineContext?.length) {
      const contextBlock = options.pipelineContext
        .map((ctx) => `[${ctx.agentName}]: ${ctx.content}`)
        .join('\n\n');
      systemPrompt += `\n\nCONTEXT FROM OTHER AGENTS (reference these findings in your analysis):\n${contextBlock}`;
    }

    // Inject file contents if uploaded
    if (options.fileContents) {
      systemPrompt += `\n\nUPLOADED FILE CONTENTS (analyze this data):\n\`\`\`\n${options.fileContents}\n\`\`\``;
    }

    const result = await this.complete(input, {
      ...options,
      systemPrompt,
      temperature: 0.5, // More focused for agent responses
      maxTokens: 1200,
    });

    return {
      content: result.content,
      agentType,
      agentName: profile.name,
      emoji: profile.emoji,
      metadata: {
        ...result.metadata,
        agentType,
        agentName: profile.name,
        provider: 'gemini',
      },
    };
  }

  /**
   * Determine which agents should respond based on input analysis.
   * For Gemini mode, we use keyword matching to select relevant agents.
   * @param {string} input
   * @returns {string[]}
   */
  getRespondingAgents(input) {
    const lower = input.toLowerCase();

    const agentRelevance = {
      [AGENT_TYPES.SECURITY]: [
        'security', 'threat', 'attack', 'breach', 'vulnerability', 'access',
        'firewall', 'intrusion', 'anomaly', 'suspicious', 'malware', 'phishing',
        'unauthorized', 'exploit', 'incident', 'log', 'monitor',
      ],
      [AGENT_TYPES.GOVERNANCE]: [
        'compliance', 'audit', 'regulation', 'policy', 'gdpr', 'hipaa',
        'soc', 'pci', 'governance', 'privacy', 'retention', 'legal',
        'framework', 'standard', 'iso', 'nist',
      ],
      [AGENT_TYPES.INTELLIGENCE]: [
        'analyze', 'pattern', 'trend', 'data', 'risk', 'score',
        'correlation', 'intelligence', 'forecast', 'predict', 'anomaly',
        'metric', 'report', 'insight', 'statistics',
      ],
      [AGENT_TYPES.WORKFLOW]: [
        'plan', 'remediate', 'fix', 'action', 'workflow', 'task',
        'coordinate', 'schedule', 'automate', 'process', 'procedure',
        'step', 'implement', 'deploy', 'resolve',
      ],
      [AGENT_TYPES.CODE]: [
        'code', 'function', 'script', 'implement', 'generate', 'program',
        'api', 'build', 'develop', 'refactor', 'debug', 'test',
        'architecture', 'design pattern', 'algorithm',
      ],
    };

    // Score each agent's relevance
    const scores = {};
    for (const [type, keywords] of Object.entries(agentRelevance)) {
      scores[type] = keywords.reduce((score, kw) => score + (lower.includes(kw) ? 1 : 0), 0);
    }

    // Select agents with any relevance, sorted by score
    const relevant = Object.entries(scores)
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type);

    // If no specific match, send to Security + Intelligence + Workflow (safe defaults)
    if (relevant.length === 0) {
      return [AGENT_TYPES.SECURITY, AGENT_TYPES.INTELLIGENCE, AGENT_TYPES.WORKFLOW];
    }

    // Always include at least 2 agents for multi-agent feel, max 4
    if (relevant.length === 1) {
      // Add Workflow as coordinator
      relevant.push(AGENT_TYPES.WORKFLOW);
    }

    return relevant.slice(0, 4);
  }
}
