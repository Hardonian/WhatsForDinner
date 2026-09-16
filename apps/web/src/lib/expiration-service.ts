/**
 * Pantry Expiration Tracking Service
 * 
 * Tracks expiration dates and sends alerts for expiring items
 */

import { createComponentLogger } from '@whats-for-dinner/utils';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

const _logger = createComponentLogger('expiration-service');

export interface PantryItem {
  id: string;
  name: string;
  expirationDate?: string;
  quantity: number;
  userId: string;
}

export interface ExpirationAlert {
  itemId: string;
  itemName: string;
  daysUntilExpiration: number;
  severity: 'warning' | 'urgent' | 'expired';
}

export class ExpirationService {
  /**
   * Get items expiring soon
   */
  static async getExpiringItems(userId: string, daysAhead: number = 7): Promise<ExpirationAlert[]> {
    try {
      const supabase = createClient();
      const today = new Date();
      const futureDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);
      
      const { data: items, error } = await supabase
        .from('pantry_items')
        .select('id, name, expiration_date, quantity')
        .eq('user_id', userId)
        .not('expiration_date', 'is', null)
        .lte('expiration_date', futureDate.toISOString())
        .order('expiration_date', { ascending: true });
      
      if (error) {
        _logger.error('Error fetching expiring items', { error: error.message, userId });
        return [];
      }
      
      return (items || []).map(item => {
        const expirationDate = new Date(item.expiration_date);
        const daysUntil = Math.ceil((expirationDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
        
        let severity: 'warning' | 'urgent' | 'expired' = 'warning';
        if (daysUntil < 0) {
          severity = 'expired';
        } else if (daysUntil <= 2) {
          severity = 'urgent';
        }
        
        return {
          itemId: item.id,
          itemName: item.name,
          daysUntilExpiration: daysUntil,
          severity,
        };
      });
    } catch (error) {
      _logger.error('Error in getExpiringItems', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      return [];
    }
  }
  
  /**
   * Get recipe suggestions for expiring items
   */
  static async getRecipeSuggestionsForExpiring(
    userId: string,
    itemIds: string[]
  ): Promise<Array<{ recipeId: string; title: string; usesItems: string[] }>> {
    try {
      const supabase = createClient();
      
      // Get item names
      const { data: items } = await supabase
        .from('pantry_items')
        .select('id, name')
        .in('id', itemIds);
      
      if (!items || items.length === 0) {
        return [];
      }
      
      const itemNames = items.map(i => i.name.toLowerCase());
      
      // Search for recipes using these ingredients
      const { data: recipes, error } = await supabase
        .from('recipes')
        .select('id, title, ingredients')
        .eq('user_id', userId)
        .limit(10);
      
      if (error) {
        _logger.error('Error fetching recipes for expiring items', { error: error.message });
        return [];
      }
      
      // Filter recipes that use expiring items
      return (recipes || [])
        .filter(recipe => {
          const recipeIngredients = (recipe.ingredients as string[] || []).map(i => i.toLowerCase());
          return itemNames.some(itemName => 
            recipeIngredients.some(ing => ing.includes(itemName))
          );
        })
        .map(recipe => ({
          recipeId: recipe.id,
          title: recipe.title,
          usesItems: items
            .filter(item => 
              (recipe.ingredients as string[] || []).some(ing => 
                ing.toLowerCase().includes(item.name.toLowerCase())
              )
            )
            .map(item => item.name),
        }));
    } catch (error) {
      _logger.error('Error in getRecipeSuggestionsForExpiring', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }
  
  /**
   * Send expiration alerts (to be called by cron job)
   */
  static async sendExpirationAlerts(): Promise<void> {
    try {
      const supabase = createClient();
      
      // Get all users with pantry items
      const { data: users } = await supabase
        .from('pantry_items')
        .select('user_id')
        .not('expiration_date', 'is', null)
        .limit(1000);
      
      if (!users) return;
      
      const uniqueUserIds = [...new Set(users.map(u => u.user_id))];
      
      for (const userId of uniqueUserIds) {
        const alerts = await this.getExpiringItems(userId, 7);
        
        if (alerts.length > 0) {
          // Store alerts for user to see
          await supabase.from('expiration_alerts').insert({
            user_id: userId,
            alerts: alerts,
            created_at: new Date().toISOString(),
          });
          
          // TODO: Send push notification
          _logger.info('Expiration alerts created', { userId, alertCount: alerts.length });
        }
      }
    } catch (error) {
      _logger.error('Error sending expiration alerts', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
