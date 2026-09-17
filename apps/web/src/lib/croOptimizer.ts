import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('crooptimizer');

/**
 * CRO (Conversion Rate Optimization) System
 * Advanced A/B testing, heatmaps, funnel analysis, and CTA optimization
 */

import { supabase } from './supabaseClient';
import { analytics } from './analytics';
import { AICopywriter } from './aiCopywriter';
import * as experiments from './experiments';

export interface CTAPlacement {
  id: string;
  page: string;
  section: string;
  position: 'above_fold' | 'below_fold' | 'sidebar' | 'modal' | 'inline';
  variant: string;
  text: string;
  style: {
    variant: 'primary' | 'secondary' | 'outline' | 'ghost';
    size: 'sm' | 'md' | 'lg';
    color?: string;
  };
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    conversion_rate: number;
    revenue: number;
    rpc: number; // Revenue per click
  };
}

export interface FunnelStage {
  name: string;
  visitors: number;
  drop_off_rate: number;
  conversion_rate: number;
  average_time: number; // seconds
}

export interface CROInsights {
  top_ctas: CTAPlacement[];
  worst_ctas: CTAPlacement[];
  funnel_bottlenecks: FunnelStage[];
  recommendations: string[];
  estimated_impact: {
    conversion_lift: number;
    revenue_lift: number;
  };
}

