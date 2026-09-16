/**
 * Nutrition Tracking Service
 * 
 * Tracks nutrition intake and provides analytics
 */

import { createComponentLogger } from '@whats-for-dinner/utils';
import { createClient } from '@/lib/supabase/server';

const _logger = createComponentLogger('nutrition-service');

export interface NutritionLog {
  id?: string;
  userId: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipeId?: string;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  fiberG?: number;
}

export interface NutritionGoals {
  dailyCalories?: number;
  dailyProteinG?: number;
  dailyCarbsG?: number;
  dailyFatG?: number;
  dailyFiberG?: number;
}

export interface NutritionSummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  meals: NutritionLog[];
}

export class NutritionService {
  /**
   * Log nutrition entry
   */
  static async logNutrition(entry: NutritionLog): Promise<NutritionLog> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('nutrition_logs')
        .insert({
          user_id: entry.userId,
          date: entry.date,
          meal_type: entry.mealType,
          recipe_id: entry.recipeId || null,
          calories: entry.calories || null,
          protein_g: entry.proteinG || null,
          carbs_g: entry.carbsG || null,
          fat_g: entry.fatG || null,
          fiber_g: entry.fiberG || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      _logger.info('Nutrition logged', {
        logId: data.id,
        userId: entry.userId,
        date: entry.date,
      });

      return {
        id: data.id,
        userId: data.user_id,
        date: data.date,
        mealType: data.meal_type as NutritionLog['mealType'],
        recipeId: data.recipe_id,
        calories: data.calories,
        proteinG: data.protein_g ? Number(data.protein_g) : undefined,
        carbsG: data.carbs_g ? Number(data.carbs_g) : undefined,
        fatG: data.fat_g ? Number(data.fat_g) : undefined,
        fiberG: data.fiber_g ? Number(data.fiber_g) : undefined,
      };
    } catch (error) {
      _logger.error('Error logging nutrition', {
        error: error instanceof Error ? error.message : String(error),
        userId: entry.userId,
      });
      throw error;
    }
  }

  /**
   * Get nutrition summary for a date range
   */
  static async getNutritionSummary(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<NutritionSummary[]> {
    try {
      const supabase = createClient();
      
      const { data: logs, error } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const summaries = new Map<string, NutritionSummary>();

      for (const log of logs || []) {
        const date = log.date;
        
        if (!summaries.has(date)) {
          summaries.set(date, {
            date,
            totalCalories: 0,
            totalProtein: 0,
            totalCarbs: 0,
            totalFat: 0,
            totalFiber: 0,
            meals: [],
          });
        }

        const summary = summaries.get(date)!;
        summary.totalCalories += log.calories || 0;
        summary.totalProtein += log.protein_g ? Number(log.protein_g) : 0;
        summary.totalCarbs += log.carbs_g ? Number(log.carbs_g) : 0;
        summary.totalFat += log.fat_g ? Number(log.fat_g) : 0;
        summary.totalFiber += log.fiber_g ? Number(log.fiber_g) : 0;
        
        summary.meals.push({
          id: log.id,
          userId: log.user_id,
          date: log.date,
          mealType: log.meal_type as NutritionLog['mealType'],
          recipeId: log.recipe_id,
          calories: log.calories,
          proteinG: log.protein_g ? Number(log.protein_g) : undefined,
          carbsG: log.carbs_g ? Number(log.carbs_g) : undefined,
          fatG: log.fat_g ? Number(log.fat_g) : undefined,
          fiberG: log.fiber_g ? Number(log.fiber_g) : undefined,
        });
      }

      return Array.from(summaries.values());
    } catch (error) {
      _logger.error('Error fetching nutrition summary', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Calculate nutrition from recipe
   */
  static async calculateRecipeNutrition(recipeId: string): Promise<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  }> {
    try {
      const supabase = createClient();
      
      const { data: recipe, error } = await supabase
        .from('recipes')
        .select('macros')
        .eq('id', recipeId)
        .single();

      if (error) throw error;

      const macros = recipe?.macros as Record<string, number> | null;
      
      return {
        calories: macros?.calories || 0,
        protein: macros?.protein || 0,
        carbs: macros?.carbs || 0,
        fat: macros?.fat || 0,
        fiber: macros?.fiber || 0,
      };
    } catch (error) {
      _logger.error('Error calculating recipe nutrition', {
        error: error instanceof Error ? error.message : String(error),
        recipeId,
      });
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
      };
    }
  }
}
