// @ts-nocheck
/**
 * Feature Flags Helper
 * 
 * Reads feature flags from config/flags.json with environment awareness.
 * Supports staging-only flags for canary testing.
 */

import fs from 'fs';
import path from 'path';
import { createComponentLogger } from '@whats-for-dinner/utils';

const logger = createComponentLogger('flags-ts');
export interface FeatureFlag {
  enabled: boolean;
  env?: string | string[];
  description?: string;
}

export interface FlagsConfig {
  [key: string]: FeatureFlag;
}

let flagsCache: FlagsConfig | null = null;
let lastModified: number = 0;

/**
 * Get the current environment
 */
function getEnvironment(): string {
  return process.env.NODE_ENV || 'development';
}

/**
 * Load flags from config/flags.json
 */
function loadFlags(): FlagsConfig {
  const flagsPath = path.join(process.cwd(), 'config', 'flags.json');
  
  try {
    const stats = fs.statSync(flagsPath);
    
    // Use cache if file hasn't changed
    if (flagsCache && stats.mtimeMs === lastModified) {
      return flagsCache;
    }
    
    const content = fs.readFileSync(flagsPath, 'utf-8');
    const config = JSON.parse(content);
    
    flagsCache = config.flags || config;
    lastModified = stats.mtimeMs;
    
    return flagsCache;
  } catch (error) {
    logger.warn('Failed to load flags from ${flagsPath}:', { error });
    return {};
  }
}

/**
 * Check if a feature flag is enabled
 * 
 * @param flagName - Name of the feature flag
 * @param defaultValue - Default value if flag not found
 * @returns true if flag is enabled for current environment
 */
export function isFlagEnabled(flagName: string, defaultValue: boolean = false): boolean {
  const flags = loadFlags();
  const flag = flags[flagName];
  
  if (!flag) {
    return defaultValue;
  }
  
  // If flag has env restriction, check it
  if (flag.env) {
    const env = getEnvironment();
    const allowedEnvs = Array.isArray(flag.env) ? flag.env : [flag.env];
    
    if (!allowedEnvs.includes(env)) {
      return false;
    }
  }
  
  return flag.enabled === true;
}

/**
 * Get all flags for current environment
 */
export function getFlags(): Record<string, boolean> {
  const flags = loadFlags();
  const env = getEnvironment();
  const result: Record<string, boolean> = {};
  
  for (const [name, flag] of Object.entries(flags)) {
    if (flag.env) {
      const allowedEnvs = Array.isArray(flag.env) ? flag.env : [flag.env];
      if (!allowedEnvs.includes(env)) {
        result[name] = false;
        continue;
      }
    }
    result[name] = flag.enabled === true;
  }
  
  return result;
}

/**
 * Clear flags cache (useful for testing)
 */
export function clearFlagsCache(): void {
  flagsCache = null;
  lastModified = 0;
}

/**
 * Check if canary flag is enabled
 * Convenience method for canary_example flag
 */
export function isCanaryEnabled(): boolean {
  return isFlagEnabled('canary_example', false);
}
