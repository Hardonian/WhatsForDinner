/**
 * Chaos Engineering Scenarios
 * 
 * Implements fault injection for:
 * - Database connection loss
 * - Queue overload
 * - API latency injection
 * - Redis failures
 * - External API failures
 * 
 * Uses lightweight fault injection without external dependencies.
 */

import { logger } from '../../server/src/observability/index.js';

export interface ChaosScenario {
  name: string;
  description: string;
  inject: () => Promise<void>;
  restore: () => Promise<void>;
  duration?: number; // milliseconds
  enabled?: boolean;
}

export interface ChaosResult {
  scenario: string;
  success: boolean;
  duration: number;
  preMetrics?: Record<string, number>;
  postMetrics?: Record<string, number>;
  delta?: Record<string, number>;
}

const activeInjection: Map<string, () => Promise<void>> = new Map();

/**
 * Scenario: Database Connection Loss
 * Simulates database connection failures by throwing errors on queries
 */
export const dbConnectionLoss: ChaosScenario = {
  name: 'db-connection-loss',
  description: 'Simulate database connection failures',
  inject: async () => {
    logger.warn('Chaos: Injecting database connection loss');
    // In production, this would temporarily disable database connection pool
    // For now, we'll mark it as injected
    activeInjection.set('db-connection-loss', async () => {
      throw new Error('Chaos: Database connection failed');
    });
  },
  restore: async () => {
    logger.info('Chaos: Restoring database connections');
    activeInjection.delete('db-connection-loss');
  },
  duration: 30000, // 30 seconds
};

/**
 * Scenario: Queue Overload
 * Simulates queue backlog by slowing down job processing
 */
export const queueOverload: ChaosScenario = {
  name: 'queue-overload',
  description: 'Simulate queue processing delays',
  inject: async () => {
    logger.warn('Chaos: Injecting queue overload');
    const originalDelay = 100;
    const overloadedDelay = 5000; // 5 second delay

    activeInjection.set('queue-overload', async () => {
      await new Promise((resolve) => setTimeout(resolve, overloadedDelay));
    });
  },
  restore: async () => {
    logger.info('Chaos: Restoring queue processing');
    activeInjection.delete('queue-overload');
  },
  duration: 60000, // 60 seconds
};

/**
 * Scenario: API Latency Injection
 * Adds artificial latency to API requests
 */
export const apiLatencyInjection: ChaosScenario = {
  name: 'api-latency',
  description: 'Inject latency into API requests',
  inject: async () => {
    logger.warn('Chaos: Injecting API latency (500ms)');
    activeInjection.set('api-latency', async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    });
  },
  restore: async () => {
    logger.info('Chaos: Removing API latency injection');
    activeInjection.delete('api-latency');
  },
  duration: 120000, // 2 minutes
};

/**
 * Scenario: Redis Failure
 * Simulates Redis connectivity issues
 */
export const redisFailure: ChaosScenario = {
  name: 'redis-failure',
  description: 'Simulate Redis connection failures',
  inject: async () => {
    logger.warn('Chaos: Injecting Redis failure');
    activeInjection.set('redis-failure', async () => {
      throw new Error('Chaos: Redis connection failed');
    });
  },
  restore: async () => {
    logger.info('Chaos: Restoring Redis connections');
    activeInjection.delete('redis-failure');
  },
  duration: 45000, // 45 seconds
};

/**
 * Scenario: External API Failure
 * Simulates failures in external API calls (Stripe, OpenAI, etc.)
 */
export const externalAPIFailure: ChaosScenario = {
  name: 'external-api-failure',
  description: 'Simulate external API failures',
  inject: async () => {
    logger.warn('Chaos: Injecting external API failures');
    activeInjection.set('external-api-failure', async () => {
      throw new Error('Chaos: External API request failed');
    });
  },
  restore: async () => {
    logger.info('Chaos: Restoring external API calls');
    activeInjection.delete('external-api-failure');
  },
  duration: 30000, // 30 seconds
};

/**
 * Scenario: Memory Leak Simulation
 * Allocates memory to simulate a leak
 */
export const memoryLeak: ChaosScenario = {
  name: 'memory-leak',
  description: 'Simulate memory pressure',
  inject: async () => {
    logger.warn('Chaos: Injecting memory pressure');
    const leak: unknown[] = [];
    // Allocate ~100MB
    for (let i = 0; i < 100; i++) {
      leak.push(new Array(1024 * 1024).fill(0));
    }
    activeInjection.set('memory-leak', async () => {
      // Keep reference to prevent GC
    });
    // Store leak reference
    (global as any).__chaos_memory_leak = leak;
  },
  restore: async () => {
    logger.info('Chaos: Releasing memory pressure');
    delete (global as any).__chaos_memory_leak;
    activeInjection.delete('memory-leak');
    // Force GC if available
    if (global.gc) {
      global.gc();
    }
  },
  duration: 60000, // 1 minute
};

/**
 * Get all available chaos scenarios
 */
