import { supabase } from './supabaseClient';
import { StripeService } from './stripe';
const crypto = typeof window === 'undefined' ? require('crypto') : null;

interface CacheEntry {
  id: string;
  tenant_id: string;
  cache_key: string;
  prompt_hash: string;
  response_data: any;
  model_used: string;
  tokens_used: number;
  cost_usd: number;
  ttl_seconds: number;
  created_at: string;
  expires_at: string;
}

interface OptimizationConfig {
  enableCaching: boolean;
  cacheTTL: number; // in seconds
  fallbackToCache: boolean;
  costThreshold: number; // USD per request
  modelSelection: 'auto' | 'gpt-4o-mini' | 'gpt-4o';
}

export class AIOptimizationService {
  private static instance: AIOptimizationService;
  private config: OptimizationConfig;

  constructor() {
    this.config = {
      enableCaching: true,
      cacheTTL: 3600, // 1 hour
      fallbackToCache: true,
      costThreshold: 0.01, // $0.01 per request
      modelSelection: 'auto',
    };
  }

  static getInstance(): AIOptimizationService {
    if (!AIOptimizationService.instance) {
      AIOptimizationService.instance = new AIOptimizationService();
    }
    return AIOptimizationService.instance;
  }

  /**
   * Generate a cache key from the prompt and preferences
   */
  private generateCacheKey(
    prompt: string,
    preferences: string,
    tenantId: string
  ): string {
    const content = `${prompt}:${preferences}:${tenantId}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Generate a prompt hash for deduplication
   */
  private generatePromptHash(prompt: string, preferences: string): string {
    const content = `${prompt}:${preferences}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Select the optimal model based on tenant plan and cost considerations
   */
  private selectOptimalModel(
    tenantPlan: string,
    estimatedCost: number
  ): string {
    if (this.config.modelSelection === 'gpt-4o-mini') return 'gpt-4o-mini';
    if (this.config.modelSelection === 'gpt-4o') return 'gpt-4o';

    // Auto selection based on plan and cost
    if (tenantPlan === 'free') return 'gpt-4o-mini';
    if (tenantPlan === 'pro' && estimatedCost < this.config.costThreshold)
      return 'gpt-4o';
    if (tenantPlan === 'family') return 'gpt-4o';

    return 'gpt-4o-mini'; // Default fallback
  }

  /**
   * Check if we have a cached response
   */
  async getCachedResponse(
    prompt: string,
    preferences: string,
    tenantId: string
  ): Promise<CacheEntry | null> {
    if (!this.config.enableCaching) return null;

    try {
      const cacheKey = this.generateCacheKey(prompt, preferences, tenantId);

      const { data, error } = await supabase
        .from('ai_cache')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) return null;

      return data;
    } catch (error) {
      // Error handled: Error fetching cached response:
      return null;
    }
  }

  /**
   * Cache a response for future use
   */
  async cacheResponse(
    prompt: string,
    preferences: string,
    tenantId: string,
    response: any,
    modelUsed: string,
    tokensUsed: number,
    costUsd: number
  ): Promise<void> {
    if (!this.config.enableCaching) return;

    try {
      const cacheKey = this.generateCacheKey(prompt, preferences, tenantId);
      const promptHash = this.generatePromptHash(prompt, preferences);
      const expiresAt = new Date(
        Date.now() + this.config.cacheTTL * 1000
      ).toISOString();

      await supabase.from('ai_cache').upsert({
        tenant_id: tenantId,
        cache_key: cacheKey,
        prompt_hash: promptHash,
        response_data: response,
        model_used: modelUsed,
        tokens_used: tokensUsed,
        cost_usd: costUsd,
        ttl_seconds: this.config.cacheTTL,
        expires_at: expiresAt,
      });

          } catch (error) {
      // Error handled: Error caching response:
    }
  }

  /**
   * Get optimized AI response with caching and cost optimization
   */
  async getOptimizedResponse(
    prompt: string,
    preferences: string,
    tenantId: string,
    tenantPlan: string,
    aiFunction: (
      model: string
    ) => Promise<{ response: any; tokens: number; cost: number }>
  ): Promise<{
    response: any;
    tokens: number;
    cost: number;
    cached: boolean;
    model: string;
  }> {
    // Try to get cached response first
    const cached = await this.getCachedResponse(prompt, preferences, tenantId);
    if (cached) {
            return {
        response: cached.response_data,
        tokens: cached.tokens_used,
        cost: cached.cost_usd,
        cached: true,
        model: cached.model_used,
      };
    }

    // Estimate cost for model selection
    const estimatedTokens = Math.ceil(prompt.length / 4); // Rough estimation
    const estimatedCostMini = StripeService.calculateTokenCost(
      estimatedTokens,
      'gpt-4o-mini'
    );
    const estimatedCost4o = StripeService.calculateTokenCost(
      estimatedTokens,
      'gpt-4o'
    );

    // Select optimal model
    const selectedModel = this.selectOptimalModel(tenantPlan, estimatedCost4o);

    try {
      // Generate response
      const result = await aiFunction(selectedModel);

      // Cache the response
      await this.cacheResponse(
        prompt,
        preferences,
        tenantId,
        result.response,
        selectedModel,
        result.tokens,
        result.cost
      );

      return {
        response: result.response,
        tokens: result.tokens,
        cost: result.cost,
        cached: false,
        model: selectedModel,
      };
    } catch (error) {
      // If fallback is enabled and we have a cached response, use it
      if (this.config.fallbackToCache && cached) {
                return {
          response: cached.response_data,
          tokens: cached.tokens_used,
          cost: cached.cost_usd,
          cached: true,
          model: cached.model_used,
        };
      }

      throw error;
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredCache(): Promise<void> {
    try {
      await supabase.rpc('cleanup_expired_cache');
          } catch (error) {
      // Error handled: Error cleaning up cache:
    }
  }

  /**
   * Get cache statistics for a tenant
   */
  async getCacheStats(tenantId: string): Promise<{
    totalEntries: number;
    hitRate: number;
    totalSavings: number;
    averageResponseTime: number;
  }> {
    try {
      const { data: cacheEntries } = await supabase
        .from('ai_cache')
        .select('*')
        .eq('tenant_id', tenantId);

      const { data: usageLogs } = await supabase
        .from('usage_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('action', 'meal_generation');

      const totalEntries = cacheEntries?.length || 0;
      const totalRequests = usageLogs?.length || 0;
      const hitRate =
        totalRequests > 0 ? (totalEntries / totalRequests) * 100 : 0;

      const totalSavings =
        cacheEntries?.reduce((sum, entry) => sum + entry.cost_usd, 0) || 0;
      const averageResponseTime = 0; // This would need to be tracked separately

      return {
        totalEntries,
        hitRate,
        totalSavings,
        averageResponseTime,
      };
    } catch (error) {
      // Error handled: Error getting cache stats:
      return {
        totalEntries: 0,
        hitRate: 0,
        totalSavings: 0,
        averageResponseTime: 0,
      };
    }
  }

  /**
   * Update optimization configuration
   */
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): OptimizationConfig {
    return { ...this.config };
  }
}

export const aiOptimization = AIOptimizationService.getInstance();
