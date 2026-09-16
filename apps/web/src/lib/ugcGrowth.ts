import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('ugcgrowth');

import { supabase } from './supabaseClient';

export interface UGCShare {
  id: string;
  user_id: string;
  recipe_id?: string;
  content_type:
    | 'meal_card'
    | 'recipe_share'
    | 'cooking_tip'
    | 'ingredient_spotlight';
  title: string;
  description: string;
  image_url?: string;
  social_platforms: string[];
  share_url: string;
  metadata: {
    recipe_name?: string;
    cooking_time?: number;
    difficulty_level?: 'easy' | 'medium' | 'hard';
    cuisine_type?: string;
    dietary_tags?: string[];
    nutrition_info?: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  };
  performance_metrics: {
    views: number;
    likes: number;
    shares: number;
    clicks: number;
    conversions: number;
    engagement_rate: number;
  };
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  published_at?: string;
}

export interface MealCard {
  id: string;
  title: string;
  description: string;
  image_url: string;
  recipe_name: string;
  cooking_time: number;
  difficulty_level: 'easy' | 'medium' | 'hard';
  cuisine_type: string;
  dietary_tags: string[];
  nutrition_info: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  share_url: string;
  created_at: string;
}

export interface ShareAnalytics {
  total_shares: number;
  total_views: number;
  total_engagement: number;
  top_performing_content: UGCShare[];
  platform_breakdown: Record<string, number>;
  conversion_rate: number;
  viral_coefficient: number;
}