export class CROOptimizer {
  /**
   * Track CTA interaction with advanced analytics
   */
  static async trackCTAInteraction(
    ctaId: string,
    event: 'impression' | 'click' | 'conversion',
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const sessionId = this.getSessionId();
      
      // Update CTA performance metrics
      const { data: cta, error: fetchError } = await supabase
        .from('cta_placements')
        .select('performance')
        .eq('id', ctaId)
        .single();

      if (fetchError || !cta) {
        _logger.error('Error fetching CTA:', { fetchError });
        return;
      }

      const currentPerformance = cta.performance || {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        conversion_rate: 0,
        revenue: 0,
        rpc: 0,
      };

      const updatedPerformance = { ...currentPerformance };
      
      if (event === 'impression') {
        updatedPerformance.impressions += 1;
      } else if (event === 'click') {
        updatedPerformance.clicks += 1;
        updatedPerformance.ctr = updatedPerformance.clicks / updatedPerformance.impressions;
      } else if (event === 'conversion') {
        updatedPerformance.conversions += 1;
        updatedPerformance.conversion_rate = updatedPerformance.conversions / updatedPerformance.clicks;
        // Track revenue if available
        if (metadata?.revenue) {
          updatedPerformance.revenue += metadata.revenue;
          updatedPerformance.rpc = updatedPerformance.revenue / updatedPerformance.clicks;
        }
      }

      // Update in database
      await supabase
        .from('cta_placements')
        .update({ performance: updatedPerformance })
        .eq('id', ctaId);

      // Track in analytics
      await analytics.trackEvent(`cta_${event}`, {
        cta_id: ctaId,
        user_id: userId,
        session_id: sessionId,
        ...metadata,
      });

      // Check if we should optimize this CTA
      if (updatedPerformance.impressions > 1000 && updatedPerformance.ctr < 0.02) {
        await this.optimizeLowPerformingCTA(ctaId);
      }
    } catch (error) {
      // Error handled: Error tracking CTA interaction:
    }
  }

  /**
   * Generate optimized CTA variants using AI
   */
  static async generateOptimizedCTAs(
    page: string,
    context: string,
    targetAudience: string,
    numberOfVariants: number = 3
  ): Promise<CTAPlacement[]> {
    try {
      // Generate copy variants
      const copyVariants = await AICopywriter.generateCopyVariants(
        'cta_button',
        context,
        targetAudience,
        'casual',
        numberOfVariants
      );

      // Create CTA placements with different styles
      const placements: Omit<CTAPlacement, 'id' | 'performance'>[] = [];
      
      for (let i = 0; i < copyVariants.length; i++) {
        const variant = copyVariants[i];
        placements.push({
          page,
          section: 'hero',
          position: i === 0 ? 'above_fold' : 'below_fold',
          variant: `variant_${i + 1}`,
          text: variant.content,
          style: {
            variant: i === 0 ? 'primary' : i === 1 ? 'secondary' : 'outline',
            size: 'lg',
          },
        });
      }

      // Store placements in database
      const storedPlacements: CTAPlacement[] = [];
      for (const placement of placements) {
        const { data, error } = await supabase
          .from('cta_placements')
          .insert({
            ...placement,
            performance: {
              impressions: 0,
              clicks: 0,
              conversions: 0,
              ctr: 0,
              conversion_rate: 0,
              revenue: 0,
              rpc: 0,
            },
          })
          .select()
          .single();

        if (!error && data) {
          storedPlacements.push(data as CTAPlacement);
        }
      }

      return storedPlacements;
    } catch (error) {
      // Error handled: Error generating optimized CTAs:
      throw error;
    }
  }

  /**
   * Analyze funnel and identify bottlenecks
   */
  static async analyzeFunnel(
    funnelName: string,
    period: string = '30d'
  ): Promise<FunnelStage[]> {
    try {
      const periodDays = this.parsePeriod(period);
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

      // Get funnel events
      const { data: events, error } = await supabase
        .from('funnel_events')
        .select('funnel_stage, timestamp, user_id')
        .eq('funnel_name', funnelName)
        .gte('timestamp', startDate)
        .order('timestamp', { ascending: true });

      if (error) {
        // Error handled: Error fetching funnel events:
        return [];
      }

      // Calculate stage metrics
      const stageCounts: Record<string, { visitors: number; conversions: number; timestamps: number[] }> = {};
      
      events?.forEach((event: any) => {
        const stage = event.funnel_stage;
        if (!stageCounts[stage]) {
          stageCounts[stage] = { visitors: 0, conversions: 0, timestamps: [] };
        }
        stageCounts[stage].visitors += 1;
        if (event.timestamp) {
          stageCounts[stage].timestamps.push(new Date(event.timestamp).getTime());
        }
      });

      // Build funnel stages
      const stages: FunnelStage[] = [];
      const stageOrder = ['landing', 'signup', 'onboarding', 'first_recipe', 'subscription', 'activation'];
      let previousVisitors = stageCounts['landing']?.visitors || 0;

      for (const stageName of stageOrder) {
        const stageData = stageCounts[stageName] || { visitors: 0, conversions: 0, timestamps: [] };
        const visitors = stageData.visitors;
        const dropOffRate = previousVisitors > 0 ? (previousVisitors - visitors) / previousVisitors : 0;
        const conversionRate = previousVisitors > 0 ? visitors / previousVisitors : 0;
        
        // Calculate average time in stage
        const timestamps = stageData.timestamps.sort((a, b) => a - b);
        const averageTime = timestamps.length > 1
          ? timestamps.reduce((sum, ts, idx) => {
              if (idx === 0) return 0;
              return sum + (ts - timestamps[idx - 1]);
            }, 0) / (timestamps.length - 1) / 1000
          : 0;

        stages.push({
          name: stageName,
          visitors,
          drop_off_rate: dropOffRate,
          conversion_rate: conversionRate,
          average_time: averageTime,
        });

        previousVisitors = visitors;
      }

      return stages;
    } catch (error) {
      // Error handled: Error analyzing funnel:
      return [];
    }
  }

  /**
   * Get CRO insights and recommendations
   */
  static async getCROInsights(tenantId: string): Promise<CROInsights> {
    try {
      // Get all CTAs
      const { data: ctas, error: ctaError } = await supabase
        .from('cta_placements')
        .select('*')
        .gte('performance->impressions', 100)
        .order('performance->conversion_rate', { ascending: false });

      if (ctaError) {
        _logger.error('Error fetching CTAs:', { ctaError });
      }

      const allCTAs = (ctas || []) as CTAPlacement[];
      
      // Get top and worst performers
      const topCTAs = allCTAs.slice(0, 5);
      const worstCTAs = allCTAs.slice(-5).reverse();

      // Analyze funnel
      const funnel = await this.analyzeFunnel('main');
      const bottlenecks = funnel
        .filter(stage => stage.drop_off_rate > 0.3)
        .sort((a, b) => b.drop_off_rate - a.drop_off_rate);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        topCTAs,
        worstCTAs,
        bottlenecks
      );

      // Calculate estimated impact
      const estimatedImpact = this.calculateEstimatedImpact(
        topCTAs,
        worstCTAs,
        bottlenecks
      );

      return {
        top_ctas: topCTAs,
        worst_ctas: worstCTAs,
        funnel_bottlenecks: bottlenecks,
        recommendations,
        estimated_impact: estimatedImpact,
      };
    } catch (error) {
      // Error handled: Error getting CRO insights:
      throw error;
    }
  }

  /**
   * Optimize low-performing CTA
   */
  public static async optimizeLowPerformingCTA(ctaId: string): Promise<void> {
    try {
      const { data: cta, error } = await supabase
        .from('cta_placements')
        .select('*')
        .eq('id', ctaId)
        .single();

      if (error || !cta) return;

      // Generate new variants
      const newVariants = await this.generateOptimizedCTAs(
        cta.page,
        `Optimize CTA on ${cta.page} page`,
        'active_users',
        2
      );

      // Create A/B test
      await experiments.assignVariant(`cta_optimization_${ctaId}`, undefined);
      
      // Log optimization attempt
      await analytics.trackEvent('cta_optimization_triggered', {
        cta_id: ctaId,
        current_ctr: cta.performance?.ctr || 0,
        variants_generated: newVariants.length,
      });
    } catch (error) {
      // Error handled: Error optimizing CTA:
    }
  }

  /**
   * Generate recommendations based on insights
   */
  private static async generateRecommendations(
    topCTAs: CTAPlacement[],
    worstCTAs: CTAPlacement[],
    bottlenecks: FunnelStage[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // CTA recommendations
    if (worstCTAs.length > 0) {
      recommendations.push(
        `Replace ${worstCTAs.length} underperforming CTAs with variants inspired by top performers`
      );
    }

    if (topCTAs.length > 0) {
      const avgCTR = topCTAs.reduce((sum, cta) => sum + (cta.performance.ctr || 0), 0) / topCTAs.length;
      recommendations.push(
        `Top CTAs average ${(avgCTR * 100).toFixed(1)}% CTR. Apply successful patterns to other pages`
      );
    }

    // Funnel recommendations
    if (bottlenecks.length > 0) {
      bottlenecks.forEach(bottleneck => {
        recommendations.push(
          `${bottleneck.name} stage has ${(bottleneck.drop_off_rate * 100).toFixed(0)}% drop-off. Focus optimization efforts here`
        );
      });
    }

    // General recommendations
    if (topCTAs.some(cta => cta.style.variant === 'primary')) {
      recommendations.push(
        'Primary button style performs best. Consider using it for main CTAs'
      );
    }

    return recommendations;
  }

  /**
   * Calculate estimated impact of optimizations
   */
  private static calculateEstimatedImpact(
    topCTAs: CTAPlacement[],
    worstCTAs: CTAPlacement[],
    bottlenecks: FunnelStage[]
  ): { conversion_lift: number; revenue_lift: number } {
    let conversionLift = 0;
    let revenueLift = 0;

    // Impact from improving worst CTAs
    if (worstCTAs.length > 0 && topCTAs.length > 0) {
      const avgTopCTR = topCTAs.reduce((sum, cta) => sum + (cta.performance.ctr || 0), 0) / topCTAs.length;
      const avgWorstCTR = worstCTAs.reduce((sum, cta) => sum + (cta.performance.ctr || 0), 0) / worstCTAs.length;
      conversionLift += (avgTopCTR - avgWorstCTR) * 0.5; // Conservative estimate
    }

    // Impact from fixing bottlenecks
    bottlenecks.forEach(bottleneck => {
      conversionLift += bottleneck.drop_off_rate * 0.2; // Assuming 20% improvement
    });

    // Revenue impact (assuming average revenue per conversion)
    revenueLift = conversionLift * 50; // Placeholder: $50 avg revenue per conversion

    return {
      conversion_lift: Math.min(conversionLift * 100, 50), // Cap at 50%
      revenue_lift: Math.min(revenueLift, 10000), // Cap at $10k
    };
  }

  /**
   * Get session ID
   */
  private static getSessionId(): string {
    if (typeof window === 'undefined') {
      return 'server';
    }
    let sessionId = sessionStorage.getItem('cro_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('cro_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Parse period string to days
   */
  private static parsePeriod(period: string): number {
    const periodMap: Record<string, number> = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
    };
    return periodMap[period] || 30;
  }
}

export const croOptimizer = CROOptimizer;
