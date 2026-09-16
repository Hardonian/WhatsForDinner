/**
 * Meal Planning Service
 * 
 * Handles weekly meal planning, shopping list generation, and family collaboration
 */

import { createComponentLogger } from '@whats-for-dinner/utils';
import { createClient } from '@/lib/supabase/server';

const _logger = createComponentLogger('meal-planning-service');

export interface MealPlanDay {
  date: string;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  snacks?: string[];
}

export interface WeeklyMealPlan {
  id?: string;
  userId: string;
  householdId?: string;
  weekStartDate: string;
  meals: Record<string, MealPlanDay>;
  shoppingListId?: string;
}

export class MealPlanningService {
  /**
   * Create or update a weekly meal plan
   */
  static async saveMealPlan(plan: WeeklyMealPlan): Promise<WeeklyMealPlan> {
    try {
      const supabase = createClient();
      
      const planData = {
        user_id: plan.userId,
        household_id: plan.householdId || null,
        week_start_date: plan.weekStartDate,
        meals: plan.meals,
        shopping_list_id: plan.shoppingListId || null,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (plan.id) {
        // Update existing plan
        const { data, error } = await supabase
          .from('meal_plans_enhanced')
          .update(planData)
          .eq('id', plan.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Create new plan
        const { data, error } = await supabase
          .from('meal_plans_enhanced')
          .insert({
            ...planData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      _logger.info('Meal plan saved', {
        planId: result.id,
        userId: plan.userId,
      });

      return {
        id: result.id,
        userId: result.user_id,
        householdId: result.household_id,
        weekStartDate: result.week_start_date,
        meals: result.meals as Record<string, MealPlanDay>,
        shoppingListId: result.shopping_list_id,
      };
    } catch (error) {
      _logger.error('Error saving meal plan', {
        error: error instanceof Error ? error.message : String(error),
        userId: plan.userId,
      });
      throw error;
    }
  }

  /**
   * Get meal plan for a specific week
   */
  static async getMealPlan(
    userId: string,
    weekStartDate: string,
    householdId?: string
  ): Promise<WeeklyMealPlan | null> {
    try {
      const supabase = createClient();
      
      let query = supabase
        .from('meal_plans_enhanced')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start_date', weekStartDate);

      if (householdId) {
        query = query.eq('household_id', householdId);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No plan found
          return null;
        }
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        householdId: data.household_id,
        weekStartDate: data.week_start_date,
        meals: data.meals as Record<string, MealPlanDay>,
        shoppingListId: data.shopping_list_id,
      };
    } catch (error) {
      _logger.error('Error fetching meal plan', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Generate shopping list from meal plan
   */
  static async generateShoppingList(
    mealPlanId: string,
    userId: string
  ): Promise<string> {
    try {
      const supabase = createClient();
      
      const plan = await this.getMealPlan(userId, new Date().toISOString().split('T')[0]);
      if (!plan) {
        throw new Error('Meal plan not found');
      }

      // Extract all ingredients from meals
      const ingredients = new Set<string>();
      
      for (const day of Object.values(plan.meals)) {
        // Get recipe ingredients for each meal
        const mealTypes = ['breakfast', 'lunch', 'dinner'] as const;
        for (const mealType of mealTypes) {
          const recipeId = day[mealType];
          if (recipeId) {
            const { data: recipe } = await supabase
              .from('recipes')
              .select('ingredients')
              .eq('id', recipeId)
              .single();
            
            if (recipe?.ingredients) {
              (recipe.ingredients as string[]).forEach(ing => ingredients.add(ing));
            }
          }
        }
      }

      // Create shopping list
      const { data: shoppingList, error } = await supabase
        .from('grocery_lists')
        .insert({
          household_id: plan.householdId || null,
          name: `Meal Plan - Week of ${plan.weekStartDate}`,
          items: Array.from(ingredients).map(name => ({ name, checked: false })),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update meal plan with shopping list ID
      await supabase
        .from('meal_plans_enhanced')
        .update({ shopping_list_id: shoppingList.id })
        .eq('id', mealPlanId);

      _logger.info('Shopping list generated', {
        shoppingListId: shoppingList.id,
        mealPlanId,
        itemCount: ingredients.size,
      });

      return shoppingList.id;
    } catch (error) {
      _logger.error('Error generating shopping list', {
        error: error instanceof Error ? error.message : String(error),
        mealPlanId,
      });
      throw error;
    }
  }
}
