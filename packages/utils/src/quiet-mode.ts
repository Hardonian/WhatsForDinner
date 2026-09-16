/**
 * Quiet mode configuration
 */

const fs = typeof window === 'undefined' ? require('fs') : null;
const path = typeof window === 'undefined' ? require('path') : null;

const QUIET_MODE_CONFIG = path.join(process.cwd(), 'ops', 'quiet-mode.json');

export interface QuietModeConfig {
  enabled: boolean;
  features: {
    analytics: boolean;
    ai: boolean;
    webhooks: boolean;
    backgroundJobs: boolean;
  };
  message: string;
}

export function getQuietModeConfig(): QuietModeConfig {
  if (fs.existsSync(QUIET_MODE_CONFIG)) {
    return JSON.parse(fs.readFileSync(QUIET_MODE_CONFIG, 'utf-8'));
  }

  return {
    enabled: false,
    features: {
      analytics: true,
      ai: true,
      webhooks: true,
      backgroundJobs: true,
    },
    message: 'System operating in quiet mode',
  };
}

export function setQuietMode(enabled: boolean, message?: string) {
  const config: QuietModeConfig = {
    enabled,
    features: {
      analytics: !enabled,
      ai: !enabled,
      webhooks: !enabled,
      backgroundJobs: !enabled,
    },
    message: message || getQuietModeConfig().message,
  };

  fs.writeFileSync(QUIET_MODE_CONFIG, JSON.stringify(config, null, 2));
}

export function isQuietModeEnabled(): boolean {
  return getQuietModeConfig().enabled;
}
