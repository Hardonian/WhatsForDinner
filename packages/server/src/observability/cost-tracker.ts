// @ts-nocheck
/**
 * Cost caps and throttling
 */

import * as fs from 'fs';
import * as path from 'path';

const COST_CONFIG = path.join(process.cwd(), 'ops', 'cost-config.json');

export interface CostConfig {
  dailyLimit: number;
  monthlyLimit: number;
  throttling: {
    enabled: boolean;
    maxRequestsPerMinute: number;
  };
}

export function getCostConfig(): CostConfig {
  if (fs.existsSync(COST_CONFIG)) {
    return JSON.parse(fs.readFileSync(COST_CONFIG, 'utf-8'));
  }

  return {
    dailyLimit: 50,
    monthlyLimit: 1000,
    throttling: {
      enabled: true,
      maxRequestsPerMinute: 100,
    },
  };
}

export class CostTracker {
  private requests: number[] = [];
  private dailyCost = 0;
  private monthlyCost = 0;

  checkQuota(): boolean {
    const config = getCostConfig();
    return this.dailyCost < config.dailyLimit && this.monthlyCost < config.monthlyLimit;
  }

  recordRequest(cost: number = 0.001) {
    this.requests.push(Date.now());
    this.dailyCost += cost;
    this.monthlyCost += cost;
    this.requests = this.requests.filter((time) => time > Date.now() - 60000);
  }

  shouldThrottle(): boolean {
    const config = getCostConfig();
    if (!config.throttling.enabled) return false;
    const recentRequests = this.requests.filter((time) => time > Date.now() - 60000).length;
    return recentRequests >= config.throttling.maxRequestsPerMinute;
  }

  getCostBreakdown() {
    return {
      daily: this.dailyCost,
      monthly: this.monthlyCost,
      requests: this.requests.length,
      throttled: this.shouldThrottle(),
    };
  }
}

export const costTracker = new CostTracker();
