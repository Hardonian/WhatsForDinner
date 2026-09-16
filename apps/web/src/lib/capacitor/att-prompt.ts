import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('att-prompt');

/**
 * App Tracking Transparency (ATT) Prompt for iOS
 * Required if app tracks users across apps/websites
 */

import { Capacitor } from '@capacitor/core';

// Note: ATT requires a native plugin
// For now, this is a placeholder that will work once plugin is added
// You may need to install: @capacitor-community/privacy-screen or similar

/**
 * Request ATT permission (iOS only)
 */
export async function requestATTPermission(): Promise<'authorized' | 'denied' | 'not-determined' | 'restricted'> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
    return 'not-determined'; // Not applicable on Android/web
  }

  try {
    // This would use a Capacitor plugin like:
    // import { ATT } from '@capacitor-community/att';
    // const result = await ATT.requestTrackingPermission();
    // return result.status;
    
    // Placeholder - implement when ATT plugin is added
    _logger.info('ATT permission request not implemented');
    return 'not-determined';
  } catch (error) {
    // Error handled: Failed to request ATT permission:
    return 'denied';
  }
}

/**
 * Check ATT permission status
 */
export async function getATTStatus(): Promise<'authorized' | 'denied' | 'not-determined' | 'restricted'> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
    return 'not-determined';
  }

  try {
    // Placeholder - implement when ATT plugin is added
    return 'not-determined';
  } catch (error) {
    // Error handled: Failed to get ATT status:
    return 'denied';
  }
}

/**
 * Show ATT rationale before requesting permission
 * This should be shown as an in-app modal explaining why tracking is needed
 */
export function shouldShowATTRationale(): boolean {
  // Show rationale once, then request permission
  if (typeof window === 'undefined') return false;
  
  const hasShown = localStorage.getItem('att_rationale_shown');
  return !hasShown;
}

export function markATTRationaleShown(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('att_rationale_shown', 'true');
  }
}
