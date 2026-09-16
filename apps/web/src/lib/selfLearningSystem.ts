import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('selflearningsystem');

/**
 * Self-Learning System
 * Continuously learns from user behavior, errors, and performance to improve autonomously
 */

import { supabase } from './supabaseClient';
import { analytics } from './analytics';
import { logger } from './logger';
import { croOptimizer } from './croOptimizer';
import { monetizationHub } from './monetizationHub';
import { autonomousInfrastructure } from './autonomousInfrastructure';

export interface LearningInsight {
  id: string;
  category: 'conversion' | 'performance' | 'monetization' | 'user_experience' | 'infrastructure';
  insight_type: 'pattern' | 'anomaly' | 'opportunity' | 'optimization';
  description: string;
  confidence: number;
  data_points: number;
  recommended_action: string;
  impact_estimate: 'low' | 'medium' | 'high';
  discovered_at: string;
}

export interface LearningCycle {
  cycle_id: string;
  start_time: string;
  end_time?: string;
  insights_generated: number;
  actions_taken: number;
  improvements: Array<{
    metric: string;
    before: number;
    after: number;
    improvement: number;
  }>;
  status: 'running' | 'completed' | 'failed';
}

export class SelfLearningSystem {
  private static instance: SelfLearningSystem;
  private learningCycleActive = false;
  private learningInterval: NodeJS.Timeout | null = null;

  static getInstance(): SelfLearningSystem {
    if (!SelfLearningSystem.instance) {
      SelfLearningSystem.instance = new SelfLearningSystem();
    }
    return SelfLearningSystem.instance;
  }

  /**
   * Start continuous learning process
   */
  async start(): Promise<void> {
    
    // Run learning cycle every 24 hours
    this.learningInterval = setInterval(async () => {
      await this.runLearningCycle();
    }, 24 * 60 * 60 * 1000);

    // Run initial cycle
    await this.runLearningCycle();

      }

  /**
   * Stop learning system
   */
  stop(): void {
    if (this.learningInterval) {
      clearInterval(this.learningInterval);
      this.learningInterval = null;
    }
      }

  /**
   * Run a complete learning cycle
   */
  async runLearningCycle(): Promise<LearningCycle> {
    if (this.learningCycleActive) {
            return {} as LearningCycle;
    }

    this.learningCycleActive = true;
    const cycleId = `cycle_${Date.now()}`;
    const startTime = new Date().toISOString();

    try {
      
      // 1. Collect data from all sources
      const data = await this.collectLearningData();

      // 2. Generate insights
      const insights = await this.generateInsights(data);

      // 3. Evaluate and prioritize insights
      const prioritizedInsights = this.prioritizeInsights(insights);

      // 4. Take automated actions based on high-confidence insights
      const actionsTaken = await this.takeAutomatedActions(prioritizedInsights);

      // 5. Measure improvements
      const improvements = await this.measureImprovements(prioritizedInsights);

      // 6. Store learning cycle results
      const cycle: LearningCycle = {
        cycle_id: cycleId,
        start_time: startTime,
        end_time: new Date().toISOString(),
        insights_generated: insights.length,
        actions_taken: actionsTaken,
        improvements,
        status: 'completed',
      };

      await this.storeLearningCycle(cycle);

      
      return cycle;
    } catch (error) {
      // Error handled: Error in learning cycle:
      const cycle: LearningCycle = {
        cycle_id: cycleId,
        start_time: startTime,
        insights_generated: 0,
        actions_taken: 0,
        improvements: [],
        status: 'failed',
      };
      await this.storeLearningCycle(cycle);
      return cycle;
    } finally {
      this.learningCycleActive = false;
    }
  }

