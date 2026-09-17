/**
 * Capacitor Initialization
 * Sets up all Capacitor plugins and features on app startup
 */

import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { App } from '@capacitor/app';
import { initDeepLinks } from './deep-links';
import { initPushNotifications } from './push-notifications';
import { backgroundRefresh } from './background-refresh';
import { monetization } from '../monetization';

let initialized = false;

/**
 * Initialize all Capacitor features
 */
export async function initializeCapacitor() {
  if (initialized || typeof window === 'undefined') {
    return;
  }

  if (!Capacitor.isNativePlatform()) {
        initialized = true;
    return;
  }

  try {
    
    // Initialize Status Bar
    await StatusBar.setStyle({ style: Style.Default });
    await StatusBar.setBackgroundColor({ color: '#10B981' });

    // Initialize Keyboard
    await (Keyboard as any).setStyle?.({ style: 'dark' });
    await (Keyboard as any).setResize?.({ resize: 'body' });

    // Hide splash screen after app is ready
    await SplashScreen.hide();

    // Initialize Deep Links
    initDeepLinks((data) => {
      // Navigate to path
      if (typeof window !== 'undefined') {
        window.location.href = data.path;
      }
    });

    // Initialize Push Notifications
    await initPushNotifications(
      (_token) => {},
      (_notification) => {},
      (_action) => {}
    );

    // Initialize Background Refresh
    await backgroundRefresh.initialize();

    // Initialize Monetization
    // Get user ID from auth if available
    const userId = typeof window !== 'undefined' 
      ? localStorage.getItem('user_id') || undefined
      : undefined;
    
    await monetization.initialize(userId);

    // Handle app state changes
    App.addListener('appStateChange', (state) => {
            
      if (state.isActive) {
        // App became active - refresh if needed
        backgroundRefresh.checkAndRefreshIfNeeded();
      }
    });

    // Handle app URL open (deep links)
    App.addListener('appUrlOpen', (event) => {
          });

    // Handle back button (Android)
    App.addListener('backButton', () => {
            // Handle back navigation
      if (window.history.length > 1) {
        window.history.back();
      } else {
        // Exit app if at root
        App.exitApp();
      }
    });

    initialized = true;
      } catch (error) {
    // Error handled: [Capacitor] Initialization error:
  }
}

/**
 * Cleanup Capacitor resources
 */
export function cleanupCapacitor() {
  backgroundRefresh.cleanup();
}
