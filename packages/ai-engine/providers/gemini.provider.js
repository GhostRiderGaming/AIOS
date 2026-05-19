/**
 * @fileoverview Gemini provider — Google AI Studio integration.
 * Uses Gemini 2.5 Flash for real-time agent inference.
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
    this.model = model || 'gemini-2.5-flash';
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

    // Inject STRUCTURED context from previous agents (not raw text dump)
    if (options.pipelineContext?.length) {
      const structuredContext = options.pipelineContext.map((ctx) => {
        const meta = ctx.metadata || {};
        const parts = [`### ${ctx.agentName}`];

        // Include key structured data points, not full verbose text
        if (meta.toolsUsed?.length) parts.push(`Tools used: ${meta.toolsUsed.join(', ')}`);
        if (meta.scanReport) parts.push(`Scan: ${meta.scanReport.totalFindings} findings (${meta.scanReport.critical} critical), Risk: ${meta.scanReport.riskScore}/10`);
        if (meta.ipReport) parts.push(`IPs: ${meta.ipReport.totalIPs} analyzed, ${meta.ipReport.malicious} malicious`);
        if (meta.complianceReport) parts.push(`Compliance: ${meta.complianceReport.score}/100 (Grade: ${meta.complianceReport.grade}), ${meta.complianceReport.summary?.fail || 0} failures across ${(meta.complianceReport.summary?.frameworksCovered || []).join(', ')}`);
        if (meta.correlationReport) parts.push(`Risk: ${meta.correlationReport.riskScore}/10 (${meta.correlationReport.riskLevel}), Confidence: ${meta.correlationReport.confidence}%, Correlations: ${meta.correlationReport.correlationsFound}`);
        if (meta.actionPlan) parts.push(`Action Plan: ${meta.actionPlan.summary?.totalActions || 0} actions, Priority: ${meta.actionPlan.plan?.overallPriority || 'N/A'}`);
        if (meta.securityScore != null) parts.push(`Code Security Score: ${meta.securityScore}/100`);

        // Include a SUMMARY of content (first 300 chars), not the full output
        parts.push(`Summary: ${ctx.content.slice(0, 300)}${ctx.content.length > 300 ? '...' : ''}`);
        return parts.join('\n');
      }).join('\n\n---\n\n');
      systemPrompt += `\n\nSTRUCTURED FINDINGS FROM PRIOR AGENTS (reference these in your analysis):\n${structuredContext}`;
    }

    // Inject file contents if uploaded
    if (options.fileContents) {
      systemPrompt += `\n\nUPLOADED FILE CONTENTS (analyze this data):\n\`\`\`\n${options.fileContents.slice(0, 10000)}\n\`\`\``;
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
   * Determine which agents should respond using LLM-based intelligent routing.
   * The model itself analyzes the input and decides which agents are relevant.
   * Falls back to keyword matching if the LLM call fails.
   * @param {string} input
   * @returns {Promise<string[]>}
   */
  async getRespondingAgents(input) {
    // Try LLM-based routing first
    if (this.apiKey) {
      try {
        return await this._llmRouting(input);
      } catch (error) {
        console.warn(`[Gemini] LLM routing failed: ${error.message}, falling back to keyword matching`);
      }
    }
    return this._keywordRouting(input);
  }

  /**
   * LLM-based routing: Ask Gemini which agents should handle this input.
   * @param {string} input
   * @returns {Promise<string[]>}
   * @private
   */
  async _llmRouting(input) {
    const routingPrompt = `You are a task router for a multi-agent AI system. Analyze the user's input and decide which specialized agents should handle it.

Available agents:
- security: Threat detection, access monitoring, anomaly flagging, log scanning, IP analysis
- governance: Compliance checking (SOC2/GDPR/HIPAA), policy enforcement, regulation mapping
- intelligence: Pattern analysis, risk scoring, data correlation, trend forecasting
- workflow: Action planning, task sequencing, remediation coordination, timeline estimation
- code: Code generation, vulnerability review, architecture design, debugging

User input: "${input.slice(0, 500)}"

Respond with ONLY a JSON object in this exact format (no markdown, no explanation):
{"agents": ["agent1", "agent2"], "reasoning": "brief explanation"}`;

    const result = await this.complete(routingPrompt, {
      temperature: 0,
      maxTokens: 200,
    });

    // Parse JSON from response
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in routing response');

    const parsed = JSON.parse(jsonMatch[0]);
    const validTypes = Object.values(AGENT_TYPES);
    const agents = (parsed.agents || []).filter((a) => validTypes.includes(a));

    if (agents.length === 0) {
      throw new Error('LLM returned no valid agents');
    }

    // Log routing decision for observability
    console.log(`[AI Router] LLM routing: ${agents.join(', ')} — ${parsed.reasoning || 'no reasoning'}`);

    // Ensure at least 2 agents, max 4
    if (agents.length === 1) agents.push(AGENT_TYPES.WORKFLOW);
    return agents.slice(0, 4);
  }

  /**
   * Fallback keyword-based routing.
   * @param {string} input
   * @returns {string[]}
   * @private
   */
  _keywordRouting(input) {
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

    const scores = {};
    for (const [type, keywords] of Object.entries(agentRelevance)) {
      scores[type] = keywords.reduce((score, kw) => score + (lower.includes(kw) ? 1 : 0), 0);
    }

    const relevant = Object.entries(scores)
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type);

    if (relevant.length === 0) {
      return [AGENT_TYPES.SECURITY, AGENT_TYPES.INTELLIGENCE, AGENT_TYPES.WORKFLOW];
    }
    if (relevant.length === 1) {
      relevant.push(AGENT_TYPES.WORKFLOW);
    }
    return relevant.slice(0, 4);
  }
}
