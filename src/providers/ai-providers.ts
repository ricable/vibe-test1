/**
 * AI Providers Integration Module
 *
 * Integrates multiple AI providers for the RAN Swarm Optimizer:
 * - Anthropic Claude Pro Max (Primary)
 * - Google Gemini 3 Pro (Secondary)
 * - OpenRouter (Fallback/Multi-model)
 *
 * Accounts:
 * - Claude Code Pro Max: cedricableml@gmail.com
 * - Gemini 3 Pro: cedricable@gmail.com
 */

import { EventEmitter } from 'eventemitter3';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

// ============================================================================
// PROVIDER TYPES
// ============================================================================

export type ProviderType = 'anthropic' | 'google' | 'openrouter';

export interface ProviderConfig {
  type: ProviderType;
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  provider: ProviderType;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  latencyMs: number;
}

// ============================================================================
// ANTHROPIC PROVIDER (Claude Pro Max)
// ============================================================================

class AnthropicProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-3-5-sonnet-20241022') {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async complete(
    messages: AIMessage[],
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<AIResponse> {
    const startTime = Date.now();

    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const chatMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature || 0.7,
      system: systemMessage,
      messages: chatMessages
    });

    const textContent = response.content.find(c => c.type === 'text');

    return {
      content: textContent?.text || '',
      model: this.model,
      provider: 'anthropic',
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens
      },
      latencyMs: Date.now() - startTime
    };
  }

  async stream(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<void> {
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const chatMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature || 0.7,
      system: systemMessage,
      messages: chatMessages
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        onChunk(event.delta.text);
      }
    }
  }
}

// ============================================================================
// GOOGLE PROVIDER (Gemini 3 Pro)
// ============================================================================

class GoogleProvider {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-2.0-flash-exp') {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  async complete(
    messages: AIMessage[],
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<AIResponse> {
    const startTime = Date.now();

    const generativeModel = this.client.getGenerativeModel({
      model: this.model,
      generationConfig: {
        maxOutputTokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7
      }
    });

    // Convert messages to Gemini format
    const systemInstruction = messages.find(m => m.role === 'system')?.content;
    const history = messages
      .filter(m => m.role !== 'system')
      .slice(0, -1)
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

    const lastMessage = messages.filter(m => m.role !== 'system').slice(-1)[0];

    const chat = generativeModel.startChat({
      history: history as any,
      systemInstruction
    });

    const result = await chat.sendMessage(lastMessage?.content || '');
    const response = await result.response;
    const text = response.text();

    return {
      content: text,
      model: this.model,
      provider: 'google',
      usage: {
        inputTokens: 0, // Gemini doesn't provide token counts in the same way
        outputTokens: 0
      },
      latencyMs: Date.now() - startTime
    };
  }

  async stream(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<void> {
    const generativeModel = this.client.getGenerativeModel({
      model: this.model,
      generationConfig: {
        maxOutputTokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7
      }
    });

    const systemInstruction = messages.find(m => m.role === 'system')?.content;
    const history = messages
      .filter(m => m.role !== 'system')
      .slice(0, -1)
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

    const lastMessage = messages.filter(m => m.role !== 'system').slice(-1)[0];

    const chat = generativeModel.startChat({
      history: history as any,
      systemInstruction
    });

    const result = await chat.sendMessageStream(lastMessage?.content || '');

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        onChunk(chunkText);
      }
    }
  }
}

// ============================================================================
// OPENROUTER PROVIDER (Multi-model access)
// ============================================================================

class OpenRouterProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'anthropic/claude-3.5-sonnet') {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1'
    });
    this.model = model;
  }

  async complete(
    messages: AIMessage[],
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<AIResponse> {
    const startTime = Date.now();

    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature || 0.7,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    });

    return {
      content: response.choices[0]?.message?.content || '',
      model: this.model,
      provider: 'openrouter',
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0
      },
      latencyMs: Date.now() - startTime
    };
  }

  async stream(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<void> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature || 0.7,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        onChunk(content);
      }
    }
  }
}

// ============================================================================
// UNIFIED AI PROVIDER MANAGER
// ============================================================================

