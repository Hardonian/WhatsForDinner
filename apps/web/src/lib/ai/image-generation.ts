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
 * Fallback to Unsplash
 */
async function getUnsplashFallback(recipeTitle: string, cuisine?: string): Promise<string> {
  const query = encodeURIComponent(`${recipeTitle} ${cuisine || 'food'}`);
  return `https://source.unsplash.com/1024x1024/?${query}`;
}

/**
 * Cache image URL in database
 */
export async function cacheRecipeImage(
  recipeId: string,
  imageUrl: string
): Promise<void> {
  // TODO: Store in Supabase recipes table or image_cache table
  // For now, return
}
