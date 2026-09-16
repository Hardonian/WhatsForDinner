import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('aiconfig');

import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export interface AIConfig {
  id: string;
  model_name: string;
  system_prompt: string;
  message_templates: Record<string, string>;
  version: string;
  is_active: boolean;
  created_at: string;
  performance_score?: number;
  metadata: Record<string, unknown>;
}

export interface PromptTemplate {
  name: string;
  template: string;
  variables: string[];
  description: string;
}

export interface ModelEvaluation {
  model_name: string;
  accuracy_score: number;
  response_time_ms: number;
  cost_per_request: number;
  user_satisfaction: number;
  test_results: Record<string, unknown>;
  evaluated_at: string;
}

class AIConfigManager {
  private currentConfig: AIConfig | null = null;
  private promptTemplates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.initializePromptTemplates();
  }

  private initializePromptTemplates() {
    // Recipe generation templates
    this.promptTemplates.set('recipe_generation', {
      name: 'recipe_generation',
      template: `You are a professional chef and nutritionist. Generate creative, delicious, and healthy dinner recipes based on the provided ingredients and dietary preferences.

Available ingredients: {ingredients}
Dietary preferences: {preferences}

For each recipe, provide:
- A creative and appetizing title
- Estimated cook time (e.g., "30 minutes", "1 hour")
- Approximate calories per serving
- List of ingredients needed (including quantities)
- Step-by-step cooking instructions
- Nutritional highlights
- Difficulty level (Easy/Medium/Hard)

Format the response as a JSON array of objects with this structure:
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
]`,
      variables: ['ingredients', 'preferences'],
      description: 'Main template for generating dinner recipes',
    });

    // Recipe improvement template
    this.promptTemplates.set('recipe_improvement', {
      name: 'recipe_improvement',
      template: `Based on user feedback, improve the following recipe:

Original Recipe: {original_recipe}
User Feedback: {feedback}
Feedback Type: {feedback_type}

Please provide an improved version that addresses the feedback while maintaining the core concept. Focus on:
- Better flavor combinations
- Clearer instructions
- More accurate timing
- Nutritional improvements
- Accessibility considerations

Return the improved recipe in the same JSON format as the original.`,
      variables: ['original_recipe', 'feedback', 'feedback_type'],
      description: 'Template for improving recipes based on user feedback',
    });

    // Cuisine-specific templates
    this.promptTemplates.set('cuisine_specific', {
      name: 'cuisine_specific',
      template: `Generate authentic {cuisine} recipes using these ingredients: {ingredients}

Dietary preferences: {preferences}

Focus on:
- Authentic {cuisine} cooking techniques
- Traditional flavor profiles
- Cultural context and history
- Appropriate ingredient substitutions if needed

Provide 2-3 recipes that showcase different aspects of {cuisine} cuisine.`,
      variables: ['cuisine', 'ingredients', 'preferences'],
      description: 'Template for cuisine-specific recipe generation',
    });

    // Health-focused template
    this.promptTemplates.set('health_focused', {
      name: 'health_focused',
      template: `Create healthy, nutritious recipes using these ingredients: {ingredients}

Health goals: {health_goals}
Dietary restrictions: {dietary_restrictions}

Focus on:
- Nutritional density
- Balanced macronutrients
- Fresh, whole ingredients
- Cooking methods that preserve nutrients
- Portion control guidance
- Meal prep considerations

Include detailed nutritional information and health benefits.`,
      variables: ['ingredients', 'health_goals', 'dietary_restrictions'],
      description: 'Template for health-focused recipe generation',
    });
  }

  async getCurrentConfig(): Promise<AIConfig | null> {
    if (this.currentConfig) {
      return this.currentConfig;
    }

    try {
      const { data, error } = await supabase
        .from('ai_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        // Error handled: Failed to fetch current AI config:
        return null;
      }

      this.currentConfig = data;
      return data;
    } catch (error) {
      // Error handled: Error fetching AI config:
      return null;
    }
  }

  async createConfig(
    config: Omit<AIConfig, 'id' | 'created_at'>
  ): Promise<AIConfig | null> {
    try {
      // Deactivate current config
      await supabase
        .from('ai_config')
        .update({ is_active: false })
        .eq('is_active', true);

      // Create new config
      const newConfig: AIConfig = {
        id: uuidv4(),
        ...config,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('ai_config')
        .insert(newConfig)
        .select()
        .single();

      if (error) {
        // Error handled: Failed to create AI config:
        return null;
      }

      this.currentConfig = data;
      return data;
    } catch (error) {
      // Error handled: Error creating AI config:
      return null;
    }
  }

  async updateConfig(
    configId: string,
    updates: Partial<AIConfig>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_config')
        .update(updates)
        .eq('id', configId);

      if (error) {
        // Error handled: Failed to update AI config:
        return false;
      }

      // Refresh current config if it was updated
      if (this.currentConfig?.id === configId) {
        this.currentConfig = null;
        await this.getCurrentConfig();
      }

      return true;
    } catch (error) {
      // Error handled: Error updating AI config:
      return false;
    }
  }

  async evaluateModel(
    modelName: string,
    testPrompts: Array<{ prompt: string; expectedOutput: unknown }>
  ): Promise<ModelEvaluation | null> {
    try {
      const startTime = Date.now();
      let totalAccuracy = 0;
      let totalCost = 0;
      const testResults: Record<string, unknown> = {};

      // Run test prompts (simplified evaluation)
      for (let i = 0; i < testPrompts.length; i++) {
        const test = testPrompts[i];
        // This would normally call the actual model
        // For now, we'll simulate the evaluation
        const accuracy = Math.random() * 0.4 + 0.6; // Simulate 60-100% accuracy
        totalAccuracy += accuracy;
        testResults[`test_${i}`] = {
          prompt: test.prompt,
          accuracy,
          passed: accuracy > 0.7,
        };
      }

      const responseTime = Date.now() - startTime;
      const averageAccuracy = totalAccuracy / testPrompts.length;

      const evaluation: ModelEvaluation = {
        model_name: modelName,
        accuracy_score: averageAccuracy,
        response_time_ms: responseTime,
        cost_per_request: totalCost,
        user_satisfaction: averageAccuracy * 0.8 + Math.random() * 0.2, // Simulate user satisfaction
        test_results: testResults,
        evaluated_at: new Date().toISOString(),
      };

      return evaluation;
    } catch (error) {
      // Error handled: Error evaluating model:
      return null;
    }
  }

  async compareModels(models: string[]): Promise<ModelEvaluation[]> {
    const evaluations: ModelEvaluation[] = [];

    for (const model of models) {
      const testPrompts = this.getTestPrompts();
      const evaluation = await this.evaluateModel(model, testPrompts);
      if (evaluation) {
        evaluations.push(evaluation);
      }
    }

    return evaluations.sort((a, b) => b.accuracy_score - a.accuracy_score);
  }

  private getTestPrompts(): Array<{ prompt: string; expectedOutput: unknown }> {
    return [
      {
        prompt: 'Generate a recipe using chicken, rice, and vegetables',
        expectedOutput: {
          type: 'array',
          minLength: 1,
          requiredFields: [
            'title',
            'cookTime',
            'calories',
            'ingredients',
            'steps',
          ],
        },
      },
      {
        prompt: 'Create a vegetarian pasta dish',
        expectedOutput: {
          type: 'array',
          minLength: 1,
          requiredFields: [
            'title',
            'cookTime',
            'calories',
            'ingredients',
            'steps',
          ],
        },
      },
      {
        prompt: 'Make a quick 15-minute meal',
        expectedOutput: {
          type: 'array',
          minLength: 1,
          requiredFields: [
            'title',
            'cookTime',
            'calories',
            'ingredients',
            'steps',
          ],
        },
      },
    ];
  }

  getPromptTemplate(name: string): PromptTemplate | undefined {
    return this.promptTemplates.get(name);
  }

  getAllPromptTemplates(): PromptTemplate[] {
    return Array.from(this.promptTemplates.values());
  }

  async generatePrompt(
    templateName: string,
    variables: Record<string, string>
  ): Promise<string | null> {
    const template = this.getPromptTemplate(templateName);
    if (!template) {
      _logger.error('Template ${templateName} not found');
      return null;
    }

    let prompt = template.template;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), value);
    }

    return prompt;
  }

  async getConfigHistory(): Promise<AIConfig[]> {
    try {
      const { data, error } = await supabase
        .from('ai_config')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Error handled: Failed to fetch config history:
        return [];
      }

      return data || [];
    } catch (error) {
      // Error handled: Error fetching config history:
      return [];
    }
  }

  async getPerformanceMetrics(): Promise<Record<string, unknown>> {
    try {
      const { data, error } = await supabase
        .from('ai_config')
        .select('model_name, performance_score, created_at')
        .not('performance_score', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        // Error handled: Failed to fetch performance metrics:
        return {};
      }

      return {
        models: data || [],
        averageScore:
          data?.reduce(
            (sum, config) => sum + (config.performance_score || 0),
            0
          ) / (data?.length || 1),
        totalConfigs: data?.length || 0,
      };
    } catch (error) {
      // Error handled: Error fetching performance metrics:
      return {};
    }
  }
}

export const aiConfigManager = new AIConfigManager();

// Initialize default config if none exists
export async function initializeDefaultConfig() {
  const currentConfig = await aiConfigManager.getCurrentConfig();
  if (!currentConfig) {
    const defaultConfig = await aiConfigManager.createConfig({
      model_name: 'gpt-4o-mini',
      system_prompt:
        'You are a professional chef and nutritionist specializing in creating delicious, healthy, and practical dinner recipes.',
      message_templates: {
        recipe_generation:
          'Generate creative dinner recipes based on available ingredients and dietary preferences.',
        recipe_improvement:
          'Improve recipes based on user feedback while maintaining authenticity.',
        cuisine_specific:
          'Create authentic recipes for specific cuisines using available ingredients.',
      },
      version: '1.0.0',
      is_active: true,
      performance_score: 0.85,
      metadata: {
        temperature: 0.7,
        max_tokens: 2000,
        retry_attempts: 3,
        fallback_enabled: true,
      },
    });

    if (defaultConfig) {
          }
  }
}
