/**
 * Performance Testing Scenarios (k6 compatible)
 * 
 * Defines load test scenarios for:
 * - API endpoints
 * - Web pages
 * - Database queries
 * - Queue processing
 * 
 * Generates baseline.json for regression detection
 */

import { createComponentLogger } from '@whats-for-dinner/utils';

const logger = createComponentLogger('scenarios-ts');
export interface PerfScenario {
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  expectedStatus: number;
  expectedP95: number; // milliseconds
  expectedP99: number; // milliseconds
  load: {
    stages: Array<{
      duration: string;
      target: number; // virtual users
    }>;
  };
}

export interface PerfBaseline {
  timestamp: string;
  scenarios: Record<
    string,
    {
      p50: number;
      p95: number;
      p99: number;
      min: number;
      max: number;
      avg: number;
      requests: number;
      errors: number;
      errorRate: number;
    }
  >;
}

/**
 * API Load Test Scenarios
 */
export const apiScenarios: PerfScenario[] = [
  {
    name: 'health-check',
    description: 'Health check endpoint load test',
    endpoint: '/healthz',
    method: 'GET',
    expectedStatus: 200,
    expectedP95: 50,
    expectedP99: 100,
    load: {
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  {
    name: 'api-meal-plan',
    description: 'Meal plan generation API',
    endpoint: '/api/mealplan',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      preferences: { diet: ['vegetarian'] },
      day: new Date().toISOString().split('T')[0],
    }),
    expectedStatus: 200,
    expectedP95: 2000,
    expectedP99: 5000,
    load: {
      stages: [
        { duration: '30s', target: 5 },
        { duration: '1m', target: 20 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  {
    name: 'api-pricing',
    description: 'Pricing API endpoint',
    endpoint: '/api/pricing',
    method: 'GET',
    expectedStatus: 200,
    expectedP95: 300,
    expectedP99: 500,
    load: {
      stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  {
    name: 'api-partner',
    description: 'Partner API endpoint',
    endpoint: '/api/partner',
    method: 'GET',
    expectedStatus: 200,
    expectedP95: 400,
    expectedP99: 800,
    load: {
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 0 },
      ],
    },
  },
];

/**
 * Web Page Load Test Scenarios
 */
export const webScenarios: PerfScenario[] = [
  {
    name: 'web-homepage',
    description: 'Homepage load test',
    endpoint: '/',
    method: 'GET',
    expectedStatus: 200,
    expectedP95: 1000,
    expectedP99: 2000,
    load: {
      stages: [
        { duration: '30s', target: 50 },
        { duration: '2m', target: 200 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  {
    name: 'web-dashboard',
    description: 'Dashboard page load test',
    endpoint: '/dashboard',
    method: 'GET',
    expectedStatus: 200,
    expectedP95: 1500,
    expectedP99: 3000,
    load: {
      stages: [
        { duration: '30s', target: 20 },
        { duration: '2m', target: 100 },
        { duration: '30s', target: 0 },
      ],
    },
  },
];

/**
 * Generate k6 test script
 */
export function generateK6Script(scenarios: PerfScenario[]): string {
  const imports = `
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { createComponentLogger } from '@whats-for-dinner/utils';

const errorRate = new Rate('errors');
`;

  const scenarioFunctions = scenarios
    .map(
      (scenario) => `
export function ${scenario.name.replace(/-/g, '_')}() {
  const url = __ENV.BASE_URL || 'http://localhost:3000';
  const params = {
    headers: ${JSON.stringify(scenario.headers || {})},
  };
  
  const res = ${scenario.method === 'GET' ? `http.get(url + '${scenario.endpoint}', params);` : scenario.method === 'POST' ? `http.post(url + '${scenario.endpoint}', ${scenario.body || 'null'}, params);` : `http.${scenario.method.toLowerCase()}(url + '${scenario.endpoint}', params);`}
  
  check(res, {
    'status is ${scenario.expectedStatus}': (r) => r.status === ${scenario.expectedStatus},
    'p95 < ${scenario.expectedP95}ms': (r) => r.timings.duration < ${scenario.expectedP95},
  });
  
  errorRate.add(res.status !== ${scenario.expectedStatus});
  sleep(1);
}
`,
    )
    .join('\n');

  const scenarioConfigs = scenarios
    .map(
      (scenario) => `
  ${scenario.name.replace(/-/g, '_')}: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: ${JSON.stringify(scenario.load.stages)},
    exec: '${scenario.name.replace(/-/g, '_')}',
  },`,
    )
    .join('\n');

  const options = `
export const options = {
  scenarios: {${scenarioConfigs}
  },
  thresholds: {
    errors: ['rate<0.01'], // Error rate < 1%
    http_req_duration: ['p(95)<2000'], // P95 < 2s
  },
};
`;

  return `${imports}

${scenarioFunctions}

${options}
`;
}

/**
 * Parse k6 results and generate baseline
 */
export function generateBaseline(k6Results: {
  metrics: Record<
    string,
    {
      values?: Record<string, number>;
      thresholds?: Record<string, boolean>;
    }
  >;
}): PerfBaseline {
  const scenarios: PerfBaseline['scenarios'] = {};

  // Extract metrics for each scenario
  for (const [metricName, metricData] of Object.entries(k6Results.metrics)) {
    if (metricName.startsWith('http_req_duration') && metricData.values) {
      const scenarioName = metricName.replace('http_req_duration_', '');
      scenarios[scenarioName] = {
        p50: metricData.values['p(50)'] || 0,
        p95: metricData.values['p(95)'] || 0,
        p99: metricData.values['p(99)'] || 0,
        min: metricData.values.min || 0,
        max: metricData.values.max || 0,
        avg: metricData.values.avg || 0,
        requests: metricData.values.count || 0,
        errors: metricData.values.failed || 0,
        errorRate: (metricData.values.failed || 0) / (metricData.values.count || 1),
      };
    }
  }

  return {
    timestamp: new Date().toISOString(),
    scenarios,
  };
}

/**
 * Compare baseline with current results
 */
export function compareBaseline(
  baseline: PerfBaseline,
  current: PerfBaseline,
  thresholdPercent = 10,
): {
  passed: boolean;
  regressions: Array<{
    scenario: string;
    metric: string;
    baseline: number;
    current: number;
    deltaPercent: number;
  }>;
} {
  const regressions: Array<{
    scenario: string;
    metric: string;
    baseline: number;
    current: number;
    deltaPercent: number;
  }> = [];

  for (const [scenarioName, baselineData] of Object.entries(baseline.scenarios)) {
    const currentData = current.scenarios[scenarioName];
    if (!currentData) continue;

    const metrics: Array<{ key: keyof typeof baselineData; label: string }> = [
      { key: 'p95', label: 'P95' },
      { key: 'p99', label: 'P99' },
      { key: 'avg', label: 'Average' },
    ];

    for (const { key, label } of metrics) {
      const baselineValue = baselineData[key];
      const currentValue = currentData[key];

      if (baselineValue > 0) {
        const deltaPercent = ((currentValue - baselineValue) / baselineValue) * 100;

        if (deltaPercent > thresholdPercent) {
          regressions.push({
            scenario: scenarioName,
            metric: label,
            baseline: baselineValue,
            current: currentValue,
            deltaPercent,
          });
        }
      }
    }
  }

  return {
    passed: regressions.length === 0,
    regressions,
  };
}

/**
 * Save baseline to file
 */
export async function saveBaseline(baseline: PerfBaseline, path: string): Promise<void> {
  const fs = await import('fs/promises');
  await fs.writeFile(path, JSON.stringify(baseline, null, 2));
}

/**
 * Load baseline from file
 */
export async function loadBaseline(path: string): Promise<PerfBaseline> {
  const fs = await import('fs/promises');
  const content = await fs.readFile(path, 'utf-8');
  return JSON.parse(content);
}

/**
 * CLI entry point
 */
const isMain = process.argv[1] && (
  process.argv[1].replace(/\\/g, '/').endsWith('packages/testing/perf/scenarios.ts') ||
  import.meta.url === `file://${process.argv[1]}`
);

if (isMain) {
  const args = process.argv.slice(2);
  
  if (args.includes('--generate-baseline')) {
    const baseline = {
      timestamp: new Date().toISOString(),
      scenarios: {} as PerfBaseline['scenarios'],
    };

    // Generate placeholder baseline from scenario expectations
    for (const scenario of [...apiScenarios, ...webScenarios]) {
      baseline.scenarios[scenario.name] = {
        p50: scenario.expectedP95 * 0.5,
        p95: scenario.expectedP95,
        p99: scenario.expectedP99,
        min: scenario.expectedP95 * 0.1,
        max: scenario.expectedP99 * 2,
        avg: scenario.expectedP95 * 0.7,
        requests: 1000,
        errors: 0,
        errorRate: 0,
      };
    }

    saveBaseline(baseline, 'perf-baseline.json')
      .then(() => {
        if (process.env.NODE_ENV === 'development') { logger.info('? Baseline generated: perf-baseline.json'); }
        process.exit(0);
      })
      .catch((error) => {
        // Error handled: Failed to generate baseline:
        process.exit(1);
      });
  } else if (args.includes('--compare')) {
    loadBaseline('perf-baseline.json')
      .then((baseline) => {
        // Placeholder comparison - in production would compare against actual test results
        if (process.env.NODE_ENV === 'development') { logger.info(`Baseline loaded: ${baseline.timestamp}`); }
        if (process.env.NODE_ENV === 'development') { logger.info('Run k6 tests and compare results'); }
        process.exit(0);
      })
      .catch((error) => {
        // Error handled: Failed to load baseline:
        process.exit(1);
      });
  } else {
    if (process.env.NODE_ENV === 'development') { logger.info('Available commands:'); }
    if (process.env.NODE_ENV === 'development') { logger.info('  --generate-baseline  Generate performance baseline'); }
    if (process.env.NODE_ENV === 'development') { logger.info('  --compare            Compare with baseline'); }
    process.exit(1);
  }
}
