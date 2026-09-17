import { openai } from './openaiClient';
import { RecipeSchema } from './validation';
import { z } from 'zod';
import { analytics } from './analytics';
import { logger } from './logger';
import { aiConfigManager } from './aiConfig';

interface GenerateRecipesOptions {
  ingredients: string[];
  preferences: string;
  maxRetries?: number;
  retryDelay?: number;
}

interface GenerateRecipesResult {
  recipes: z.infer<typeof RecipeSchema>[];
  metadata: {
    model: string;
    timestamp: string;
    retryCount: number;
    apiLatencyMs: number;
    costEstimate: number;
    confidenceScore: number;
  };
}

export async function generateRecipes({
  ingredients,
  preferences,
  maxRetries = 3,
  retryDelay = 1000,
}: GenerateRecipesOptions): Promise<GenerateRecipesResult> {
  const startTime = Date.now();
  let lastError: Error | null = null;

  const apiKey = process.env.OPENAI_API_KEY || '';
  if (!apiKey || apiKey.startsWith('mock-') || apiKey.startsWith('sk-test') || apiKey.includes('placeholder')) {
    throw new Error('OpenAI API key not configured or using test/mock key in development');
  }

  // Get current AI configuration
  const aiConfig = await aiConfigManager.getCurrentConfig();
  const model = aiConfig?.model_name || 'gpt-4o-mini';
  const systemPrompt =
    aiConfig?.system_prompt || 'You are a professional chef and nutritionist.';

  // Generate prompt using AI config templates
  const prompt =
    (await aiConfigManager.generatePrompt('recipe_generation', {
      ingredients: ingredients.join(', '),
      preferences: preferences || 'No specific preferences',
    })) ||
    `Suggest three dinner ideas based on these ingredients: ${ingredients.join(', ')}.
  Take into account these dietary preferences: ${preferences || 'No specific preferences'}.
  
  For each recipe, provide:
  - A creative and appetizing title
  - Estimated cook time (e.g., "30 minutes", "1 hour")
  - Approximate calories per serving
  - List of ingredients needed
  - Step-by-step cooking instructions
  - Nutritional highlights
  - Difficulty level (Easy/Medium/Hard)
  
  Format the response as a JSON array of objects with the following structure:
  [
    {
      "title": "Recipe Name",
      "cookTime": "30 minutes",
      "calories": 450,
      "ingredients": ["ingredient1", "ingredient2"],
      "steps": ["step1", "step2", "step3"],
      "nutritional_highlights": ["high protein", "low carb"],
      "difficulty": "Easy"
    }
  ]`;

  // Track analytics event
  await analytics.trackEvent('recipe_generation_started', {
    ingredients_count: ingredients.length,
    has_preferences: !!preferences,
    model: model,
  });

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const attemptStartTime = Date.now();

      const completion = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: Number(aiConfig?.metadata?.temperature) || 0.7,
        max_tokens: Number(aiConfig?.metadata?.max_tokens) || 2000,
      });

      const attemptDuration = Date.now() - attemptStartTime;
      const content = completion.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      // Parse and validate the response
      const rawRecipes = JSON.parse(content);
      const recipes = z.array(RecipeSchema).parse(rawRecipes);

      const totalDuration = Date.now() - startTime;
      const costEstimate = calculateCostEstimate(completion.usage, model);
      const confidenceScore = calculateConfidenceScore(recipes, ingredients);

      // Track successful generation
      await analytics.trackRecipeGeneration({
        user_id: 'anonymous', // This would come from auth context
        generated_at: new Date().toISOString(),
        ingredients_used: ingredients,
        cuisine_type: detectCuisineType(recipes) || undefined,
        cook_time: String(recipes[0]?.cookTime || 'Unknown'),
        calories: recipes[0]?.calories || 0,
        api_latency_ms: attemptDuration,
        model_used: model,
        retry_count: attempt,
      });

      // Track system metrics
      await analytics.trackSystemMetric('api_performance', attemptDuration, {
        model: model,
        success: true,
        retry_count: attempt,
        tokens_used: completion.usage?.total_tokens || 0,
      });

      // Log successful generation
      await logger.info(
        'Recipe generation successful',
        {
          model: model,
          attempt: attempt + 1,
          duration_ms: attemptDuration,
          total_duration_ms: totalDuration,
          recipes_count: recipes.length,
          confidence_score: confidenceScore,
        },
        'api',
        'openai'
      );

      return {
        recipes,
        metadata: {
          model: model,
          timestamp: new Date().toISOString(),
          retryCount: attempt,
          apiLatencyMs: attemptDuration,
          costEstimate: costEstimate,
          confidenceScore: confidenceScore,
        },
      };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      lastError = error;

      // Log the error
      await logger.error(
        `OpenAI API attempt ${attempt + 1} failed`,
        {
          error: error.message,
          model: model,
          attempt: attempt + 1,
          ingredients: ingredients,
        },
        'api',
        'openai',
        error
      );

      // Track error metrics
      await analytics.trackSystemMetric('error_rate', 1, {
        model: model,
        error_type: error.constructor.name,
        attempt: attempt + 1,
      });

      // Don't retry on auth errors or validation errors
      const errorStatus = (error as { status?: number; code?: string })?.status;
      const errorCode = (error as { status?: number; code?: string })?.code;
      if (errorStatus === 401 || errorCode === 'invalid_api_key') {
        break;
      }

      if (error instanceof z.ZodError) {
        throw new Error(
          `Recipe validation failed: ${error.errors.map(e => e.message).join(', ')}`
        );
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying with exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Track final failure
  await analytics.trackEvent('recipe_generation_failed', {
    model: model,
    total_attempts: maxRetries + 1,
    final_error: lastError?.message,
  });

  // If we get here, all retries failed
  throw new Error(
    `Failed to generate recipes after ${maxRetries + 1} attempts. Last error: ${lastError?.message}`
  );
}