export class UGCGrowth {
  /**
   * Create a shareable meal card
   */
  static async createMealCard(
    userId: string,
    recipeData: {
      recipe_name: string;
      cooking_time: number;
      difficulty_level: 'easy' | 'medium' | 'hard';
      cuisine_type: string;
      dietary_tags: string[];
      nutrition_info: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      };
      image_url?: string;
    }
  ): Promise<MealCard> {
    try {
      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/share/meal/${Date.now()}`;

      const mealCard: Omit<MealCard, 'id' | 'created_at'> = {
        title: `Delicious ${recipeData.recipe_name}`,
        description: `A ${recipeData.difficulty_level} ${recipeData.cuisine_type} recipe that takes ${recipeData.cooking_time} minutes to make`,
        image_url: recipeData.image_url || '/default-meal-image.jpg',
        recipe_name: recipeData.recipe_name,
        cooking_time: recipeData.cooking_time,
        difficulty_level: recipeData.difficulty_level,
        cuisine_type: recipeData.cuisine_type,
        dietary_tags: recipeData.dietary_tags,
        nutrition_info: recipeData.nutrition_info,
        share_url: shareUrl,
      };

      const { data, error } = await supabase
        .from('ugc_shares')
        .insert({
          user_id: userId,
          content_type: 'meal_card',
          title: mealCard.title,
          description: mealCard.description,
          image_url: mealCard.image_url,
          social_platforms: [],
          share_url: shareUrl,
          metadata: {
            recipe_name: recipeData.recipe_name,
            cooking_time: recipeData.cooking_time,
            difficulty_level: recipeData.difficulty_level,
            cuisine_type: recipeData.cuisine_type,
            dietary_tags: recipeData.dietary_tags,
            nutrition_info: recipeData.nutrition_info,
          },
          performance_metrics: {
            views: 0,
            likes: 0,
            shares: 0,
            clicks: 0,
            conversions: 0,
            engagement_rate: 0,
          },
          status: 'draft',
        })
        .select()
        .single();

      if (error) {
        // Error handled: Error creating meal card:
        throw error;
      }

      return {
        id: data.id,
        ...mealCard,
        created_at: data.created_at,
      } as MealCard;
    } catch (error) {
      // Error handled: Failed to create meal card:
      throw error;
    }
  }

  /**
   * Share content to social platforms
   */
  static async shareToSocial(
    shareId: string,
    platforms: string[],
    customMessage?: string
  ): Promise<void> {
    try {
      // Get the share data
      const { data: shareData, error: fetchError } = await supabase
        .from('ugc_shares')
        .select('*')
        .eq('id', shareId)
        .single();

      if (fetchError) {
        _logger.error('Error fetching share data:', { fetchError });
        throw fetchError;
      }

      // Update social platforms
      const { error: updateError } = await supabase
        .from('ugc_shares')
        .update({
          social_platforms: platforms,
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .eq('id', shareId);

      if (updateError) {
        _logger.error('Error updating social platforms:', { updateError });
        throw updateError;
      }

      // Generate platform-specific share URLs
      const shareUrls = this.generateShareUrls(
        shareData,
        platforms,
        customMessage
      );

      // In a real implementation, you would:
      // 1. Use platform APIs to post content
      // 2. Track the posted content IDs
      // 3. Set up webhooks to track engagement

          } catch (error) {
      // Error handled: Failed to share to social:
      throw error;
    }
  }

  /**
   * Generate platform-specific share URLs
   */
  private static generateShareUrls(
    shareData: UGCShare,
    platforms: string[],
    customMessage?: string
  ): Record<string, string> {
    const baseUrl = shareData.share_url;
    const title = encodeURIComponent(shareData.title);
    const description = encodeURIComponent(
      customMessage || shareData.description
    );
    const imageUrl = encodeURIComponent(shareData.image_url || '');

    const shareUrls: Record<string, string> = {};

    platforms.forEach(platform => {
      switch (platform) {
        case 'twitter':
          shareUrls.twitter = `https://twitter.com/intent/tweet?text=${title}&url=${baseUrl}`;
          break;
        case 'facebook':
          shareUrls.facebook = `https://www.facebook.com/sharer/sharer.php?u=${baseUrl}`;
          break;
        case 'linkedin':
          shareUrls.linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${baseUrl}`;
          break;
        case 'pinterest':
          shareUrls.pinterest = `https://pinterest.com/pin/create/button/?url=${baseUrl}&media=${imageUrl}&description=${description}`;
          break;
        case 'whatsapp':
          shareUrls.whatsapp = `https://wa.me/?text=${title}%20${baseUrl}`;
          break;
        case 'telegram':
          shareUrls.telegram = `https://t.me/share/url?url=${baseUrl}&text=${title}`;
          break;
        default:
          shareUrls[platform] = baseUrl;
      }
    });

    return shareUrls;
  }

  /**
   * Track share engagement
   */
  static async trackEngagement(
    shareId: string,
    eventType: 'view' | 'like' | 'share' | 'click' | 'conversion',
    platform?: string
  ): Promise<void> {
    try {
      // Get current metrics
      const { data: currentShare, error: fetchError } = await supabase
        .from('ugc_shares')
        .select('performance_metrics')
        .eq('id', shareId)
        .single();

      if (fetchError) {
        _logger.error('Error fetching current metrics:', { fetchError });
        return;
      }

      const currentMetrics = currentShare.performance_metrics || {
        views: 0,
        likes: 0,
        shares: 0,
        clicks: 0,
        conversions: 0,
        engagement_rate: 0,
      };

      // Update metrics based on event type
      const updatedMetrics = { ...currentMetrics };

      switch (eventType) {
        case 'view':
          updatedMetrics.views += 1;
          break;
        case 'like':
          updatedMetrics.likes += 1;
          break;
        case 'share':
          updatedMetrics.shares += 1;
          break;
        case 'click':
          updatedMetrics.clicks += 1;
          break;
        case 'conversion':
          updatedMetrics.conversions += 1;
          break;
      }

      // Calculate engagement rate
      updatedMetrics.engagement_rate =
        this.calculateEngagementRate(updatedMetrics);

      // Save updated metrics
      const { error: updateError } = await supabase
        .from('ugc_shares')
        .update({ performance_metrics: updatedMetrics })
        .eq('id', shareId);

      if (updateError) {
        _logger.error('Error updating engagement metrics:', { updateError });
        throw updateError;
      }

      // Log the engagement event for analytics
      await supabase.from('funnel_events').insert({
        user_id: null, // Anonymous engagement
        session_id: `ugc_${shareId}`,
        funnel_stage: 'ugc_engagement',
        event_data: {
          share_id: shareId,
          event_type: eventType,
          platform: platform || 'unknown',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      // Error handled: Failed to track engagement:
      throw error;
    }
  }

  /**
   * Calculate engagement rate
   */
  private static calculateEngagementRate(metrics: {
    views: number;
    likes: number;
    shares: number;
    clicks: number;
    conversions: number;
  }): number {
    if (metrics.views === 0) return 0;

    const totalEngagement = metrics.likes + metrics.shares + metrics.clicks;
    return totalEngagement / metrics.views;
  }

  /**
   * Get user's UGC analytics
   */
  static async getUserUGCAnalytics(userId: string): Promise<ShareAnalytics> {
    try {
      const { data: shares, error } = await supabase
        .from('ugc_shares')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'published');

      if (error) {
        // Error handled: Error fetching user UGC analytics:
        throw error;
      }

      const totalShares = shares.length;
      const totalViews = shares.reduce(
        (sum, share) => sum + share.performance_metrics.views,
        0
      );
      const totalEngagement = shares.reduce(
        (sum, share) =>
          sum +
          share.performance_metrics.likes +
          share.performance_metrics.shares +
          share.performance_metrics.clicks,
        0
      );

      const topPerforming = shares
        .sort(
          (a, b) =>
            b.performance_metrics.engagement_rate -
            a.performance_metrics.engagement_rate
        )
        .slice(0, 5);

      const platformBreakdown = shares.reduce(
        (acc, share) => {
          share.social_platforms.forEach((platform: string) => {
            acc[platform] = (acc[platform] || 0) + 1;
          });
          return acc;
        },
        {} as Record<string, number>
      );

      const conversionRate =
        totalViews > 0
          ? shares.reduce(
              (sum, share) => sum + share.performance_metrics.conversions,
              0
            ) / totalViews
          : 0;

      const viralCoefficient =
        totalShares > 0 ? totalEngagement / totalShares : 0;

      return {
        total_shares: totalShares,
        total_views: totalViews,
        total_engagement: totalEngagement,
        top_performing_content: topPerforming,
        platform_breakdown: platformBreakdown,
        conversion_rate: conversionRate,
        viral_coefficient: viralCoefficient,
      };
    } catch (error) {
      // Error handled: Failed to get user UGC analytics:
      throw error;
    }
  }

  /**
   * Get trending UGC content
   */
  static async getTrendingUGC(limit: number = 10): Promise<UGCShare[]> {
    try {
      const { data, error } = await supabase
        .from('ugc_shares')
        .select('*')
        .eq('status', 'published')
        .order('performance_metrics->engagement_rate', { ascending: false })
        .limit(limit);

      if (error) {
        // Error handled: Error fetching trending UGC:
        throw error;
      }

      return data as UGCShare[];
    } catch (error) {
      // Error handled: Failed to get trending UGC:
      throw error;
    }
  }

  /**
   * Generate shareable content suggestions
   */
  static async generateShareSuggestions(
    userId: string,
    recipeData: any
  ): Promise<{
    suggested_titles: string[];
    suggested_descriptions: string[];
    suggested_hashtags: string[];
    optimal_platforms: string[];
  }> {
    try {
      // Get user's historical performance
      const analytics = await this.getUserUGCAnalytics(userId);

      // Get trending content for inspiration
      const trending = await this.getTrendingUGC(5);

      // Generate suggestions based on user's best performing content and trends
      const suggestedTitles = [
        `Amazing ${recipeData.cuisine_type} Recipe: ${recipeData.recipe_name}`,
        `Quick & Easy ${recipeData.recipe_name} (${recipeData.cooking_time} min)`,
        `Healthy ${recipeData.recipe_name} - Perfect for ${recipeData.dietary_tags.join(', ')}`,
        `My New Favorite ${recipeData.cuisine_type} Recipe!`,
        `You HAVE to try this ${recipeData.recipe_name} recipe!`,
      ];

      const suggestedDescriptions = [
        `Just made this incredible ${recipeData.recipe_name} and it was absolutely delicious! Perfect for a ${recipeData.difficulty_level} level cook.`,
        `This ${recipeData.cuisine_type} recipe is a game-changer! Only takes ${recipeData.cooking_time} minutes and tastes amazing.`,
        `Found this amazing recipe and had to share! The ${recipeData.recipe_name} turned out perfectly.`,
        `If you love ${recipeData.cuisine_type} food, you need to try this ${recipeData.recipe_name} recipe!`,
        `This ${recipeData.recipe_name} is going to be your new go-to recipe. So easy and so good!`,
      ];

      const suggestedHashtags = [
        '#recipe',
        '#cooking',
        '#food',
        `#${recipeData.cuisine_type.toLowerCase()}`,
        `#${recipeData.difficulty_level}`,
        ...recipeData.dietary_tags.map(
          (tag: string) => `#${tag.toLowerCase()}`
        ),
        '#homemade',
        '#delicious',
        '#foodie',
      ];

      // Determine optimal platforms based on user's performance
      const platformPerformance = Object.entries(analytics.platform_breakdown)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([platform]) => platform);

      const optimalPlatforms =
        platformPerformance.length > 0
          ? platformPerformance
          : ['twitter', 'instagram', 'facebook'];

      return {
        suggested_titles: suggestedTitles,
        suggested_descriptions: suggestedDescriptions,
        suggested_hashtags: suggestedHashtags,
        optimal_platforms: optimalPlatforms,
      };
    } catch (error) {
      // Error handled: Failed to generate share suggestions:
      throw error;
    }
  }

  /**
   * Create a shareable meal card component data
   */
  static async createShareableMealCardData(
    recipeData: any,
    customizations?: {
      title?: string;
      description?: string;
      style?: 'minimal' | 'vibrant' | 'elegant';
      include_nutrition?: boolean;
      include_ingredients?: boolean;
    }
  ): Promise<{
    card_data: any;
    share_urls: Record<string, string>;
  }> {
    try {
      const shareId = `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/share/meal/${shareId}`;

      const cardData = {
        id: shareId,
        title: customizations?.title || `Delicious ${recipeData.recipe_name}`,
        description:
          customizations?.description ||
          `A ${recipeData.difficulty_level} ${recipeData.cuisine_type} recipe`,
        image_url: recipeData.image_url || '/default-meal-image.jpg',
        recipe_name: recipeData.recipe_name,
        cooking_time: recipeData.cooking_time,
        difficulty_level: recipeData.difficulty_level,
        cuisine_type: recipeData.cuisine_type,
        dietary_tags: recipeData.dietary_tags || [],
        nutrition_info: customizations?.include_nutrition
          ? recipeData.nutrition_info
          : null,
        ingredients: customizations?.include_ingredients
          ? recipeData.ingredients
          : null,
        style: customizations?.style || 'minimal',
        share_url: shareUrl,
        created_at: new Date().toISOString(),
      };

      const shareUrls = this.generateShareUrls(
        {
          id: shareId,
          user_id: '',
          content_type: 'meal_card',
          title: cardData.title,
          description: cardData.description,
          image_url: cardData.image_url,
          social_platforms: [],
          share_url: shareUrl,
          metadata: {},
          performance_metrics: {
            views: 0,
            likes: 0,
            shares: 0,
            clicks: 0,
            conversions: 0,
            engagement_rate: 0,
          },
          status: 'draft',
          created_at: cardData.created_at,
        },
        ['twitter', 'facebook', 'linkedin', 'pinterest', 'whatsapp']
      );

      return {
        card_data: cardData,
        share_urls: shareUrls,
      };
    } catch (error) {
      // Error handled: Failed to create shareable meal card data:
      throw error;
    }
  }
}
