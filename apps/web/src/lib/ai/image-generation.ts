import { createComponentLogger } from '@whats-for-dinner/utils';
import OpenAI from 'openai';
import { cache } from '@/lib/cache';

const _logger = createComponentLogger('image-generation');

/**
 * Recipe Image Generation & Smart CDN Engine
 * Provides AI-generated culinary photography with circuit breakers,
 * responsive aspect ratios, high-res CDN fallbacks, and blur placeholders.
 */

function getOpenAIClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'sk-mock-key-for-testing',
    dangerouslyAllowBrowser: true,
  });
}

// Circuit breaker for OpenAI API failures to protect latency and cost
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly threshold = 3;
  private readonly resetTimeoutMs = 60000; // 1 minute

  isOpen(): boolean {
    if (this.failureCount >= this.threshold) {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.reset();
        return false;
      }
      return true;
    }
    return false;
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
  }

  recordSuccess(): void {
    this.reset();
  }

  reset(): void {
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}

const openAICircuitBreaker = new CircuitBreaker();

export interface ImageGenerationOptions {
  recipeTitle: string;
  ingredients?: string[];
  cuisine?: string;
  style?: 'photographic' | 'illustrated' | 'minimalist';
  quality?: 'standard' | 'hd';
  aspectRatio?: 'square' | 'landscape' | 'portrait';
  lighting?: 'warm' | 'dramatic' | 'studio' | 'natural';
}

/**
 * Build professional photography prompt optimized for DALL-E 3
 */
export function buildCulinaryPrompt(options: ImageGenerationOptions): string {
  const ingredientsList = Array.isArray(options.ingredients) && options.ingredients.length > 0
    ? options.ingredients.slice(0, 8).join(', ')
    : 'fresh culinary ingredients';

  const styleDesc = options.style === 'illustrated'
    ? 'Artisanal cookbook watercolor illustration with fine pen-and-ink linework'
    : options.style === 'minimalist'
    ? 'Nordic minimalist Michelin-star plating, clean negative space, handcrafted ceramic dish'
    : 'Award-winning commercial food photography, 45-degree angle, macro focus, shallow depth of field, appetizing steam and garnishes';

  const lightingDesc = options.lighting === 'warm'
    ? 'warm golden hour ambient lighting, rustic farmhouse kitchen mood'
    : options.lighting === 'dramatic'
    ? 'dramatic high-contrast chiaroscuro lighting, slate surface'
    : options.lighting === 'studio'
    ? 'crisp studio lighting, vibrant true-to-life colors'
    : 'soft diffused natural window light with gentle shadows';

  return `Gourmet dish presentation: ${options.recipeTitle}. Key visible ingredients: ${ingredientsList}. ${options.cuisine ? `Authentic ${options.cuisine} culinary style. ` : ''}${styleDesc}. ${lightingDesc}. Plated professionally on artisanal tableware, garnished with fresh microgreens, high-end food magazine editorial quality.`;
}

/**
 * Generate recipe image using DALL-E 3 with circuit breaking & fallbacks
 */
export async function generateRecipeImage(
  options: ImageGenerationOptions
): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      _logger.debug('OPENAI_API_KEY not provided, using verified culinary fallback');
      return getUnsplashFallback(options.recipeTitle, options.cuisine);
    }

    if (openAICircuitBreaker.isOpen()) {
      _logger.warn('OpenAI circuit breaker open, bypassing API call to fallback CDN');
      return getUnsplashFallback(options.recipeTitle, options.cuisine);
    }

    const prompt = buildCulinaryPrompt(options);

    // Map aspect ratios to DALL-E 3 supported dimensions
    let size: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024';
    if (options.aspectRatio === 'landscape') {
      size = '1792x1024';
    } else if (options.aspectRatio === 'portrait') {
      size = '1024x1792';
    }

    const openai = getOpenAIClient();
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size,
      quality: options.quality || 'standard',
      style: options.style === 'illustrated' ? 'vivid' : 'natural',
    });

    const generatedUrl = response.data[0]?.url;
    if (generatedUrl) {
      openAICircuitBreaker.recordSuccess();
      return generatedUrl;
    }

    return getUnsplashFallback(options.recipeTitle, options.cuisine);
  } catch (error) {
    openAICircuitBreaker.recordFailure();
    _logger.error('Image generation error, utilizing CDN fallback:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return getUnsplashFallback(options.recipeTitle, options.cuisine);
  }
}

/**
 * Reliable high-resolution culinary photography CDN fallback map
 */
