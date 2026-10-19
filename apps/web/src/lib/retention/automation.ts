/**
 * Retention Automation System
 * Push notifications, email sequences, and engagement loops
 */

import { createClient } from '@/lib/supabase/server';

export interface RetentionAction {
  type: 'push' | 'email' | 'in_app';
  trigger: 'daily' | 'weekly' | 'inactive' | 'low_engagement';
  message: string;
  actionUrl?: string;
}

export class RetentionAutomation {
  /**
   * Send daily meal reminder (push notification)
   */
  async sendDailyMealReminder(userId: string): Promise<void> {
    const supabase = await createClient();
    
    // Check if user has push notifications enabled
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('push_notifications_enabled')
      .eq('user_id', userId)
      .single();

    if (!preferences?.push_notifications_enabled) {
      return;
    }

    // Get user's timezone preference
    const { data: profile } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', userId)
      .single();

    const timezone = (profile?.preferences as any)?.timezone || 'America/Toronto';
    const now = new Date();
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const hour = userTime.getHours();

    // Send reminder at 9 AM local time
    if (hour === 9) {
      await this.sendPushNotification(userId, {
        title: "What's for dinner tonight?",
        body: "Tap to see AI-powered meal suggestions based on your pantry",
        data: { action: 'view_meal_suggestions', url: '/meal-planner' },
      });
    }
  }

  /**
   * Send weekly pantry check email
   */
  async sendWeeklyPantryEmail(userId: string): Promise<void> {
    const supabase = await createClient();
    
    // Get pantry items that are running low
    const { data: pantryItems } = await supabase
      .from('pantry_items')
      .select('ingredient, quantity, expiration_date')
      .eq('user_id', userId);

    const lowStockItems = pantryItems?.filter(item => {
      if (item.quantity && item.quantity < 2) return true;
      if (item.expiration_date) {
        const expDate = new Date(item.expiration_date);
        const daysUntilExpiry = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 3;
      }
      return false;
    }) || [];

    if (lowStockItems.length > 0) {
      await this.sendEmail(userId, {
        subject: "Your pantry is running low on these items",
        template: 'weekly_pantry_check',
        data: {
          items: lowStockItems.map(item => item.ingredient),
          actionUrl: '/pantry',
        },
      });
    }
  }

  /**
   * Send inactive user re-engagement
   */
  async sendInactiveUserReEngagement(userId: string, daysInactive: number): Promise<void> {
    if (daysInactive < 7) return; // Only for users inactive 7+ days

    const supabase = await createClient();
    
    // Get user's last activity
    const { data: lastActivity } = await supabase
      .from('analytics_events')
      .select('timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (!lastActivity) return;

    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(lastActivity.timestamp).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceActivity >= 7 && daysSinceActivity < 14) {
      // Week 1: Gentle reminder
      await this.sendEmail(userId, {
        subject: "We miss you! Here's a quick recipe idea",
        template: 'winback_week1',
        data: {
          actionUrl: '/meal-planner',
        },
      });
    } else if (daysSinceActivity >= 14 && daysSinceActivity < 30) {
      // Week 2: Offer incentive
      await this.sendEmail(userId, {
        subject: "Come back and get 1 month free Pro",
        template: 'winback_week2',
        data: {
          actionUrl: '/pricing?promo=comeback',
        },
      });
    } else if (daysSinceActivity >= 30) {
      // Month+: Last chance
      await this.sendEmail(userId, {
        subject: "Last chance: Your account will be archived soon",
        template: 'winback_final',
        data: {
          actionUrl: '/meal-planner',
        },
      });
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(
    userId: string,
    notification: { title: string; body: string; data?: Record<string, unknown> }
  ): Promise<void> {
    const supabase = await createClient();
    
    // Get user's push token
    const { data: pushToken } = await supabase
      .from('push_tokens')
      .select('token, platform')
      .eq('user_id', userId)
      .eq('active', true)
      .single();

    if (!pushToken) return;

    // Send via push service (implement based on your push provider)
    // This is a placeholder - implement with FCM, APNS, or your provider
    await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: pushToken.token,
        platform: pushToken.platform,
        notification,
      }),
    }).catch(() => {}); // Fail silently
  }

  /**
   * Send email
   */
  private async sendEmail(
    userId: string,
    email: { subject: string; template: string; data?: Record<string, unknown> }
  ): Promise<void> {
    const supabase = await createClient();
    
    // Get user email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (!profile?.email) return;

    // Send via email service
    await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: profile.email,
        subject: email.subject,
        template: email.template,
        data: email.data,
      }),
    }).catch(() => {}); // Fail silently
  }

  /**
   * Run daily retention automation
   */
  async runDailyAutomation(): Promise<void> {
    const supabase = await createClient();
    
    // Get all active users
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .eq('status', 'active');

    if (!users) return;

    for (const user of users) {
      // Daily meal reminder
      await this.sendDailyMealReminder(user.id).catch(() => {});
    }
  }

  /**
   * Run weekly retention automation
   */
  async runWeeklyAutomation(): Promise<void> {
    const supabase = await createClient();
    
    // Get all active users
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .eq('status', 'active');

    if (!users) return;

    for (const user of users) {
      // Weekly pantry check
      await this.sendWeeklyPantryEmail(user.id).catch(() => {});
      
      // Check for inactive users
      const { data: lastActivity } = await supabase
        .from('analytics_events')
        .select('timestamp')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (lastActivity) {
        const daysInactive = Math.floor(
          (Date.now() - new Date(lastActivity.timestamp).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysInactive >= 7) {
          await this.sendInactiveUserReEngagement(user.id, daysInactive).catch(() => {});
        }
      }
    }
  }
}

export const retentionAutomation = new RetentionAutomation();
