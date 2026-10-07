/**
 * Background Refresh Tasks
 * Handles background updates for meal suggestions, etc.
 */

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';

const BACKGROUND_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes minimum
const STALE_DATA_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

class BackgroundRefreshManager {
  private refreshInterval: any = null;

  /**
   * Initialize background refresh
   */
  async initialize() {
    if (!Capacitor.isNativePlatform()) {
      return; // Not available on web
    }

    // Register app state listeners
    App.addListener('appStateChange', async (state) => {
      if (state.isActive) {
        // App became active - refresh if data is stale
        await this.checkAndRefreshIfNeeded();
      } else {
        // App went to background - schedule background refresh
        this.scheduleBackgroundRefresh();
      }
    });
  }

  /**
   * Check if data needs refreshing and refresh if stale
   */
  async checkAndRefreshIfNeeded(): Promise<void> {
    const lastRefresh = this.getLastRefreshTime();
    const now = Date.now();

    if (now - lastRefresh > STALE_DATA_THRESHOLD) {
      await this.refreshMealSuggestions();
      this.setLastRefreshTime(now);
    }
  }

  /**
   * Refresh meal suggestions in background
   */
  private async refreshMealSuggestions(): Promise<void> {
    try {
      // Fetch new meal suggestions
      const response = await fetch('/api/dinner', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store in local storage/cache
        if (typeof window !== 'undefined') {
          localStorage.setItem('cached_meal_suggestions', JSON.stringify(data));
          localStorage.setItem('meal_suggestions_timestamp', Date.now().toString());
        }

        // Optionally send local notification
        await this.notifyNewSuggestions();
      }
    } catch (error) {
      // Error handled: [Background Refresh] Error:
    }
  }

  /**
   * Schedule background refresh
   */
  private scheduleBackgroundRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Use platform-appropriate background refresh
    // iOS: Background App Refresh
    // Android: WorkManager
    // This is a placeholder - actual implementation requires native plugins

    this.refreshInterval = setTimeout(() => {
      this.refreshMealSuggestions();
    }, BACKGROUND_REFRESH_INTERVAL);
  }

  /**
   * Send local notification about new suggestions
   */
  private async notifyNewSuggestions(): Promise<void> {
    try {
      const hasPermission = await LocalNotifications.checkPermissions();
      
      if (hasPermission.display === 'granted') {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: "New Meal Ideas Ready!",
              body: "Check out today's personalized meal suggestions",
              id: Date.now(),
              schedule: { at: new Date(Date.now() + 1000) },
              sound: 'beep.wav',
            },
          ],
        });
      }
    } catch (error) {
      // Error handled: [Background Refresh] Notification error:
    }
  }

  /**
   * Get last refresh timestamp
   */
  private getLastRefreshTime(): number {
    if (typeof window === 'undefined') return 0;
    const timestamp = localStorage.getItem('meal_suggestions_timestamp');
    return timestamp ? parseInt(timestamp, 10) : 0;
  }

  /**
   * Set last refresh timestamp
   */
  private setLastRefreshTime(timestamp: number): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('meal_suggestions_timestamp', timestamp.toString());
    }
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}

export const backgroundRefresh = new BackgroundRefreshManager();