export interface AIProviderManagerConfig {
  primary: ProviderConfig;
  secondary?: ProviderConfig;
  fallback?: ProviderConfig;
  retryAttempts?: number;
  retryDelayMs?: number;
}

export class AIProviderManager extends EventEmitter {
  private primaryProvider: AnthropicProvider | GoogleProvider | OpenRouterProvider;
  private secondaryProvider?: AnthropicProvider | GoogleProvider | OpenRouterProvider;
  private fallbackProvider?: AnthropicProvider | GoogleProvider | OpenRouterProvider;

  private retryAttempts: number;
  private retryDelayMs: number;

  // Statistics
  private requestCount: number = 0;
  private successCount: number = 0;
  private failureCount: number = 0;
  private totalLatencyMs: number = 0;

  constructor(config: AIProviderManagerConfig) {
    super();

    this.primaryProvider = this.createProvider(config.primary);

    if (config.secondary) {
      this.secondaryProvider = this.createProvider(config.secondary);
    }

    if (config.fallback) {
      this.fallbackProvider = this.createProvider(config.fallback);
    }

    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelayMs = config.retryDelayMs || 1000;
  }

  private createProvider(config: ProviderConfig): AnthropicProvider | GoogleProvider | OpenRouterProvider {
    switch (config.type) {
      case 'anthropic':
        return new AnthropicProvider(config.apiKey, config.model);
      case 'google':
        return new GoogleProvider(config.apiKey, config.model);
      case 'openrouter':
        return new OpenRouterProvider(config.apiKey, config.model);
      default:
        throw new Error(`Unknown provider type: ${config.type}`);
    }
  }

  /**
   * Complete a request with automatic failover
   */
  async complete(
    messages: AIMessage[],
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<AIResponse> {
    this.requestCount++;

    const providers = [
      this.primaryProvider,
      this.secondaryProvider,
      this.fallbackProvider
    ].filter(Boolean) as (AnthropicProvider | GoogleProvider | OpenRouterProvider)[];

    let lastError: Error | null = null;

    for (const provider of providers) {
      for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
        try {
          const response = await provider.complete(messages, options);
          this.successCount++;
          this.totalLatencyMs += response.latencyMs;

          this.emit('success', {
            provider: response.provider,
            model: response.model,
            latencyMs: response.latencyMs
          });

          return response;
        } catch (error) {
          lastError = error as Error;
          this.emit('retry', {
            provider: (provider as any).constructor.name,
            attempt: attempt + 1,
            error: lastError.message
          });

          if (attempt < this.retryAttempts - 1) {
            await this.delay(this.retryDelayMs * (attempt + 1));
          }
        }
      }

      this.emit('provider-failed', {
        provider: (provider as any).constructor.name,
        error: lastError?.message
      });
    }

    this.failureCount++;
    throw lastError || new Error('All providers failed');
  }

  /**
   * Stream a request with automatic failover
   */
  async stream(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<void> {
    const providers = [
      this.primaryProvider,
      this.secondaryProvider,
      this.fallbackProvider
    ].filter(Boolean) as (AnthropicProvider | GoogleProvider | OpenRouterProvider)[];

    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        await provider.stream(messages, onChunk, options);
        return;
      } catch (error) {
        lastError = error as Error;
        this.emit('provider-failed', {
          provider: (provider as any).constructor.name,
          error: lastError.message
        });
      }
    }

