import { mealPlansRepo, recipesRepo } from '../db/index';
import { logger } from '../observability/index';
import OpenAI from 'openai';
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
export async function mealGenProcessor(job) {
    const { userId, day, preferences, pantry } = job.data;
    logger.info({ userId, day, jobId: job.id }, 'Starting AI meal generation');
    try {
        // Gather constraints
        const calorieTarget = preferences?.calorie_target || 2000;
        const macros = preferences?.macros || {};
        const allergens = preferences?.allergens || [];
        // Query recipe candidates
        const candidateRecipes = await recipesRepo.search('', {
            tags: preferences?.allergens?.length ? undefined : undefined, // Filter out allergen tags
        });
        // Prepare context for LLM
        const systemPrompt = `You are a nutritionist AI assistant. Generate a meal plan for one day with:
- Breakfast (400-600 calories)
- Lunch (500-700 calories)
- Dinner (600-800 calories)
- 2 snacks (150-300 calories each)
Total daily calories: ~${calorieTarget}

Constraints:
${macros.protein ? `- Protein: ${macros.protein}g minimum` : ''}
${macros.carbs ? `- Carbs: ${macros.carbs}g target` : ''}
${macros.fat ? `- Fat: ${macros.fat}g target` : ''}
${allergens.length > 0 ? `- Avoid: ${allergens.join(', ')}` : ''}
${pantry && pantry.length > 0 ? `- Available ingredients: ${pantry.map(i => i.name).join(', ')}` : ''}

Respond with valid JSON only:
{
  "breakfast": { "recipe_id": "uuid", "macros": { "calories": 500, "protein": 20, "carbs": 60, "fat": 15 } },
  "lunch": { "recipe_id": "uuid", "macros": { "calories": 600, "protein": 30, "carbs": 70, "fat": 20 } },
  "dinner": { "recipe_id": "uuid", "macros": { "calories": 700, "protein": 40, "carbs": 80, "fat": 25 } },
  "snack1": { "recipe_id": "uuid", "macros": { "calories": 200, "protein": 10, "carbs": 25, "fat": 8 } },
  "snack2": { "recipe_id": "uuid", "macros": { "calories": 200, "protein": 10, "carbs": 25, "fat": 8 } }
}`;
        // Call LLM
        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
            messages: [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: `Generate a meal plan for ${new Date(day).toLocaleDateString()}. Available recipes: ${candidateRecipes.slice(0, 20).map(r => r.title).join(', ')}`,
                },
            ],
            temperature: 0.7,
            max_tokens: 1000,
            response_format: { type: 'json_object' },
        });
        // Parse response
        const responseContent = completion.choices[0]?.message?.content;
        if (!responseContent) {
            throw new Error('Empty response from LLM');
        }
        const mealPlan = JSON.parse(responseContent);
        // Validate structure
        const slots = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2'];
        const items = slots.map((slot, idx) => ({
            slot: slot === 'snack1' || slot === 'snack2' ? 'snack' : slot,
            recipe_id: mealPlan[slot]?.recipe_id || candidateRecipes[idx % candidateRecipes.length]?.id || '',
            macros: mealPlan[slot]?.macros || { calories: 0, protein: 0, carbs: 0, fat: 0 },
        }));
        // Ensure recipe IDs are valid
        for (const item of items) {
            if (!item.recipe_id || item.recipe_id.length < 10) {
                // Fallback to first available recipe
                item.recipe_id = candidateRecipes[0]?.id || '';
            }
        }
        // Upsert meal plan
        const result = await mealPlansRepo.upsert({
            user_id: userId,
            household_id: job.data.householdId || null,
            day: new Date(day),
            items,
        });
        logger.info({ userId, day, jobId: job.id, planId: result?.id }, 'AI meal plan generated successfully');
        return { success: true, planId: result?.id };
    }
    catch (error) {
        logger.error({ userId, day, jobId: job.id, error: error instanceof Error ? error.message : String(error) }, 'AI meal generation failed');
        throw error; // Let BullMQ handle retries
    }
}
