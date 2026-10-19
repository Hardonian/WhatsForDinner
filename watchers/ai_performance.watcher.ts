/**
 * AI Performance Watcher
 * Tracks token usage, latency per model, and AI service costs
 * Monitors AI service health and performance trends
 */

import { createClient } from '@supabase/supabase-js';
import { Octokit } from '@octokit/rest';
import { createComponentLogger } from '@whats-for-dinner/utils';

const logger = createComponentLogger('ai-performance-watcher-ts');
interface AIPerformanceMetric {
  timestamp: string;
  model: string;
  provider: 'openai' | 'anthropic' | 'google' | 'azure';
  operation: 'completion' | 'embedding' | 'moderation' | 'image';
  metrics: {
    tokens_input: number;
    tokens_output: number;
    tokens_total: number;
    latency_ms: number;
    cost_usd: number;
    success: boolean;
    error_type?: string;
  };
  context: {
    user_id?: string;
    session_id?: string;
    request_id: string;
    environment: 'development' | 'staging' | 'production';
  };
}

interface PerformanceTrend {
  model: string;
  period: 'hour' | 'day' | 'week' | 'month';
  metrics: {
    avg_latency: number;
    avg_cost: number;
    total_tokens: number;
    success_rate: number;
    error_rate: number;
  };
  trend: {
    latency: 'improving' | 'degrading' | 'stable';
    cost: 'increasing' | 'decreasing' | 'stable';
    usage: 'increasing' | 'decreasing' | 'stable';
  };
}

interface PerformanceAlert {
  type: 'latency' | 'cost' | 'error_rate' | 'usage_spike';
  severity: 'low' | 'medium' | 'high' | 'critical';
  model: string;
  message: string;
  threshold: number;
  actual_value: number;
  recommendation: string;
}

interface PerformanceReport {
  timestamp: string;
  period: string;
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  avg_latency: number;
  success_rate: number;
  trends: PerformanceTrend[];
  alerts: PerformanceAlert[];
  recommendations: string[];
}

class AIPerformanceWatcher {
  private supabase: any;
  private octokit: Octokit;
  private projectRef: string;

  constructor() {
    // Extract project ref from URL or use explicit env var
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const urlMatch = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/);
    this.projectRef = process.env.SUPABASE_PROJECT_REF || urlMatch?.[1] || '';
    
