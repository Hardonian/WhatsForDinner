// @ts-nocheck
/**
 * Experimentation Service
 * A/B testing and feature flag management
 */

export interface Experiment {
  name: string;
  description: string;
  variants: string[];
  trafficAllocation: Record<string, number>;
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: string | null;
  endDate: string | null;
  metrics: string[];
}

export interface ExperimentResult {
  experimentId: string;
  variant: string;
  userId: string;
  timestamp: string;
  metrics: Record<string, number>;
}

class ExperimentationService {
  private experiments: Map<string, Experiment> = new Map();
  private results: ExperimentResult[] = [];
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.loadExperiments();
  }

  private loadExperiments() {
    // Load experiments from configuration
    const experiments = {
      'homepage-hero': {
        name: 'Homepage Hero Test',
        description: 'Test different hero section designs',
        variants: ['control', 'variant-a', 'variant-b'],
        trafficAllocation: { control: 0.5, 'variant-a': 0.25, 'variant-b': 0.25 },
        status: 'active' as const,
        startDate: new Date().toISOString(),
        endDate: null,
        metrics: ['click_rate', 'conversion_rate', 'time_on_page']
      }
    };

    for (const [id, experiment] of Object.entries(experiments)) {
      this.experiments.set(id, experiment);
    }
  }

  /**
   * Get variant for a specific experiment
   */
  getVariant(experimentId: string): string | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'active') {
      return null;
    }

    // Check if experiment is within date range
    const now = new Date();
    if (experiment.startDate && new Date(experiment.startDate) > now) {
      return null;
    }
    if (experiment.endDate && new Date(experiment.endDate) < now) {
      return null;
    }

    // Determine variant based on user ID and traffic allocation
    const hash = this.hashString(this.userId + experimentId);
    const random = (hash % 100) / 100;

    let cumulative = 0;
    for (const [variant, allocation] of Object.entries(experiment.trafficAllocation)) {
      cumulative += allocation;
      if (random <= cumulative) {
        return variant;
      }
    }

    return experiment.variants[0]; // Fallback to first variant
  }

  /**
   * Track experiment result
   */
  trackResult(experimentId: string, variant: string, metrics: Record<string, number>) {
    const result: ExperimentResult = {
      experimentId,
      variant,
      userId: this.userId,
      timestamp: new Date().toISOString(),
      metrics
    };

    this.results.push(result);
    this.saveResults();
  }

  /**
   * Get experiment statistics
   */
  getExperimentStats(experimentId: string) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    const experimentResults = this.results.filter(r => r.experimentId === experimentId);
    const stats: Record<string, unknown> = {};

    for (const variant of experiment.variants) {
      const variantResults = experimentResults.filter(r => r.variant === variant);
      
      stats[variant] = {
        participants: variantResults.length,
        metrics: this.calculateMetrics(variantResults, experiment.metrics)
      };
    }

    return stats;
  }

  private calculateMetrics(results: ExperimentResult[], metricNames: string[]) {
    const metrics: Record<string, unknown> = {};

    for (const metricName of metricNames) {
      const values = results.map(r => r.metrics[metricName]).filter(v => v !== undefined);
      
      if (values.length > 0) {
        metrics[metricName] = {
          count: values.length,
          sum: values.reduce((a, b) => a + b, 0),
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values)
        };
      }
    }

    return metrics;
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

  private saveResults() {
    // In a real implementation, this would save to a database
    const resultsPath = path.join(process.cwd(), 'data', 'experiment-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
  }
}

export default ExperimentationService;