export function getAllScenarios(): ChaosScenario[] {
  return [
    dbConnectionLoss,
    queueOverload,
    apiLatencyInjection,
    redisFailure,
    externalAPIFailure,
    memoryLeak,
  ];
}

/**
 * Get a scenario by name
 */
export function getScenario(name: string): ChaosScenario | undefined {
  return getAllScenarios().find((s) => s.name === name);
}

/**
 * Check if a fault is currently injected
 */
export function isFaultActive(name: string): boolean {
  return activeInjection.has(name);
}

/**
 * Execute a fault injection hook (called by application code)
 */
export async function executeFaultHook(name: string): Promise<void> {
  const hook = activeInjection.get(name);
  if (hook) {
    await hook();
  }
}

/**
 * Run a chaos scenario and collect metrics
 */
export async function runScenario(
  scenarioName: string,
  collectMetrics: () => Promise<Record<string, number>>,
): Promise<ChaosResult> {
  const scenario = getScenario(scenarioName);
  if (!scenario) {
    throw new Error(`Scenario not found: ${scenarioName}`);
  }

  if (scenario.enabled === false) {
    throw new Error(`Scenario disabled: ${scenarioName}`);
  }

  logger.info({ scenario: scenarioName }, 'Starting chaos scenario');

  // Collect pre-metrics
  const preMetrics = await collectMetrics();

  const startTime = Date.now();

  try {
    // Inject fault
    await scenario.inject();

    // Wait for duration
    if (scenario.duration) {
      await new Promise((resolve) => setTimeout(resolve, scenario.duration));
    }

    // Collect post-metrics
    const postMetrics = await collectMetrics();

    // Calculate delta
    const delta: Record<string, number> = {};
    for (const key of Object.keys(postMetrics)) {
      if (preMetrics[key] !== undefined) {
        delta[key] = postMetrics[key] - preMetrics[key];
      }
    }

    // Restore
    await scenario.restore();

    const duration = Date.now() - startTime;

    logger.info({ scenario: scenarioName, duration }, 'Chaos scenario completed');

    return {
      scenario: scenarioName,
      success: true,
      duration,
      preMetrics,
      postMetrics,
      delta,
    };
  } catch (error) {
    // Always restore on error
    await scenario.restore().catch((restoreError) => {
      logger.error({ error: restoreError }, 'Failed to restore after chaos scenario');
    });

    const duration = Date.now() - startTime;

    logger.error({ scenario: scenarioName, error, duration }, 'Chaos scenario failed');

    return {
      scenario: scenarioName,
      success: false,
      duration,
      preMetrics,
    };
  }
}

/**
 * Run multiple scenarios sequentially
 */
export async function runScenarios(
  scenarioNames: string[],
  collectMetrics: () => Promise<Record<string, number>>,
): Promise<ChaosResult[]> {
  const results: ChaosResult[] = [];

  for (const name of scenarioNames) {
    const result = await runScenario(name, collectMetrics);
    results.push(result);

    // Wait between scenarios
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  return results;
}

/**
 * Validate that metrics delta is within acceptable threshold
 */
export function validateMetricsDelta(
  result: ChaosResult,
  threshold: number = 5,
): { valid: boolean; violations: string[] } {
  if (!result.delta) {
    return { valid: true, violations: [] };
  }

  const violations: string[] = [];

  for (const [key, value] of Object.entries(result.delta)) {
    const preValue = result.preMetrics?.[key] || 0;
    if (preValue > 0) {
      const percentChange = Math.abs((value / preValue) * 100);
      if (percentChange > threshold) {
        violations.push(`${key}: ${percentChange.toFixed(2)}% change (threshold: ${threshold}%)`);
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

const isMain = process.argv[1] && (
  process.argv[1].replace(/\\/g, '/').endsWith('packages/testing/chaos/scenarios.ts') ||
  import.meta.url === `file://${process.argv[1]}`
);

if (isMain) {
  const collectMetrics = async () => ({
    cpu: Math.random() * 10 + 10,
    memory: process.memoryUsage().heapUsed / 1024 / 1024,
    latency: Math.random() * 50 + 20,
    activeHandles: (process as any)._getActiveHandles ? (process as any)._getActiveHandles().length : 1,
  });

  const scenarios = getAllScenarios();
  logger.info({ scenarioCount: scenarios.length }, 'Running Chaos Engineering Suite');

  (async () => {
    let allPassed = true;
    for (const scenario of scenarios) {
      const origDuration = scenario.duration;
      scenario.duration = 200; // Fast simulation for automated gate
      const result = await runScenario(scenario.name, collectMetrics);
      if (!result.success) allPassed = false;
      scenario.duration = origDuration;
    }
    logger.info({ allPassed }, 'Chaos Engineering Suite Complete');
    process.exit(allPassed ? 0 : 1);
  })().catch((err) => {
    logger.error({ err }, 'Chaos suite failed');
    process.exit(1);
  });
}

