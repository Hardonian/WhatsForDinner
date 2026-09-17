import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('image-generation');

/**
 * Recipe Image Generation
 * Uses AI to generate recipe images
 */

import OpenAI from 'openai';
import { cache } from '@/lib/cache';

function getOpenAIClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'sk-mock-key-for-testing',
    dangerouslyAllowBrowser: true,
  });
}

export interface ImageGenerationOptions {
  recipeTitle: string;
  ingredients?: string[];
  cuisine?: string;
  style?: 'photographic' | 'illustrated' | 'minimalist';
}

/**
 * Generate recipe image using DALL-E
 */
export async function generateRecipeImage(
  options: ImageGenerationOptions
): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      _logger.debug('OPENAI_API_KEY not provided, using verified culinary fallback');
      return getUnsplashFallback(options.recipeTitle, options.cuisine);
    }

    const ingredientsList = Array.isArray(options.ingredients) && options.ingredients.length > 0
      ? options.ingredients.join(', ')
      : 'fresh culinary ingredients';

    const prompt = `A beautiful, appetizing photo of ${options.recipeTitle}. 
    Ingredients include: ${ingredientsList}.
    ${options.cuisine ? `Cuisine style: ${options.cuisine}.` : ''}
    ${options.style ? `Style: ${options.style}.` : 'Photographic style, professional food photography.'}
    High quality, well-lit, appetizing, on a clean plate or serving dish.`;

    const openai = getOpenAIClient();
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    return response.data[0]?.url || '';
  } catch (error) {
    _logger.error('Image generation error:', { error: error instanceof Error ? error.message : String(error) });
    // Fallback to Unsplash
    return getUnsplashFallback(options.recipeTitle, options.cuisine);
  }
}

/**
 * Reliable high-resolution culinary photography CDN fallback
 * Replaces deprecated source.unsplash.com with verified Unsplash CDN photo IDs & local fallback
 */
const CULINARY_PHOTO_MAP: Array<{ keywords: string[]; url: string }> = [
  {
    keywords: ['salmon', 'trout', 'fish', 'seafood', 'shrimp', 'halibut'],
    url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1024&q=80',
  },
  {
    keywords: ['chicken', 'poulet', 'poultry', 'turkey', 'wings'],
    url: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=1024&q=80',
  },
  {
    keywords: ['pasta', 'spaghetti', 'noodle', 'lasagna', 'fettuccine', 'italian'],
    url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1024&q=80',
  },
  {
    keywords: ['steak', 'beef', 'burger', 'brisket', 'meat', 'pork'],
    url: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1024&q=80',
  },
  {
    keywords: ['salad', 'vegetarian', 'vegan', 'greens', 'bowl', 'quinoa', 'mediterranean'],
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1024&q=80',
  },
  {
    keywords: ['curry', 'asian', 'stir-fry', 'thai', 'indian', 'rice', 'wok'],
    url: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=1024&q=80',
  },
  {
    keywords: ['soup', 'stew', 'broth', 'chili', 'chowder'],
    url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1024&q=80',
  },
  {
    keywords: ['dessert', 'cake', 'chocolate', 'cookie', 'sweet', 'pie', 'pastry', 'bake'],
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1024&q=80',
  },
  {
    keywords: ['breakfast', 'egg', 'pancake', 'waffle', 'toast', 'omelet', 'brunch'],
    url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1024&q=80',
  },
  {
    keywords: ['pizza', 'flatbread', 'focaccia'],
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1024&q=80',
  },
  {
    keywords: ['taco', 'mexican', 'burrito', 'enchilada', 'quesadilla', 'salsa'],
    url: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1024&q=80',
  },
];

export function getRecipeFallbackImage(recipeTitle: string, cuisine?: string): string {
  const text = `${recipeTitle} ${cuisine || ''}`.toLowerCase();
  const match = CULINARY_PHOTO_MAP.find(entry =>
    entry.keywords.some(kw => text.includes(kw))
  );
  return match ? match.url : '/recipe-placeholder.jpg';
}

async function getUnsplashFallback(recipeTitle: string, cuisine?: string): Promise<string> {
  return getRecipeFallbackImage(recipeTitle, cuisine);
}

/**
 * Retrieve cached image URL for a recipe
 */
export async function getCachedRecipeImage(
  recipeId: string
): Promise<string | null> {
  try {
    const cachedUrl = await cache.get<string>(`recipe:image:${recipeId}`);
    if (cachedUrl) {
      _logger.debug('Found cached recipe image', { recipeId, cachedUrl });
      return cachedUrl;
    }
  } catch (error) {
    _logger.warn('Error fetching cached recipe image', {
      recipeId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
  return null;
}

/**
 * Cache image URL in database/cache
 */
export async function cacheRecipeImage(
  recipeId: string,
  imageUrl: string,
  ttlSeconds: number = 86400 * 30 // 30 days
): Promise<void> {
  _logger.debug('Caching recipe image mapping', { recipeId, imageUrl });
  try {
    await cache.set(`recipe:image:${recipeId}`, imageUrl, {
      ttl: ttlSeconds,
      tags: ['recipes', 'recipe-images'],
    });
  } catch (error) {
    _logger.warn('Failed to cache recipe image', {
      recipeId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Get cached recipe image or generate a new one
 */
export async function getOrGenerateRecipeImage(
  options: ImageGenerationOptions & { recipeId?: string }
): Promise<string> {
  if (options.recipeId) {
    const cached = await getCachedRecipeImage(options.recipeId);
    if (cached) {
      return cached;
    }
  }

  const imageUrl = await generateRecipeImage(options);

  if (options.recipeId && imageUrl) {
    await cacheRecipeImage(options.recipeId, imageUrl);
  }

  return imageUrl;
}