const CULINARY_PHOTO_MAP: Array<{ keywords: string[]; url: string }> = [
  {
    keywords: ['salmon', 'trout', 'fish', 'seafood', 'shrimp', 'halibut', 'cod'],
    url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1024&q=80',
  },
  {
    keywords: ['chicken', 'poulet', 'poultry', 'turkey', 'wings', 'thigh'],
    url: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=1024&q=80',
  },
  {
    keywords: ['pasta', 'spaghetti', 'noodle', 'lasagna', 'fettuccine', 'italian', 'penne', 'ravioli'],
    url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1024&q=80',
  },
  {
    keywords: ['steak', 'beef', 'burger', 'brisket', 'meat', 'pork', 'ribeye', 'sirloin'],
    url: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1024&q=80',
  },
  {
    keywords: ['salad', 'vegetarian', 'vegan', 'greens', 'bowl', 'quinoa', 'mediterranean'],
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1024&q=80',
  },
  {
    keywords: ['curry', 'asian', 'stir-fry', 'thai', 'indian', 'rice', 'wok', 'biryani', 'tikka'],
    url: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=1024&q=80',
  },
  {
    keywords: ['soup', 'stew', 'broth', 'chili', 'chowder', 'bisque', 'ramen'],
    url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1024&q=80',
  },
  {
    keywords: ['dessert', 'cake', 'chocolate', 'cookie', 'sweet', 'pie', 'pastry', 'bake', 'brownie'],
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1024&q=80',
  },
  {
    keywords: ['breakfast', 'egg', 'pancake', 'waffle', 'toast', 'omelet', 'brunch', 'benedict'],
    url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1024&q=80',
  },
  {
    keywords: ['pizza', 'flatbread', 'focaccia', 'calzone'],
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1024&q=80',
  },
  {
    keywords: ['taco', 'mexican', 'burrito', 'enchilada', 'quesadilla', 'salsa', 'fajita'],
    url: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1024&q=80',
  },
  {
    keywords: ['sandwich', 'panini', 'wrap', 'sub', 'melt', 'club', 'blt'],
    url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1024&q=80',
  },
  {
    keywords: ['sushi', 'sashimi', 'japanese', 'maki', 'roll', 'poke'],
    url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1024&q=80',
  },
  {
    keywords: ['bbq', 'barbecue', 'smoked', 'ribs', 'pulled pork'],
    url: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=1024&q=80',
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
 * Generates an SVG-based inline blur placeholder to prevent layout shifts
 */
export function getRecipeImagePlaceholder(cuisine?: string): {
  blurDataURL: string;
  dominantColor: string;
} {
  const c = (cuisine || '').toLowerCase();
  let dominantColor = '#D97706'; // Warm Amber default

  if (c.includes('mexican') || c.includes('spicy')) {
    dominantColor = '#DC2626'; // Flame Red
  } else if (c.includes('italian') || c.includes('mediterranean')) {
    dominantColor = '#B45309'; // Terracotta
  } else if (c.includes('asian') || c.includes('japanese') || c.includes('thai')) {
    dominantColor = '#059669'; // Fresh Herb Green
  } else if (c.includes('french') || c.includes('baking') || c.includes('dessert')) {
    dominantColor = '#9333EA'; // Rich Berry
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${dominantColor}" opacity="0.4"/><filter id="b"><feGaussianBlur stdDeviation="4"/></filter><rect width="32" height="32" fill="${dominantColor}" filter="url(#b)" opacity="0.6"/></svg>`;
  const blurDataURL = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

  return { blurDataURL, dominantColor };
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

/**
 * Batch generate or retrieve recipe images with controlled concurrency
 */
export async function generateRecipeImagesBatch(
  recipes: Array<ImageGenerationOptions & { recipeId?: string }>,
  options: { concurrency?: number } = {}
): Promise<Record<string, string>> {
  const concurrency = Math.max(1, Math.min(options.concurrency || 3, 5));
  const results: Record<string, string> = {};

  for (let i = 0; i < recipes.length; i += concurrency) {
    const chunk = recipes.slice(i, i + concurrency);
    const chunkPromises = chunk.map(async (recipe, idx) => {
      const key = recipe.recipeId || `recipe_${i + idx}`;
      const url = await getOrGenerateRecipeImage(recipe);
      return { key, url };
    });

    const chunkResults = await Promise.all(chunkPromises);
    for (const item of chunkResults) {
      results[item.key] = item.url;
    }
  }

  return results;
}