// Helper methods
function calculateCostEstimate(
  usage: { prompt_tokens?: number; completion_tokens?: number } | null | undefined,
  model: string
): number {
  if (!usage) return 0;

  // Simplified cost calculation (prices as of 2024)
  const pricing = {
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
  };

  const modelPricing =
    pricing[model as keyof typeof pricing] || pricing['gpt-4o-mini'];
  const inputCost = ((usage.prompt_tokens || 0) * modelPricing.input) / 1000;
  const outputCost =
    ((usage.completion_tokens || 0) * modelPricing.output) / 1000;

  return inputCost + outputCost;
}

function calculateConfidenceScore(
  recipes: Array<{ ingredients?: string[]; title?: string; cookTime?: string | number; calories?: number; steps?: string[] }>,
  ingredients: string[]
): number {
  let score = 0.5; // Base score

  // Check if recipes use most of the provided ingredients
  const usedIngredients = new Set();
  recipes.forEach(recipe => {
    recipe.ingredients?.forEach((ing: string) => {
      ingredients.forEach(providedIng => {
        if (ing.toLowerCase().includes(providedIng.toLowerCase())) {
          usedIngredients.add(providedIng);
        }
      });
    });
  });

  const ingredientUsageRatio = usedIngredients.size / ingredients.length;
  score += ingredientUsageRatio * 0.3;

  // Check recipe completeness
  const completeRecipes = recipes.filter(
    r =>
      r.title &&
      r.cookTime &&
      r.calories &&
      r.ingredients?.length > 0 &&
      r.steps?.length > 0
  );
  score += (completeRecipes.length / recipes.length) * 0.2;

  return Math.min(1.0, Math.max(0.0, score));
}

function detectCuisineType(recipes: unknown[]): string | null {
  const cuisineKeywords = {
    Italian: ['pasta', 'pizza', 'risotto', 'parmesan', 'basil', 'oregano'],
    Mexican: ['taco', 'burrito', 'salsa', 'cilantro', 'lime', 'jalapeño'],
    Asian: ['soy', 'ginger', 'sesame', 'rice', 'noodle', 'stir-fry'],
    Indian: ['curry', 'cumin', 'turmeric', 'garam masala', 'coconut'],
    Mediterranean: ['olive oil', 'feta', 'tomato', 'oregano', 'lemon'],
  };

  const allText = (recipes as Array<{ title?: string; ingredients?: string[]; steps?: string[] }>)
    .map(r => `${r.title || ''} ${r.ingredients?.join(' ') || ''} ${r.steps?.join(' ') || ''}`)
    .join(' ')
    .toLowerCase();

  for (const [cuisine, keywords] of Object.entries(cuisineKeywords)) {
    if (keywords.some(keyword => allText.includes(keyword))) {
      return cuisine;
    }
  }

  return null;
}

export async function generateRecipesWithFallback(
  options: GenerateRecipesOptions
): Promise<GenerateRecipesResult> {
  try {
    return await generateRecipes(options);
  } catch (error) {
    // Error handled: Primary recipe generation failed, using fallback:

    // Fallback: return a simple recipe based on ingredients
    const fallbackRecipes = [
      {
        title: `Simple ${options.ingredients[0]} Dish`,
        cookTime: '20 minutes',
        calories: 300,
        ingredients: options.ingredients,
        steps: [
          `Prepare ${options.ingredients.join(', ')}`,
          'Heat oil in a pan',
          'Cook ingredients until tender',
          'Season to taste and serve',
        ],
      },
    ];

    return {
      recipes: fallbackRecipes,
      metadata: {
        model: 'fallback',
        timestamp: new Date().toISOString(),
        retryCount: -1,
        apiLatencyMs: 0,
        costEstimate: 0,
        confidenceScore: 0.8,
      },
    };
  }
}
