import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('aicopywriter');

import { supabase } from './supabaseClient';
import { openai } from './openaiClient';

export interface CopyVariant {
  id: string;
  content_type:
    | 'landing_headline'
    | 'email_subject'
    | 'feature_copy'
    | 'cta_button'
    | 'social_post';
  variant_name: string;
  content: string;
  performance_metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    conversion_rate: number;
  };
  is_winner: boolean;
  test_id: string;
  created_at: string;
}

export interface AITestResult {
  variants: CopyVariant[];
  winner: CopyVariant | null;
  confidence_level: number;
  recommended_action: string;
}

export class AICopywriter {
  /**
   * Generate copy variants for A/B testing
   */
  static async generateCopyVariants(
    contentType: CopyVariant['content_type'],
    context: string,
    targetAudience: string,
    tone: 'professional' | 'casual' | 'urgent' | 'friendly' = 'professional',
    numberOfVariants: number = 3
  ): Promise<CopyVariant[]> {
    try {
      const prompt = this.buildCopyPrompt(
        contentType,
        context,
        targetAudience,
        tone,
        numberOfVariants
      );

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert copywriter specializing in conversion optimization. Generate ${numberOfVariants} distinct variants for ${contentType} that will be A/B tested. Each variant should have a different approach or angle.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 1000,
      });

      const generatedContent = response.choices[0]?.message?.content || '';
      const variants = this.parseGeneratedVariants(
        generatedContent,
        contentType
      );

      // Store variants in database
      const storedVariants: CopyVariant[] = [];
      for (const variant of variants) {
        const { data, error } = await supabase
          .from('ai_copy_logs')
          .insert({
            content_type: contentType,
            variant_name: variant.variant_name,
            content: variant.content,
            performance_metrics: {
              impressions: 0,
              clicks: 0,
              conversions: 0,
              ctr: 0,
              conversion_rate: 0,
            },
            is_winner: false,
          })
          .select()
          .single();

        if (!error && data) {
          storedVariants.push(data as CopyVariant);
        }
      }