    this.supabase = createClient(
      supabaseUrl || `https://${this.projectRef}.supabase.co`,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
    );
    
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }

  /**
   * Run AI performance analysis
   */
  async analyzePerformance(): Promise<PerformanceReport> {
    
    try {
      // Collect performance metrics
      const metrics = await this.collectPerformanceMetrics();
      
      // Analyze trends
      const trends = await this.analyzeTrends(metrics);
      
      // Check for alerts
      const alerts = await this.checkPerformanceAlerts(metrics, trends);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(metrics, trends, alerts);

      const report: PerformanceReport = {
        timestamp: new Date().toISOString(),
        period: '24h',
        total_requests: metrics.length,
        total_tokens: metrics.reduce((sum, m) => sum + m.metrics.tokens_total, 0),
        total_cost: metrics.reduce((sum, m) => sum + m.metrics.cost_usd, 0),
        avg_latency: metrics.reduce((sum, m) => sum + m.metrics.latency_ms, 0) / metrics.length,
        success_rate: metrics.filter(m => m.metrics.success).length / metrics.length,
        trends,
        alerts,
        recommendations
      };

      // Store report
      await this.storeReport(report);

      // Create GitHub issue if critical alerts found
      const criticalAlerts = alerts.filter(a => a.severity === 'critical');
      if (criticalAlerts.length > 0) {
        await this.createPerformanceIssue(report);
      }

      return report;
    } catch (error) {
      logger.error('AI performance analysis failed:', { error });
      throw error;
    }
  }

  /**
   * Collect performance metrics
   */
  private async collectPerformanceMetrics(): Promise<AIPerformanceMetric[]> {
    const metrics: AIPerformanceMetric[] = [];

    try {
      // Query performance metrics from database
      const { data: dbMetrics, error } = await this.supabase
        .from('ai_performance_metrics')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false });

      if (error) {
        logger.error('Failed to query performance metrics:', { error });
        return metrics;
      }

      // Convert database records to metrics
      for (const record of dbMetrics || []) {
        metrics.push({
          timestamp: record.timestamp,
          model: record.model,
          provider: record.provider,
          operation: record.operation,
          metrics: {
            tokens_input: record.tokens_input || 0,
            tokens_output: record.tokens_output || 0,
            tokens_total: record.tokens_total || 0,
            latency_ms: record.latency_ms || 0,
            cost_usd: record.cost_usd || 0,
            success: record.success || false,
            error_type: record.error_type
          },
          context: {
            user_id: record.user_id,
            session_id: record.session_id,
            request_id: record.request_id,
            environment: record.environment || 'production'
          }
        });
      }

      // If no metrics in database, generate mock data for demonstration
      if (metrics.length === 0) {
                metrics.push(...this.generateMockMetrics());
      }

    } catch (error) {
      logger.error('Failed to collect performance metrics:', { error });
    }

    return metrics;
  }

  /**
   * Generate mock performance metrics for demonstration
   */
  private generateMockMetrics(): AIPerformanceMetric[] {
    const metrics: AIPerformanceMetric[] = [];
    const models = ['gpt-4-turbo-preview', 'gpt-3.5-turbo', 'text-embedding-3-small'];
    const operations = ['completion', 'embedding', 'moderation'];
    const providers = ['openai', 'anthropic', 'google'];
    
    const now = Date.now();
    const hours = 24;

    for (let i = 0; i < hours; i++) {
      const timestamp = new Date(now - i * 60 * 60 * 1000).toISOString();
      const requestsPerHour = Math.floor(Math.random() * 50) + 10; // 10-60 requests per hour

      for (let j = 0; j < requestsPerHour; j++) {
        const model = models[Math.floor(Math.random() * models.length)];
        const operation = operations[Math.floor(Math.random() * operations.length)];
        const provider = providers[Math.floor(Math.random() * providers.length)];
        
        const tokensInput = Math.floor(Math.random() * 1000) + 100;
        const tokensOutput = operation === 'completion' ? Math.floor(Math.random() * 500) + 50 : 0;
        const tokensTotal = tokensInput + tokensOutput;
        const latency = Math.floor(Math.random() * 2000) + 500; // 500-2500ms
        const cost = this.calculateCost(model, tokensTotal, operation);
        const success = Math.random() > 0.05; // 95% success rate

        metrics.push({
          timestamp,
          model,
          provider: provider as any,
          operation: operation as any,
          metrics: {
            tokens_input: tokensInput,
            tokens_output: tokensOutput,
            tokens_total: tokensTotal,
            latency_ms: latency,
            cost_usd: cost,
            success,
            error_type: success ? undefined : 'rate_limit'
          },
          context: {
            request_id: `req_${i}_${j}`,
            environment: 'production'
          }
        });
      }
    }

    return metrics;
  }

  /**
   * Calculate cost for AI operation
   */
  private calculateCost(model: string, tokens: number, operation: string): number {
    const pricing: Record<string, number> = {
      'gpt-4-turbo-preview': 0.00003, // $0.03 per 1K tokens
      'gpt-3.5-turbo': 0.000002, // $0.002 per 1K tokens
      'text-embedding-3-small': 0.0000001 // $0.0001 per 1K tokens
    };

    const basePrice = pricing[model] || 0.00001;
    return (tokens / 1000) * basePrice;
  }

  /**
   * Analyze performance trends
   */
  private async analyzeTrends(metrics: AIPerformanceMetric[]): Promise<PerformanceTrend[]> {
    const trends: PerformanceTrend[] = [];
    const models = [...new Set(metrics.map(m => m.model))];

    for (const model of models) {
      const modelMetrics = metrics.filter(m => m.model === model);
      
      // Calculate hourly trends
      const hourlyData = this.aggregateByHour(modelMetrics);
      const trend = this.calculateTrend(hourlyData);

      trends.push({
        model,
        period: 'hour',
        metrics: {
          avg_latency: modelMetrics.reduce((sum, m) => sum + m.metrics.latency_ms, 0) / modelMetrics.length,
          avg_cost: modelMetrics.reduce((sum, m) => sum + m.metrics.cost_usd, 0) / modelMetrics.length,
          total_tokens: modelMetrics.reduce((sum, m) => sum + m.metrics.tokens_total, 0),
          success_rate: modelMetrics.filter(m => m.metrics.success).length / modelMetrics.length,
          error_rate: modelMetrics.filter(m => !m.metrics.success).length / modelMetrics.length
        },
        trend
      });
    }

    return trends;
  }

  /**
   * Aggregate metrics by hour
   */
  private aggregateByHour(metrics: AIPerformanceMetric[]): Array<{ hour: number; latency: number; cost: number; tokens: number }> {
    const hourlyData: Record<number, { latency: number[]; cost: number[]; tokens: number[] }> = {};

    metrics.forEach(metric => {
      const hour = new Date(metric.timestamp).getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = { latency: [], cost: [], tokens: [] };
      }
      hourlyData[hour].latency.push(metric.metrics.latency_ms);
      hourlyData[hour].cost.push(metric.metrics.cost_usd);
      hourlyData[hour].tokens.push(metric.metrics.tokens_total);
    });

    return Object.entries(hourlyData).map(([hour, data]) => ({
      hour: parseInt(hour),
      latency: data.latency.reduce((sum, l) => sum + l, 0) / data.latency.length,
      cost: data.cost.reduce((sum, c) => sum + c, 0),
      tokens: data.tokens.reduce((sum, t) => sum + t, 0)
    }));
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(hourlyData: Array<{ hour: number; latency: number; cost: number; tokens: number }>): {
    latency: 'improving' | 'degrading' | 'stable';
    cost: 'increasing' | 'decreasing' | 'stable';
    usage: 'increasing' | 'decreasing' | 'stable';
  } {
    if (hourlyData.length < 2) {
      return { latency: 'stable', cost: 'stable', usage: 'stable' };
    }

    const sorted = hourlyData.sort((a, b) => a.hour - b.hour);
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));

    const avgLatencyFirst = firstHalf.reduce((sum, d) => sum + d.latency, 0) / firstHalf.length;
    const avgLatencySecond = secondHalf.reduce((sum, d) => sum + d.latency, 0) / secondHalf.length;
    const totalCostFirst = firstHalf.reduce((sum, d) => sum + d.cost, 0);
    const totalCostSecond = secondHalf.reduce((sum, d) => sum + d.cost, 0);
    const totalTokensFirst = firstHalf.reduce((sum, d) => sum + d.tokens, 0);
    const totalTokensSecond = secondHalf.reduce((sum, d) => sum + d.tokens, 0);

    const latencyChange = (avgLatencySecond - avgLatencyFirst) / avgLatencyFirst;
    const costChange = (totalCostSecond - totalCostFirst) / totalCostFirst;
    const usageChange = (totalTokensSecond - totalTokensFirst) / totalTokensFirst;

    return {
      latency: Math.abs(latencyChange) < 0.1 ? 'stable' : 
               latencyChange > 0 ? 'degrading' : 'improving',
      cost: Math.abs(costChange) < 0.1 ? 'stable' : 
            costChange > 0 ? 'increasing' : 'decreasing',
      usage: Math.abs(usageChange) < 0.1 ? 'stable' : 
             usageChange > 0 ? 'increasing' : 'decreasing'
    };
  }

  /**
   * Check for performance alerts
   */
  private async checkPerformanceAlerts(
    metrics: AIPerformanceMetric[],
    trends: PerformanceTrend[]
  ): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = [];

    // Check latency alerts
    for (const trend of trends) {
      if (trend.metrics.avg_latency > 5000) { // 5 seconds
        alerts.push({
          type: 'latency',
          severity: 'high',
          model: trend.model,
          message: `High latency detected: ${trend.metrics.avg_latency.toFixed(0)}ms`,
          threshold: 5000,
          actual_value: trend.metrics.avg_latency,
          recommendation: 'Consider optimizing prompts or switching to faster model'
        });
      }
    }

    // Check cost alerts
    const totalCost = metrics.reduce((sum, m) => sum + m.metrics.cost_usd, 0);
    if (totalCost > 100) { // $100 per day
      alerts.push({
        type: 'cost',
        severity: 'medium',
        model: 'all',
        message: `High daily cost: $${totalCost.toFixed(2)}`,
        threshold: 100,
        actual_value: totalCost,
        recommendation: 'Review usage patterns and consider cost optimization'
      });
    }

    // Check error rate alerts
    for (const trend of trends) {
      if (trend.metrics.error_rate > 0.1) { // 10% error rate
        alerts.push({
          type: 'error_rate',
          severity: 'high',
          model: trend.model,
          message: `High error rate: ${(trend.metrics.error_rate * 100).toFixed(1)}%`,
          threshold: 0.1,
          actual_value: trend.metrics.error_rate,
          recommendation: 'Check API keys, rate limits, and model availability'
        });
      }
    }

    // Check usage spike alerts
    const recentUsage = metrics
      .filter(m => new Date(m.timestamp) > new Date(Date.now() - 60 * 60 * 1000))
      .reduce((sum, m) => sum + m.metrics.tokens_total, 0);
    
    const previousUsage = metrics
      .filter(m => {
        const time = new Date(m.timestamp);
        return time > new Date(Date.now() - 2 * 60 * 60 * 1000) && 
               time <= new Date(Date.now() - 60 * 60 * 1000);
      })
      .reduce((sum, m) => sum + m.metrics.tokens_total, 0);

    if (previousUsage > 0 && recentUsage / previousUsage > 2) { // 2x increase
      alerts.push({
        type: 'usage_spike',
        severity: 'medium',
        model: 'all',
        message: `Usage spike detected: ${(recentUsage / previousUsage).toFixed(1)}x increase`,
        threshold: 2,
        actual_value: recentUsage / previousUsage,
        recommendation: 'Monitor for potential abuse or unexpected traffic'
      });
    }

    return alerts;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    metrics: AIPerformanceMetric[],
    trends: PerformanceTrend[],
    alerts: PerformanceAlert[]
  ): string[] {
    const recommendations: string[] = [];

    // Cost optimization recommendations
    const highCostModels = trends.filter(t => t.metrics.avg_cost > 0.01);
    if (highCostModels.length > 0) {
      recommendations.push('Consider using more cost-effective models for non-critical operations');
    }

    // Latency optimization recommendations
    const slowModels = trends.filter(t => t.metrics.avg_latency > 2000);
    if (slowModels.length > 0) {
      recommendations.push('Optimize prompts to reduce token usage and improve response times');
    }

    // Error rate recommendations
    const highErrorModels = trends.filter(t => t.metrics.error_rate > 0.05);
    if (highErrorModels.length > 0) {
      recommendations.push('Implement retry logic and error handling for AI operations');
    }

    // Usage pattern recommendations
    const totalTokens = metrics.reduce((sum, m) => sum + m.metrics.tokens_total, 0);
    if (totalTokens > 100000) { // 100K tokens per day
      recommendations.push('Consider implementing caching for frequently used AI responses');
    }

    // Model diversity recommendations
    const uniqueModels = new Set(metrics.map(m => m.model)).size;
    if (uniqueModels < 2) {
      recommendations.push('Consider diversifying AI models to reduce vendor lock-in');
    }

    return recommendations;
  }

  /**
   * Store performance report
   */
  private async storeReport(report: PerformanceReport) {
    try {
      const { error } = await this.supabase
        .from('ai_performance_reports')
        .insert([report]);

      if (error) {
        logger.error('Error storing performance report:', { error });
      } else {
              }
    } catch (error) {
      logger.error('Failed to store performance report:', { error });
    }
  }

  /**
   * Create GitHub issue for performance problems
   */
  private async createPerformanceIssue(report: PerformanceReport) {
    const criticalAlerts = report.alerts.filter(a => a.severity === 'critical');
    
    const issue = {
      title: `🚨 AI Performance Issues Detected (${criticalAlerts.length} critical alerts)`,
      body: this.generatePerformanceIssueBody(report),
      labels: ['ai', 'performance', 'critical', 'automated']
    };

    try {
      const { data } = await this.octokit.rest.issues.create({
        owner: process.env.GITHUB_OWNER || 'your-org',
        repo: process.env.GITHUB_REPO || 'whats-for-dinner-monorepo',
        title: issue.title,
        body: issue.body,
        labels: issue.labels
      });

          } catch (error) {
      logger.error('Failed to create performance issue:', { error });
    }
  }

  /**
   * Generate GitHub issue body for performance problems
   */
  private generatePerformanceIssueBody(report: PerformanceReport): string {
    const criticalAlerts = report.alerts.filter(a => a.severity === 'critical');
    
    return `
## 🚨 AI Performance Issues Report

**Timestamp:** ${report.timestamp}  
**Period:** ${report.period}  
**Total Requests:** ${report.total_requests}  
**Total Tokens:** ${report.total_tokens.toLocaleString()}  
**Total Cost:** $${report.total_cost.toFixed(2)}  
**Average Latency:** ${report.avg_latency.toFixed(0)}ms  
**Success Rate:** ${(report.success_rate * 100).toFixed(1)}%

### 🚨 Critical Alerts

${criticalAlerts.map(alert => `
#### ${alert.type.toUpperCase()} - ${alert.model}
- **Severity:** ${alert.severity.toUpperCase()}
- **Message:** ${alert.message}
- **Threshold:** ${alert.threshold}
- **Actual Value:** ${alert.actual_value}
- **Recommendation:** ${alert.recommendation}
`).join('\n')}

### 📊 Performance Trends

${report.trends.map(trend => `
#### ${trend.model}
- **Average Latency:** ${trend.metrics.avg_latency.toFixed(0)}ms
- **Average Cost:** $${trend.metrics.avg_cost.toFixed(4)}
- **Total Tokens:** ${trend.metrics.total_tokens.toLocaleString()}
- **Success Rate:** ${(trend.metrics.success_rate * 100).toFixed(1)}%
- **Trend:** Latency ${trend.trend.latency}, Cost ${trend.trend.cost}, Usage ${trend.trend.usage}
`).join('\n')}

### 📋 Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

### 🔧 Next Steps

1. Review critical alerts and take immediate action
2. Analyze performance trends and optimize accordingly
3. Implement recommended improvements
4. Monitor performance metrics continuously

---
*This report was automatically generated by the AI Performance Watcher.*
    `.trim();
  }

  /**
   * Run nightly performance check
   */
  async runNightlyCheck() {
        
    try {
      const report = await this.analyzePerformance();
      
      logger.info(`Performance check completed in ${report.duration}ms`);
      logger.info('Overall score: ' + (report.score * 100).toFixed(1) + '%');
      
      if (report.alerts.length > 0) {
        logger.warn('Found ' + report.alerts.length + ' performance alerts');
      }
    } catch (error) {
      logger.error('Nightly performance check failed:', { error });
    }
  }
}

export default AIPerformanceWatcher;