  /**
   * Collect data from various sources
   */
  private async collectLearningData(): Promise<Record<string, unknown>> {
    try {
      // Get data from multiple sources
      const [
        conversionData,
        performanceData,
        monetizationData,
        userBehaviorData,
        errorData,
      ] = await Promise.all([
        this.getConversionData(),
        this.getPerformanceData(),
        this.getMonetizationData(),
        this.getUserBehaviorData(),
        this.getErrorData(),
      ]);

      return {
        conversion: conversionData,
        performance: performanceData,
        monetization: monetizationData,
        user_behavior: userBehaviorData,
        errors: errorData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Error handled: Error collecting learning data:
      return {};
    }
  }

  /**
   * Get conversion data
   */
  private async getConversionData(): Promise<unknown> {
    try {
      const { data: funnelEvents } = await supabase
        .from('funnel_events')
        .select('funnel_stage, timestamp, user_id')
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const { data: ctaEvents } = await supabase
        .from('cta_interactions')
        .select('cta_id, event_type, timestamp')
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      return {
        funnel_events: funnelEvents || [],
        cta_events: ctaEvents || [],
      };
    } catch (error) {
      // Error handled: Error getting conversion data:
      return { funnel_events: [], cta_events: [] };
    }
  }

  /**
   * Get performance data
   */
  private async getPerformanceData(): Promise<unknown> {
    try {
      const { data: perfLogs } = await supabase
        .from('performance_logs')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false })
        .limit(1000);

      return {
        logs: perfLogs || [],
        avg_response_time: this.calculateAverage(perfLogs || [], 'response_time'),
        p95_response_time: this.calculatePercentile(perfLogs || [], 'response_time', 95),
      };
    } catch (error) {
      // Error handled: Error getting performance data:
      return { logs: [], avg_response_time: 0, p95_response_time: 0 };
    }
  }

  /**
   * Get monetization data
   */
  private async getMonetizationData(): Promise<unknown> {
    try {
      const { data: revenue } = await supabase
        .from('revenue_records')
        .select('*')
        .gte('period_start', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('plan, status, created_at')
        .eq('status', 'active');

      return {
        revenue_records: revenue || [],
        active_subscriptions: subscriptions || [],
        total_revenue: (revenue || []).reduce((sum: number, r: any) => sum + (r.amount || 0), 0),
      };
    } catch (error) {
      // Error handled: Error getting monetization data:
      return { revenue_records: [], active_subscriptions: [], total_revenue: 0 };
    }
  }

  /**
   * Get user behavior data
   */
  private async getUserBehaviorData(): Promise<unknown> {
    try {
      const { data: analytics } = await supabase
        .from('analytics_events')
        .select('event_name, properties, timestamp')
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      return {
        events: analytics || [],
        popular_actions: this.analyzePopularActions(analytics || []),
        drop_off_points: this.analyzeDropOffs(analytics || []),
      };
    } catch (error) {
      // Error handled: Error getting user behavior data:
      return { events: [], popular_actions: [], drop_off_points: [] };
    }
  }

  /**
   * Get error data
   */
  private async getErrorData(): Promise<unknown> {
    try {
      const { data: errors } = await supabase
        .from('error_logs')
        .select('error_type, error_message, timestamp, user_id')
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      return {
        errors: errors || [],
        error_frequency: this.calculateErrorFrequency(errors || []),
        top_errors: this.getTopErrors(errors || []),
      };
    } catch (error) {
      // Error handled: Error getting error data:
      return { errors: [], error_frequency: {}, top_errors: [] };
    }
  }

  /**
   * Generate insights from collected data
   */
  private async generateInsights(data: Record<string, unknown>): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    // Conversion insights
    if (data.conversion) {
      const conversionInsights = this.analyzeConversion(data.conversion);
      insights.push(...conversionInsights);
    }

    // Performance insights
    if (data.performance) {
      const performanceInsights = this.analyzePerformance(data.performance);
      insights.push(...performanceInsights);
    }

    // Monetization insights
    if (data.monetization) {
      const monetizationInsights = this.analyzeMonetization(data.monetization);
      insights.push(...monetizationInsights);
    }

    // User experience insights
    if (data.user_behavior) {
      const uxInsights = this.analyzeUserExperience(data.user_behavior);
      insights.push(...uxInsights);
    }

    // Infrastructure insights
    if (data.errors) {
      const infraInsights = this.analyzeInfrastructure(data.errors);
      insights.push(...infraInsights);
    }

    // Store insights
    for (const insight of insights) {
      await this.storeInsight(insight);
    }

    return insights;
  }

  /**
   * Analyze conversion patterns
   */
  private analyzeConversion(data: any): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Analyze funnel drop-offs
    const funnelStages = ['landing', 'signup', 'onboarding', 'first_recipe', 'subscription'];
    const stageCounts: Record<string, number> = {};

    (data.funnel_events || []).forEach((event: any) => {
      stageCounts[event.funnel_stage] = (stageCounts[event.funnel_stage] || 0) + 1;
    });

    funnelStages.forEach((stage, index) => {
      const current = stageCounts[stage] || 0;
      const previous = stageCounts[funnelStages[index - 1]] || current;
      const dropOff = previous > 0 ? (previous - current) / previous : 0;

      if (dropOff > 0.5) {
        insights.push({
          id: `conversion_${stage}_${Date.now()}`,
          category: 'conversion',
          insight_type: 'opportunity',
          description: `High drop-off at ${stage} stage: ${(dropOff * 100).toFixed(0)}%`,
          confidence: 0.85,
          data_points: current,
          recommended_action: `Optimize ${stage} stage to reduce drop-off`,
          impact_estimate: dropOff > 0.7 ? 'high' : 'medium',
          discovered_at: new Date().toISOString(),
        });
      }
    });

    // Analyze CTA performance
    const ctaPerformance: Record<string, { clicks: number; conversions: number }> = {};
    (data.cta_events || []).forEach((event: any) => {
      if (!ctaPerformance[event.cta_id]) {
        ctaPerformance[event.cta_id] = { clicks: 0, conversions: 0 };
      }
      if (event.event_type === 'click') ctaPerformance[event.cta_id].clicks++;
      if (event.event_type === 'conversion') ctaPerformance[event.cta_id].conversions++;
    });

    Object.entries(ctaPerformance).forEach(([ctaId, perf]) => {
      const conversionRate = perf.clicks > 0 ? perf.conversions / perf.clicks : 0;
      if (perf.clicks > 100 && conversionRate < 0.05) {
        insights.push({
          id: `cta_${ctaId}_${Date.now()}`,
          category: 'conversion',
          insight_type: 'optimization',
          description: `CTA ${ctaId} has low conversion rate: ${(conversionRate * 100).toFixed(1)}%`,
          confidence: 0.80,
          data_points: perf.clicks,
          recommended_action: `Test new CTA copy and placement for ${ctaId}`,
          impact_estimate: 'medium',
          discovered_at: new Date().toISOString(),
        });
      }
    });

    return insights;
  }

  /**
   * Analyze performance patterns
   */
  private analyzePerformance(data: any): LearningInsight[] {
    const insights: LearningInsight[] = [];

    if (data.p95_response_time > 1000) {
      insights.push({
        id: `perf_slow_${Date.now()}`,
        category: 'performance',
        insight_type: 'anomaly',
        description: `Slow P95 response time: ${data.p95_response_time.toFixed(0)}ms`,
        confidence: 0.90,
        data_points: data.logs.length,
        recommended_action: 'Optimize slow endpoints, add caching, scale infrastructure',
        impact_estimate: 'high',
        discovered_at: new Date().toISOString(),
      });
    }

    return insights;
  }

  /**
   * Analyze monetization patterns
   */
  private analyzeMonetization(data: any): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Analyze subscription distribution
    const planDistribution: Record<string, number> = {};
    (data.active_subscriptions || []).forEach((sub: any) => {
      planDistribution[sub.plan] = (planDistribution[sub.plan] || 0) + 1;
    });

    const totalSubs = Object.values(planDistribution).reduce((sum, count) => sum + count, 0);
    const freeRatio = (planDistribution['free'] || 0) / totalSubs;

    if (freeRatio > 0.9) {
      insights.push({
        id: `monetization_free_ratio_${Date.now()}`,
        category: 'monetization',
        insight_type: 'opportunity',
        description: `High free user ratio: ${(freeRatio * 100).toFixed(0)}% are on free plan`,
        confidence: 0.75,
        data_points: totalSubs,
        recommended_action: 'Improve upgrade prompts and value proposition for free users',
        impact_estimate: 'high',
        discovered_at: new Date().toISOString(),
      });
    }

    return insights;
  }

  /**
   * Analyze user experience
   */
  private analyzeUserExperience(data: any): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Analyze drop-off points
    if (data.drop_off_points && data.drop_off_points.length > 0) {
      data.drop_off_points.forEach((dropOff: any) => {
        insights.push({
          id: `ux_dropoff_${Date.now()}`,
          category: 'user_experience',
          insight_type: 'pattern',
          description: `User drop-off detected at: ${dropOff.location}`,
          confidence: 0.70,
          data_points: dropOff.count,
          recommended_action: `Investigate and improve ${dropOff.location} user experience`,
          impact_estimate: 'medium',
          discovered_at: new Date().toISOString(),
        });
      });
    }

    return insights;
  }

  /**
   * Analyze infrastructure
   */
  private analyzeInfrastructure(data: any): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Analyze error frequency
    if (data.error_frequency) {
      Object.entries(data.error_frequency).forEach(([errorType, count]: [string, any]) => {
        if (count > 100) {
          insights.push({
            id: `infra_error_${errorType}_${Date.now()}`,
            category: 'infrastructure',
            insight_type: 'anomaly',
            description: `Frequent ${errorType} errors: ${count} occurrences`,
            confidence: 0.85,
            data_points: count,
            recommended_action: `Investigate and fix root cause of ${errorType} errors`,
            impact_estimate: 'high',
            discovered_at: new Date().toISOString(),
          });
        }
      });
    }

    return insights;
  }

  /**
   * Prioritize insights by impact and confidence
   */
  private prioritizeInsights(insights: LearningInsight[]): LearningInsight[] {
    return insights.sort((a, b) => {
      const impactScore: Record<string, number> = { low: 1, medium: 2, high: 3 };
      const aScore = a.confidence * impactScore[a.impact_estimate];
      const bScore = b.confidence * impactScore[b.impact_estimate];
      return bScore - aScore;
    });
  }

  /**
   * Take automated actions for high-confidence insights
   */
  private async takeAutomatedActions(insights: LearningInsight[]): Promise<number> {
    let actionsTaken = 0;

    // Only act on high-confidence, high-impact insights
    const actionableInsights = insights.filter(
      i => i.confidence > 0.80 && i.impact_estimate === 'high'
    );

    for (const insight of actionableInsights.slice(0, 5)) { // Limit to 5 actions per cycle
      try {
        switch (insight.category) {
          case 'conversion':
            if (insight.description.includes('CTA')) {
              await croOptimizer.optimizeLowPerformingCTA(insight.id);
              actionsTaken++;
            }
            break;

          case 'monetization':
            // Trigger upsell campaigns based on insights
            actionsTaken++;
            break;

          case 'performance':
            // Trigger infrastructure optimizations
            await autonomousInfrastructure.performHealthCheck();
            actionsTaken++;
            break;

          default:
            break;
        }
      } catch (error) {
        _logger.error('Error taking action for insight ${insight.id}:', { error: error instanceof Error ? error.message : String(error) });
      }
    }

    return actionsTaken;
  }

  /**
   * Measure improvements from previous cycle
   */
  private async measureImprovements(
    currentInsights: LearningInsight[]
  ): Promise<LearningCycle['improvements']> {
    // In a real implementation, this would compare metrics before/after
    return [];
  }

  /**
   * Store insight
   */
  private async storeInsight(insight: LearningInsight): Promise<void> {
    try {
      await supabase.from('learning_insights').insert(insight);
    } catch (error) {
      // Error handled: Error storing insight:
    }
  }

  /**
   * Store learning cycle
   */
  private async storeLearningCycle(cycle: LearningCycle): Promise<void> {
    try {
      await supabase.from('learning_cycles').insert(cycle);
    } catch (error) {
      // Error handled: Error storing learning cycle:
    }
  }

  // Helper methods
  private calculateAverage(data: unknown[], field: string): number {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + (item[field] || 0), 0);
    return sum / data.length;
  }

  private calculatePercentile(data: unknown[], field: string, percentile: number): number {
    if (data.length === 0) return 0;
    const values = data.map(item => item[field] || 0).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  }

  private analyzePopularActions(events: unknown[]): string[] {
    const actionCounts: Record<string, number> = {};
    events.forEach(e => {
      const action = e.event_name || 'unknown';
      actionCounts[action] = (actionCounts[action] || 0) + 1;
    });
    return Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([action]) => action);
  }

  private analyzeDropOffs(events: unknown[]): Array<{ location: string; count: number }> {
    // Simplified drop-off analysis
    return [];
  }

  private calculateErrorFrequency(errors: unknown[]): Record<string, number> {
    const frequency: Record<string, number> = {};
    errors.forEach(e => {
      const type = e.error_type || 'unknown';
      frequency[type] = (frequency[type] || 0) + 1;
    });
    return frequency;
  }

  private getTopErrors(errors: unknown[]): Array<{ type: string; count: number }> {
    const frequency = this.calculateErrorFrequency(errors);
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count: count as number }));
  }
}

export const selfLearningSystem = SelfLearningSystem.getInstance();