      return storedVariants;
    } catch (error) {
      // Error handled: Error generating copy variants:
      throw error;
    }
  }

  /**
   * Build copy generation prompt
   */
  private static buildCopyPrompt(
    contentType: CopyVariant['content_type'],
    context: string,
    targetAudience: string,
    tone: string,
    numberOfVariants: number
  ): string {
    const basePrompt = `Generate ${numberOfVariants} distinct copy variants for a ${contentType} with the following specifications:

Context: ${context}
Target Audience: ${targetAudience}
Tone: ${tone}

Content Type Specifics:`;

    switch (contentType) {
      case 'landing_headline':
        return `${basePrompt}
- Create compelling headlines that capture attention and communicate value
- Focus on benefits, not features
- Use power words and emotional triggers
- Keep under 60 characters for optimal display
- Each variant should test a different angle (benefit-focused, problem-focused, curiosity-driven, etc.)

Format each variant as:
Variant 1: [headline]
Variant 2: [headline]
Variant 3: [headline]`;

      case 'email_subject':
        return `${basePrompt}
- Create subject lines that increase open rates
- Use personalization, urgency, or curiosity
- Avoid spam trigger words
- Keep under 50 characters
- Test different approaches (question, benefit, urgency, personalization)

Format each variant as:
Variant 1: [subject line]
Variant 2: [subject line]
Variant 3: [subject line]`;

      case 'cta_button':
        return `${basePrompt}
- Create compelling call-to-action button text
- Use action-oriented language
- Create urgency or excitement
- Keep under 25 characters
- Test different approaches (action-focused, benefit-focused, urgency-focused)

Format each variant as:
Variant 1: [button text]
Variant 2: [button text]
Variant 3: [button text]`;

      case 'feature_copy':
        return `${basePrompt}
- Create compelling feature descriptions
- Focus on user benefits and outcomes
- Use clear, concise language
- Keep under 100 characters
- Test different approaches (benefit-focused, problem-solving, social proof)

Format each variant as:
Variant 1: [feature description]
Variant 2: [feature description]
Variant 3: [feature description]`;

      case 'social_post':
        return `${basePrompt}
- Create engaging social media posts
- Include relevant hashtags
- Use platform-appropriate tone
- Keep under 280 characters for Twitter
- Test different approaches (educational, entertaining, promotional)

Format each variant as:
Variant 1: [post content]
Variant 2: [post content]
Variant 3: [post content]`;

      default:
        return basePrompt;
    }
  }

  /**
   * Parse generated variants from AI response
   */
  private static parseGeneratedVariants(
    content: string,
    contentType: CopyVariant['content_type']
  ): Omit<CopyVariant, 'id' | 'test_id' | 'created_at'>[] {
    const lines = content.split('\n').filter(line => line.trim());
    const variants: Omit<CopyVariant, 'id' | 'test_id' | 'created_at'>[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('Variant') && line.includes(':')) {
        const variantText = line.split(':')[1]?.trim();
        if (variantText) {
          variants.push({
            content_type: contentType,
            variant_name: `Variant ${variants.length + 1}`,
            content: variantText,
            performance_metrics: {
              impressions: 0,
              clicks: 0,
              conversions: 0,
              ctr: 0,
              conversion_rate: 0,
            },
            is_winner: false,
          });
        }
      }
    }

    return variants;
  }

  /**
   * Update copy performance metrics
   */
  static async updateCopyMetrics(
    variantId: string,
    metrics: {
      impressions?: number;
      clicks?: number;
      conversions?: number;
    }
  ): Promise<void> {
    try {
      // Get current metrics
      const { data: currentVariant, error: fetchError } = await supabase
        .from('ai_copy_logs')
        .select('performance_metrics')
        .eq('id', variantId)
        .single();

      if (fetchError) {
        _logger.error('Error fetching current metrics:', { fetchError });
        return;
      }

      const currentMetrics = currentVariant.performance_metrics || {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        conversion_rate: 0,
      };

      // Update metrics
      const updatedMetrics = {
        ...currentMetrics,
        ...metrics,
        ctr:
          metrics.clicks && metrics.impressions
            ? metrics.clicks / metrics.impressions
            : currentMetrics.ctr,
        conversion_rate:
          metrics.conversions && metrics.clicks
            ? metrics.conversions / metrics.clicks
            : currentMetrics.conversion_rate,
      };

      // Save updated metrics
      const { error: updateError } = await supabase
        .from('ai_copy_logs')
        .update({ performance_metrics: updatedMetrics })
        .eq('id', variantId);

      if (updateError) {
        _logger.error('Error updating copy metrics:', { updateError });
        throw updateError;
      }
    } catch (error) {
      // Error handled: Failed to update copy metrics:
      throw error;
    }
  }

  /**
   * Analyze A/B test results and determine winner
   */
  static async analyzeTestResults(testId: string): Promise<AITestResult> {
    try {
      const { data: variants, error } = await supabase
        .from('ai_copy_logs')
        .select('*')
        .eq('test_id', testId);

      if (error) {
        // Error handled: Error fetching test variants:
        throw error;
      }

      if (!variants || variants.length === 0) {
        return {
          variants: [],
          winner: null,
          confidence_level: 0,
          recommended_action: 'No data available',
        };
      }

      // Find winner based on conversion rate
      const sortedVariants = variants.sort(
        (a, b) =>
          b.performance_metrics.conversion_rate -
          a.performance_metrics.conversion_rate
      );

      const winner = sortedVariants[0];
      const secondBest = sortedVariants[1];

      // Calculate confidence level
      const confidenceLevel = this.calculateConfidenceLevel(winner, secondBest);

      // Generate recommendation
      const recommendedAction = this.generateRecommendation(
        winner,
        confidenceLevel
      );

      // Mark winner in database
      if (confidenceLevel > 0.8) {
        await supabase
          .from('ai_copy_logs')
          .update({ is_winner: true })
          .eq('id', winner.id);
      }

      return {
        variants: variants as CopyVariant[],
        winner: winner as CopyVariant,
        confidence_level: confidenceLevel,
        recommended_action: recommendedAction,
      };
    } catch (error) {
      // Error handled: Failed to analyze test results:
      throw error;
    }
  }

  /**
   * Calculate statistical confidence level
   */
  private static calculateConfidenceLevel(
    winner: any,
    secondBest: any
  ): number {
    const winnerRate = winner.performance_metrics.conversion_rate;
    const secondRate = secondBest?.performance_metrics.conversion_rate || 0;
    const winnerClicks = winner.performance_metrics.clicks;
    const secondClicks = secondBest?.performance_metrics.clicks || 0;

    // Simple confidence calculation based on difference and sample size
    const rateDifference = winnerRate - secondRate;
    const minSampleSize = Math.min(winnerClicks, secondClicks);

    if (minSampleSize < 100) return 0.5; // Low confidence for small samples
    if (rateDifference < 0.05) return 0.6; // Low confidence for small differences
    if (rateDifference < 0.1) return 0.7; // Medium confidence
    if (rateDifference < 0.2) return 0.8; // High confidence
    return 0.9; // Very high confidence
  }

  /**
   * Generate recommendation based on test results
   */
  private static generateRecommendation(
    winner: any,
    confidenceLevel: number
  ): string {
    const winnerRate = winner.performance_metrics.conversion_rate;
    const winnerCtr = winner.performance_metrics.ctr;

    if (confidenceLevel < 0.7) {
      return 'Continue testing with larger sample size to reach statistical significance';
    }

    if (winnerRate > 0.1) {
      return `Winner identified with ${(confidenceLevel * 100).toFixed(0)}% confidence. Implement immediately and consider scaling to other campaigns.`;
    }

    if (winnerCtr > 0.05) {
      return `Winner has good click-through rate (${(winnerCtr * 100).toFixed(1)}%). Focus on improving conversion rate with better landing page optimization.`;
    }

    return 'Winner identified but performance is below expectations. Consider testing new variants or improving targeting.';
  }

  /**
   * Get copy performance insights
   */
  static async getCopyInsights(
    contentType: CopyVariant['content_type']
  ): Promise<{
    best_performing: CopyVariant[];
    worst_performing: CopyVariant[];
    average_metrics: {
      ctr: number;
      conversion_rate: number;
    };
    recommendations: string[];
  }> {
    try {
      const { data: variants, error } = await supabase
        .from('ai_copy_logs')
        .select('*')
        .eq('content_type', contentType)
        .order('performance_metrics->conversion_rate', { ascending: false });

      if (error) {
        // Error handled: Error fetching copy insights:
        throw error;
      }

      if (!variants || variants.length === 0) {
        return {
          best_performing: [],
          worst_performing: [],
          average_metrics: { ctr: 0, conversion_rate: 0 },
          recommendations: [],
        };
      }

      const typedVariants = variants as CopyVariant[];
      const bestPerforming = typedVariants.slice(0, 3);
      const worstPerforming = typedVariants.slice(-3);

      const totalCtr = typedVariants.reduce(
        (sum, v) => sum + v.performance_metrics.ctr,
        0
      );
      const totalConversionRate = typedVariants.reduce(
        (sum, v) => sum + v.performance_metrics.conversion_rate,
        0
      );

      const averageMetrics = {
        ctr: totalCtr / typedVariants.length,
        conversion_rate: totalConversionRate / typedVariants.length,
      };

      const recommendations = this.generateInsightRecommendations(
        typedVariants,
        averageMetrics
      );

      return {
        best_performing: bestPerforming,
        worst_performing: worstPerforming,
        average_metrics: averageMetrics,
        recommendations,
      };
    } catch (error) {
      // Error handled: Failed to get copy insights:
      throw error;
    }
  }

  /**
   * Generate insight-based recommendations
   */
  private static generateInsightRecommendations(
    variants: CopyVariant[],
    averageMetrics: { ctr: number; conversion_rate: number }
  ): string[] {
    const recommendations: string[] = [];

    if (averageMetrics.ctr < 0.02) {
      recommendations.push(
        'Low click-through rates detected. Focus on more compelling headlines and better targeting.'
      );
    }

    if (averageMetrics.conversion_rate < 0.05) {
      recommendations.push(
        'Low conversion rates. Consider improving landing page experience and value proposition.'
      );
    }

    const highPerformingVariants = variants.filter(
      v =>
        v.performance_metrics.conversion_rate >
        averageMetrics.conversion_rate * 1.5
    );
    if (highPerformingVariants.length > 0) {
      recommendations.push(
        `Found ${highPerformingVariants.length} high-performing variants. Consider using their successful elements in future tests.`
      );
    }

    const lowPerformingVariants = variants.filter(
      v =>
        v.performance_metrics.conversion_rate <
        averageMetrics.conversion_rate * 0.5
    );
    if (lowPerformingVariants.length > variants.length * 0.3) {
      recommendations.push(
        'Many variants are underperforming. Consider testing completely different approaches or messaging strategies.'
      );
    }

    return recommendations;
  }

  /**
   * Generate copy for specific use case
   */
  static async generateCopyForUseCase(
    useCase: string,
    contentType: CopyVariant['content_type'],
    context: Record<string, unknown>
  ): Promise<string> {
    try {
      const prompt = `Generate ${contentType} for the following use case:

Use Case: ${useCase}
Context: ${JSON.stringify(context, null, 2)}

Requirements:
- Optimize for conversion
- Match the brand voice
- Be specific to the use case
- Include relevant details from context

Generate the copy:`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert copywriter focused on conversion optimization. Generate compelling copy that drives action.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      // Error handled: Failed to generate copy for use case:
      throw error;
    }
  }
}
