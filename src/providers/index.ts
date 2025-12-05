/**
 * AI Providers Module
 *
 * Multi-provider AI integration for the RAN Swarm Optimizer
 *
 * Providers:
 * - Anthropic Claude Pro Max (cedricableml@gmail.com)
 * - Google Gemini 3 Pro (cedricable@gmail.com)
 * - OpenRouter (multi-model fallback)
 */

export {
  AIProviderManager,
  RANOptimizationAI,
  createAIProviderManager,
  type ProviderType,
  type ProviderConfig,
  type AIMessage,
  type AIResponse,
  type AIProviderManagerConfig
} from './ai-providers.js';
