// @ts-nocheck
import { createComponentLogger } from './logger';

/**
 * Feature Flags Service
 * Centralized feature flag management for release engineering
 */

const logger = createComponentLogger('feature-flags-ts');
export interface FeatureFlag {
  description: string;
  environments: Record<string, boolean>;
  rollout: {
    strategy: 'percentage' | 'user-list' | 'date-range';
    percentage: number;
    targetUsers: string[];
    startDate: string | null;
    endDate: string | null;
  };
}

export interface FeatureFlagsConfig {
  flags: Record<string, FeatureFlag>;
  config: {
    provider: string;
    refreshInterval: number;
    fallbackValue: boolean;
    logging: boolean;
  };
}

class FeatureFlagsService {
  private flags: Map<string, FeatureFlag> = new Map();
  private config: FeatureFlagsConfig['config'];
  private refreshTimer?: NodeJS.Timeout;

  constructor(config: FeatureFlagsConfig) {
    this.config = config.config;
    this.loadFlags(config.flags);
    this.startRefreshTimer();
  }

  private loadFlags(flags: Record<string, FeatureFlag>) {
    for (const [name, flag] of Object.entries(flags)) {
      this.flags.set(name, flag);
    }
  }

  private startRefreshTimer() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    this.refreshTimer = setInterval(() => {
      this.refreshFlags();
    }, this.config.refreshInterval);
  }

  private async refreshFlags() {
    try {
      // In a real implementation, this would fetch from a remote service
      const response = await fetch('/api/feature-flags');
      const config = await response.json();
      this.loadFlags(config.flags);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') { logger.warn('Failed to refresh feature flags:', { error }); }
    }
  }

  isEnabled(flagName: string, environment: string, userId?: string): boolean {
    const flag = this.flags.get(flagName);
    if (!flag) {
      return this.config.fallbackValue;
    }

    // Check environment-specific setting
    if (!flag.environments[environment]) {
      return false;
    }

    // Check rollout strategy
    const { strategy, percentage, targetUsers, startDate, endDate } = flag.rollout;

    // Check date range
    if (startDate && new Date() < new Date(startDate)) {
      return false;
    }
    if (endDate && new Date() > new Date(endDate)) {
      return false;
    }

    // Check user list
    if (strategy === 'user-list' && userId && targetUsers.includes(userId)) {
      return true;
    }

    // Check percentage rollout
    if (strategy === 'percentage') {
      if (userId) {
        // Use user ID for consistent percentage calculation
        const hash = this.hashString(userId + flagName);
        return (hash % 100) < percentage;
      }
      return Math.random() * 100 < percentage;
    }

    return true;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  getAllFlags(environment: string): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const [name] of this.flags) {
      result[name] = this.isEnabled(name, environment);
    }
    return result;
  }

  destroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }
}

export default FeatureFlagsService;
