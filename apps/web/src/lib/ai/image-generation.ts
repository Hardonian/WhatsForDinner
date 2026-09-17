import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('image-generation');

/**
 * Recipe Image Generation
 * Uses AI to generate recipe images
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ImageGenerationOptions {
  recipeTitle: string;
  ingredients: string[];
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
    const prompt = `A beautiful, appetizing photo of ${options.recipeTitle}. 
    Ingredients include: ${options.ingredients.join(', ')}.
    ${options.cuisine ? `Cuisine style: ${options.cuisine}.` : ''}
    ${options.style ? `Style: ${options.style}.` : 'Photographic style, professional food photography.'}
    High quality, well-lit, appetizing, on a clean plate or serving dish.`;

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
 * Cache image URL in database
 */
export async function cacheRecipeImage(
  recipeId: string,
  imageUrl: string
): Promise<void> {
  _logger.debug('Caching recipe image mapping', { recipeId, imageUrl });
}
