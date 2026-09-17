// @ts-nocheck
import {
  getRecipeFallbackImage,
  generateRecipeImage,
  getCachedRecipeImage,
  cacheRecipeImage,
  getOrGenerateRecipeImage,
  buildCulinaryPrompt,
  getRecipeImagePlaceholder,
  generateRecipeImagesBatch,
} from '../image-generation';
import { cache } from '../../cache';

describe('image-generation service', () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    await cache.clear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getRecipeFallbackImage', () => {
    it('should map salmon and seafood keywords to seafood photo', () => {
      const url = getRecipeFallbackImage('Pan Seared Salmon with Asparagus');
      expect(url).toContain('photo-1519708227418-c8fd9a32b7a2');
    });

    it('should map chicken keywords to chicken photo', () => {
      const url = getRecipeFallbackImage('Lemon Herb Roasted Chicken');
      expect(url).toContain('photo-1532550907401-a500c9a57435');
    });

    it('should map pasta keywords to pasta photo', () => {
      const url = getRecipeFallbackImage('Fettuccine Alfredo', 'Italian');
      expect(url).toContain('photo-1551183053-bf91a1d81141');
    });

    it('should map pizza keywords to pizza photo', () => {
      const url = getRecipeFallbackImage('Wood-fired Margherita Pizza');
      expect(url).toContain('photo-1513104890138-7c749659a591');
    });

    it('should map taco/mexican keywords to taco photo', () => {
      const url = getRecipeFallbackImage('Carne Asada Taco with Fresh Cilantro', 'Mexican');
      expect(url).toContain('photo-1551504734-5ee1c4a1479b');
    });

    it('should map sandwich keywords to sandwich photo', () => {
      const url = getRecipeFallbackImage('Grilled Panini with Prosciutto');
      expect(url).toContain('photo-1528735602780-2552fd46c7af');
    });

    it('should map sushi keywords to sushi photo', () => {
      const url = getRecipeFallbackImage('Spicy Tuna Roll and Sashimi Combo');
      expect(url).toContain('photo-1579871494447-9811cf80d66c');
    });

    it('should map bbq keywords to barbecue photo', () => {
      const url = getRecipeFallbackImage('Smoked Baby Back Ribs');
      expect(url).toContain('photo-1529193591184-b1d58069ecdd');
    });

    it('should return placeholder for unrecognized dishes without keywords', () => {
      const url = getRecipeFallbackImage('Zyzzx 9999 Special');
      expect(url).toBe('/recipe-placeholder.jpg');
    });
  });

  describe('buildCulinaryPrompt', () => {
    it('should construct rich prompt with ingredients, cuisine, and style', () => {
      const prompt = buildCulinaryPrompt({
        recipeTitle: 'Pad Thai',
        ingredients: ['rice noodles', 'shrimp', 'peanuts', 'lime'],
        cuisine: 'Thai',
        style: 'photographic',
        lighting: 'warm',
      });

      expect(prompt).toContain('Pad Thai');
      expect(prompt).toContain('rice noodles, shrimp');
      expect(prompt).toContain('Authentic Thai culinary style');
      expect(prompt).toContain('warm golden hour');
    });

    it('should support illustrated and minimalist styles', () => {
      const illustrated = buildCulinaryPrompt({
        recipeTitle: 'Berry Tart',
        style: 'illustrated',
      });
      expect(illustrated).toContain('watercolor illustration');

      const minimalist = buildCulinaryPrompt({
        recipeTitle: 'Seared Scallop',
        style: 'minimalist',
      });
      expect(minimalist).toContain('Michelin-star');
    });
  });

  describe('getRecipeImagePlaceholder', () => {
    it('should generate svg base64 data url and dominant color', () => {
      const placeholder = getRecipeImagePlaceholder('Mexican');
      expect(placeholder.blurDataURL).toContain('data:image/svg+xml;base64,');
      expect(placeholder.dominantColor).toBe('#DC2626');

      const asianPlaceholder = getRecipeImagePlaceholder('Japanese');
      expect(asianPlaceholder.dominantColor).toBe('#059669');
    });
  });

  describe('generateRecipeImage', () => {
    it('should use fallback image when OPENAI_API_KEY is not provided', async () => {
      delete process.env.OPENAI_API_KEY;

      const url = await generateRecipeImage({
        recipeTitle: 'Beef Wellington',
        ingredients: ['beef', 'mushrooms', 'puff pastry'],
        cuisine: 'British',
      });

      expect(url).toContain('images.unsplash.com');
      expect(url).toContain('photo-1558030006-450675393462');
    });

    it('should safely handle empty or omitted ingredients list', async () => {
      delete process.env.OPENAI_API_KEY;

      const url = await generateRecipeImage({
        recipeTitle: 'Berry Pie',
      });

      expect(url).toContain('photo-1578985545062-69928b1d9587');
    });
  });

  describe('cacheRecipeImage & getCachedRecipeImage', () => {
    it('should cache and retrieve recipe image by ID', async () => {
      const recipeId = 'test-recipe-123';
      const imageUrl = 'https://images.unsplash.com/custom-recipe.jpg';

      expect(await getCachedRecipeImage(recipeId)).toBeNull();

      await cacheRecipeImage(recipeId, imageUrl);

      const retrieved = await getCachedRecipeImage(recipeId);
      expect(retrieved).toBe(imageUrl);
    });
  });

  describe('getOrGenerateRecipeImage', () => {
    it('should return cached image when available without generating', async () => {
      const recipeId = 'cached-recipe-456';
      const existingUrl = 'https://images.unsplash.com/existing.jpg';

      await cacheRecipeImage(recipeId, existingUrl);

      const result = await getOrGenerateRecipeImage({
        recipeId,
        recipeTitle: 'Beef Steak',
      });

      expect(result).toBe(existingUrl);
    });

    it('should generate and cache image when not in cache', async () => {
      delete process.env.OPENAI_API_KEY;
      const recipeId = 'new-recipe-789';

      const result = await getOrGenerateRecipeImage({
        recipeId,
        recipeTitle: 'Spaghetti Bolognese',
        cuisine: 'Italian',
      });

      expect(result).toContain('photo-1551183053-bf91a1d81141');

      const cached = await getCachedRecipeImage(recipeId);
      expect(cached).toBe(result);
    });
  });

  describe('generateRecipeImagesBatch', () => {
    it('should batch process recipe image requests concurrently', async () => {
      delete process.env.OPENAI_API_KEY;

      const batch = [
        { recipeId: 'rec_1', recipeTitle: 'Grilled Salmon' },
        { recipeId: 'rec_2', recipeTitle: 'Chicken Parmigiana' },
        { recipeId: 'rec_3', recipeTitle: 'Pepperoni Pizza' },
      ];

      const results = await generateRecipeImagesBatch(batch, { concurrency: 2 });

      expect(Object.keys(results)).toHaveLength(3);
      expect(results.rec_1).toContain('photo-1519708227418-c8fd9a32b7a2');
      expect(results.rec_2).toContain('photo-1532550907401-a500c9a57435');
      expect(results.rec_3).toContain('photo-1513104890138-7c749659a591');
    });
  });
});
