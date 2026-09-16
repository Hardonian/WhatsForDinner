import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('socialautomator');

import { supabase } from './supabaseClient';
import { openai } from './openaiClient';

export interface SocialPost {
  id: string;
  platform: 'twitter' | 'tiktok' | 'threads' | 'instagram' | 'linkedin';
  content: string;
  hashtags: string[];
  media_url?: string;
  scheduled_for?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  performance_metrics: {
    impressions: number;
    likes: number;
    shares: number;
    comments: number;
    engagement_rate: number;
  };
  created_at: string;
  published_at?: string;
}

export interface TrendingTheme {
  theme: string;
  keywords: string[];
  hashtags: string[];
  engagement_score: number;
  platform: string;
  trending_until: string;
}

export interface ContentStrategy {
  platform: string;
  content_types: string[];
  posting_frequency: string;
  optimal_times: string[];
  hashtag_strategy: string[];
}

export class SocialAutomator {
  /**
   * Generate trending dinner themes for social content
   */
  static async generateTrendingThemes(): Promise<TrendingTheme[]> {
    try {
      const prompt = `Analyze current food and dinner trends for social media content. Focus on:
- Seasonal ingredients and cooking methods
- Popular diet trends (keto, vegan, Mediterranean, etc.)
- Cultural food celebrations and holidays
- Viral cooking techniques and hacks
- Comfort food trends
- Health and wellness food movements

Generate 5 trending themes with:
- Theme name
- 3-5 relevant keywords
- 3-5 hashtags
- Engagement score (1-10)
- Best platform for the theme
- How long it's likely to trend (1-7 days)

Format as JSON array.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              "You are a social media trend analyst specializing in food and cooking content. Generate data-driven insights about what's trending in the food space.",
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content || '';
      const themes = JSON.parse(content) as TrendingTheme[];

      // Store trending themes in database
      for (const theme of themes) {
        await supabase.from('social_posts').insert({
          platform: theme.platform,
          content: `Trending theme: ${theme.theme}`,
          hashtags: theme.hashtags,
          status: 'draft',
          performance_metrics: {
            impressions: 0,
            likes: 0,
            shares: 0,
            comments: 0,
            engagement_rate: 0,
          },
        });
      }

      return themes;
    } catch (error) {
      // Error handled: Error generating trending themes:
      throw error;
    }
  }

  /**
   * Generate social media content for a specific platform and theme
   */
  static async generateSocialContent(
    platform: SocialPost['platform'],
    theme: string,
    contentType:
      | 'recipe_showcase'
      | 'cooking_tip'
      | 'ingredient_spotlight'
      | 'meal_prep'
      | 'nutrition_fact' = 'recipe_showcase'
  ): Promise<SocialPost> {
    try {
      const platformPrompts = {
        twitter:
          'Create a Twitter post (under 280 characters) that is engaging and shareable. Include relevant hashtags.',
        tiktok:
          'Create a TikTok caption that encourages engagement and uses trending language. Include hashtags for discoverability.',
        threads:
          'Create a Threads post that starts a conversation about food and cooking. Use a conversational tone.',
        instagram:
          'Create an Instagram caption that tells a story and encourages interaction. Include relevant hashtags.',
        linkedin:
          'Create a LinkedIn post that provides professional value about food, nutrition, or cooking. Use a more formal tone.',
      };

      const contentPrompts = {
        recipe_showcase:
          'Showcase a recipe with mouth-watering description and cooking tips.',
        cooking_tip:
          'Share a useful cooking tip or technique that saves time or improves results.',
        ingredient_spotlight:
          'Highlight a specific ingredient with its benefits and cooking uses.',
        meal_prep: 'Share meal prep advice or showcase a meal prep strategy.',
        nutrition_fact:
          'Share an interesting nutrition fact or health benefit related to food.',
      };

      const prompt = `${platformPrompts[platform]}

Theme: ${theme}
Content Type: ${contentPrompts[contentType]}

Requirements:
- Use engaging, platform-appropriate language
- Include 3-5 relevant hashtags
- Encourage interaction (likes, comments, shares)
- Keep it authentic and helpful
- Make it shareable

Generate the content:`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a social media content creator specializing in food and cooking. Create engaging, platform-specific content that drives engagement and shares.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 500,
      });

      const generatedContent = response.choices[0]?.message?.content || '';
      const { content, hashtags } = this.parseSocialContent(
        generatedContent,
        platform
      );

      // Store the generated content
      const { data, error } = await supabase
        .from('social_posts')
        .insert({
          platform,
          content,
          hashtags,
          status: 'draft',
          performance_metrics: {
            impressions: 0,
            likes: 0,
            shares: 0,
            comments: 0,
            engagement_rate: 0,
          },
        })
        .select()
        .single();

      if (error) {
        // Error handled: Error storing social content:
        throw error;
      }

      return data as SocialPost;
    } catch (error) {
      // Error handled: Error generating social content:
      throw error;
    }
  }

  /**
   * Parse generated social content to extract text and hashtags
   */
  private static parseSocialContent(
    content: string,
    platform: string
  ): { content: string; hashtags: string[] } {
    const hashtagRegex = /#\w+/g;
    const hashtags = content.match(hashtagRegex) || [];

    // Remove hashtags from content for cleaner display
    const cleanContent = content.replace(hashtagRegex, '').trim();

    return {
      content: cleanContent,
      hashtags: hashtags.map(tag => tag.substring(1)), // Remove # symbol
    };
  }

  /**
   * Schedule social media posts
   */
  static async schedulePost(
    postId: string,
    scheduledFor: string,
    platform: SocialPost['platform']
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('social_posts')
        .update({
          scheduled_for: scheduledFor,
          status: 'scheduled',
        })
        .eq('id', postId);

      if (error) {
        // Error handled: Error scheduling post:
        throw error;
      }

      // In a real implementation, you would integrate with scheduling services like:
      // - Buffer API
      // - Hootsuite API
      // - Facebook Graph API
      // - Twitter API v2
      // - LinkedIn API

          } catch (error) {
      // Error handled: Failed to schedule post:
      throw error;
    }
  }

  /**
   * Get optimal posting times for a platform
   */
  static async getOptimalPostingTimes(
    platform: SocialPost['platform']
  ): Promise<string[]> {
    const optimalTimes = {
      twitter: ['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM'],
      tiktok: ['6:00 AM', '10:00 AM', '7:00 PM', '9:00 PM'],
      threads: ['8:00 AM', '12:00 PM', '5:00 PM'],
      instagram: ['11:00 AM', '2:00 PM', '5:00 PM'],
      linkedin: ['8:00 AM', '12:00 PM', '5:00 PM'],
    };

    return optimalTimes[platform] || [];
  }

  /**
   * Generate content strategy for a platform
   */
  static async generateContentStrategy(
    platform: SocialPost['platform']
  ): Promise<ContentStrategy> {
    try {
      const prompt = `Create a comprehensive content strategy for ${platform} focused on food and cooking content.

Include:
- 5-7 content types that perform well on this platform
- Recommended posting frequency
- Optimal posting times (consider the platform's audience)
- Hashtag strategy (mix of popular and niche hashtags)
- Engagement tactics specific to this platform

Format as JSON.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are a social media strategist specializing in food and cooking content. Create data-driven strategies for maximum engagement.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content || '';
      return JSON.parse(content) as ContentStrategy;
    } catch (error) {
      // Error handled: Error generating content strategy:
      throw error;
    }
  }

  /**
   * Update post performance metrics
   */
  static async updatePostMetrics(
    postId: string,
    metrics: {
      impressions?: number;
      likes?: number;
      shares?: number;
      comments?: number;
    }
  ): Promise<void> {
    try {
      // Get current metrics
      const { data: currentPost, error: fetchError } = await supabase
        .from('social_posts')
        .select('performance_metrics')
        .eq('id', postId)
        .single();

      if (fetchError) {
        _logger.error('Error fetching current metrics:', { fetchError });
        return;
      }

      const currentMetrics = currentPost.performance_metrics || {
        impressions: 0,
        likes: 0,
        shares: 0,
        comments: 0,
        engagement_rate: 0,
      };

      // Update metrics
      const updatedMetrics = {
        ...currentMetrics,
        ...metrics,
        engagement_rate: this.calculateEngagementRate({
          ...currentMetrics,
          ...metrics,
        }),
      };

      // Save updated metrics
      const { error: updateError } = await supabase
        .from('social_posts')
        .update({ performance_metrics: updatedMetrics })
        .eq('id', postId);

      if (updateError) {
        _logger.error('Error updating post metrics:', { updateError });
        throw updateError;
      }
    } catch (error) {
      // Error handled: Failed to update post metrics:
      throw error;
    }
  }

  /**
   * Calculate engagement rate
   */
  private static calculateEngagementRate(metrics: {
    impressions: number;
    likes: number;
    shares: number;
    comments: number;
  }): number {
    if (metrics.impressions === 0) return 0;

    const totalEngagement = metrics.likes + metrics.shares + metrics.comments;
    return totalEngagement / metrics.impressions;
  }

  /**
   * Get top performing posts
   */
  static async getTopPerformingPosts(
    platform?: SocialPost['platform'],
    limit: number = 10
  ): Promise<SocialPost[]> {
    try {
      let query = supabase
        .from('social_posts')
        .select('*')
        .order('performance_metrics->engagement_rate', { ascending: false })
        .limit(limit);

      if (platform) {
        query = query.eq('platform', platform);
      }

      const { data, error } = await query;

      if (error) {
        // Error handled: Error fetching top performing posts:
        throw error;
      }

      return data as SocialPost[];
    } catch (error) {
      // Error handled: Failed to get top performing posts:
      throw error;
    }
  }

  /**
   * Generate viral content ideas
   */
  static async generateViralContentIdeas(
    platform: SocialPost['platform']
  ): Promise<string[]> {
    try {
      const prompt = `Generate 10 viral content ideas for ${platform} focused on food and cooking that are likely to go viral.

Consider:
- Current food trends and challenges
- Relatable cooking struggles
- Quick tips and hacks
- Before/after transformations
- Interactive content ideas
- Controversial food takes
- Nostalgic food content
- Educational content with a twist

Make them specific, actionable, and platform-appropriate.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are a viral content strategist specializing in food and cooking content. Generate ideas that are likely to get high engagement and shares.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.9,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content || '';
      return content
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, ''));
    } catch (error) {
      // Error handled: Error generating viral content ideas:
      throw error;
    }
  }

  /**
   * Analyze competitor content
   */
  static async analyzeCompetitorContent(
    competitorHandle: string,
    platform: SocialPost['platform']
  ): Promise<{
    top_hashtags: string[];
    content_themes: string[];
    posting_patterns: string[];
    engagement_tactics: string[];
  }> {
    try {
      const prompt = `Analyze the social media strategy of @${competitorHandle} on ${platform} for food/cooking content.

Provide insights on:
- Top performing hashtags they use
- Common content themes and topics
- Posting frequency and timing patterns
- Engagement tactics that work for them
- Content formats that get the most engagement

Format as JSON with arrays for each category.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are a social media analyst. Analyze competitor strategies and extract actionable insights.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content || '';
      return JSON.parse(content);
    } catch (error) {
      // Error handled: Error analyzing competitor content:
      throw error;
    }
  }

  /**
   * Generate daily content calendar
   */
  static async generateContentCalendar(
    platform: SocialPost['platform'],
    days: number = 7
  ): Promise<
    Array<{
      date: string;
      content_ideas: string[];
      optimal_times: string[];
      hashtags: string[];
    }>
  > {
    try {
      const prompt = `Create a ${days}-day content calendar for ${platform} focused on food and cooking.

For each day, include:
- 3-5 content ideas
- Optimal posting times
- Relevant hashtags for that day's theme
- Mix of different content types (recipes, tips, behind-the-scenes, etc.)

Consider:
- Weekly themes (Meatless Monday, Taco Tuesday, etc.)
- Seasonal relevance
- Platform-specific best practices
- Variety in content types

Format as JSON array.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are a content calendar strategist. Create engaging, varied content plans that maximize reach and engagement.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || '';
      return JSON.parse(content);
    } catch (error) {
      // Error handled: Error generating content calendar:
      throw error;
    }
  }
}