    throw lastError || new Error('All providers failed');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get statistics
   */
  getStats(): {
    requestCount: number;
    successCount: number;
    failureCount: number;
    averageLatencyMs: number;
    successRate: number;
  } {
    return {
      requestCount: this.requestCount,
      successCount: this.successCount,
      failureCount: this.failureCount,
      averageLatencyMs: this.successCount > 0 ? this.totalLatencyMs / this.successCount : 0,
      successRate: this.requestCount > 0 ? this.successCount / this.requestCount : 0
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createAIProviderManager(): AIProviderManager {
  const anthropicKey = process.env.ANTHROPIC_API_KEY || '';
  const geminiKey = process.env.GEMINI_API_KEY || '';
  const openrouterKey = process.env.OPENROUTER_API_KEY || '';

  return new AIProviderManager({
    primary: {
      type: 'anthropic',
      apiKey: anthropicKey,
      model: process.env.PRIMARY_MODEL || 'claude-3-5-sonnet-20241022'
    },
    secondary: geminiKey ? {
      type: 'google',
      apiKey: geminiKey,
      model: process.env.SECONDARY_MODEL || 'gemini-2.0-flash-exp'
    } : undefined,
    fallback: openrouterKey ? {
      type: 'openrouter',
      apiKey: openrouterKey,
      model: process.env.FALLBACK_MODEL || 'anthropic/claude-3.5-sonnet'
    } : undefined
  });
}

// ============================================================================
// RAN-SPECIFIC AI INTEGRATION
// ============================================================================

export class RANOptimizationAI {
  private provider: AIProviderManager;

  constructor(provider?: AIProviderManager) {
    this.provider = provider || createAIProviderManager();
  }

  /**
   * Analyze RAN KPIs and provide optimization recommendations
   */
  async analyzeKPIs(kpis: Record<string, number>, context?: string): Promise<string> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert Ericsson RAN optimization AI agent. You analyze KPIs and provide specific, actionable recommendations for parameter optimization (P0, Alpha, PUSCH, PUCCH, antenna tilt, etc.).

Focus on:
- SINR and IoT optimization
- Uplink power control tuning
- Interference mitigation
- Capacity optimization
- 3GPP TS 38.213 compliance

Provide specific numeric recommendations when possible.`
      },
      {
        role: 'user',
        content: `Analyze these RAN KPIs and provide optimization recommendations:

${JSON.stringify(kpis, null, 2)}

${context ? `Context: ${context}` : ''}`
      }
    ];

    const response = await this.provider.complete(messages);
    return response.content;
  }

  /**
   * Generate root cause analysis for a detected problem
   */
  async analyzeRootCause(problem: {
    category: string;
    symptoms: string[];
    kpis: Record<string, number>;
  }): Promise<string> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert Ericsson RAN fault management AI. You perform root cause analysis on network problems using causal reasoning.

Problem categories include:
- UPLINK_INTERFERENCE
- PILOT_POLLUTION
- COVERAGE_HOLE
- SLEEPING_CELL
- PCI_CONFLICT
- CAPACITY_SATURATION
- BACKHAUL_CONGESTION

Provide:
1. Most likely root cause
2. Contributing factors
3. Confidence level (0-100%)
4. Recommended corrective actions`
      },
      {
        role: 'user',
        content: `Perform root cause analysis for this problem:

Category: ${problem.category}
Symptoms: ${problem.symptoms.join(', ')}
KPIs: ${JSON.stringify(problem.kpis, null, 2)}`
      }
    ];

    const response = await this.provider.complete(messages);
    return response.content;
  }

  /**
   * Generate self-healing workflow
   */
  async generateHealingWorkflow(problem: {
    category: string;
    rootCause: string;
    affectedCells: string[];
  }): Promise<string> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert Ericsson RAN self-healing AI. You design automated recovery workflows for network problems.

Available actions:
- ADJUST_P0: Modify uplink power target
- ADJUST_ALPHA: Modify pathloss compensation
- ADJUST_TILT: Modify antenna tilt
- ADJUST_POWER: Modify TX power
- RESTART_CELL: Software restart
- CHANGE_PCI: Modify Physical Cell ID
- ACTIVATE_CARRIER: Enable carrier aggregation
- UPDATE_ANR: Modify neighbor relations

Provide:
1. Ordered list of actions with parameters
2. Compensation actions for neighbors
3. Rollback plan if actions fail
4. Success criteria`
      },
      {
        role: 'user',
        content: `Design a self-healing workflow for:

Problem: ${problem.category}
Root Cause: ${problem.rootCause}
Affected Cells: ${problem.affectedCells.join(', ')}`
      }
    ];

    const response = await this.provider.complete(messages);
    return response.content;
  }

  getStats() {
    return this.provider.getStats();
  }
}
