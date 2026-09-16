/**
 * Referral Tracker Utility
 * 
 * Handles referral code tracking in signup flows
 */

import { createComponentLogger } from '@whats-for-dinner/utils';
import { enhancedReferral } from './referral-enhanced';

const _logger = createComponentLogger('referral-tracker');

export class ReferralTracker {
  /**
   * Get referral code from URL
   */
  static getReferralCodeFromURL(): string | null {
    if (typeof window === 'undefined') return null;
    
    const params = new URLSearchParams(window.location.search);
    return params.get('ref');
  }

  /**
   * Track referral signup
   */
  static async trackReferralSignup(userId: string, referralCode: string): Promise<boolean> {
    try {
      const response = await fetch('/api/referral/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup',
          referralCode,
        }),
      });

      if (!response.ok) {
        _logger.warn('Failed to track referral signup', { userId, referralCode });
        return false;
      }

      return true;
    } catch (error) {
      _logger.error('Error tracking referral signup', {
        userId,
        referralCode,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Track referral conversion (when user becomes paid)
   */
  static async trackReferralConversion(userId: string, planValue: number): Promise<void> {
    try {
      await fetch('/api/referral/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'conversion',
          planValue,
        }),
      });
    } catch (error) {
      _logger.error('Error tracking referral conversion', {
        userId,
        planValue,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Initialize referral tracking on signup
   */
  static async initializeOnSignup(userId: string): Promise<void> {
    const referralCode = this.getReferralCodeFromURL();
    if (referralCode) {
      await this.trackReferralSignup(userId, referralCode);
    }
  }
}

export const referralTracker = ReferralTracker;
