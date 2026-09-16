import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { handleApiError, getCorrelationId } from '@whats-for-dinner/utils';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('performance-api');

/**
 * Performance Metrics API
 * 
 * Tracks and returns performance metrics: API response times, suggestion generation time, Core Web Vitals
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get performance metrics from system_metrics table
    const { data: metrics, error: metricsError } = await supabase
      .from('system_metrics')
      .select('*')
      .eq('metric_type', 'api_performance')
      .order('timestamp', { ascending: false })
      .limit(1000);

    if (metricsError) {
      _logger.warn('Error fetching performance metrics', {
        error: metricsError.message,
        correlationId: getCorrelationId(request),
      });
    }

    // Calculate percentiles
    const responseTimes = metrics
      ?.filter(m => m.metadata?.endpoint)
      .map(m => m.value) || [];

    const suggestionTimes = metrics
      ?.filter(m => m.metadata?.operation === 'suggestion_generation')
      .map(m => m.value) || [];

    const calculatePercentile = (values: number[], percentile: number): number => {
      if (values.length === 0) return 0;
      const sorted = [...values].sort((a, b) => a - b);
      const index = Math.ceil((percentile / 100) * sorted.length) - 1;
      return sorted[Math.max(0, index)] || 0;
    };

    return NextResponse.json({
      apiResponseTime: {
        p50: calculatePercentile(responseTimes, 50),
        p95: calculatePercentile(responseTimes, 95),
        p99: calculatePercentile(responseTimes, 99),
        average: responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : 0,
      },
      suggestionGenerationTime: {
        p50: calculatePercentile(suggestionTimes, 50),
        p95: calculatePercentile(suggestionTimes, 95),
        p99: calculatePercentile(suggestionTimes, 99),
        average: suggestionTimes.length > 0
          ? suggestionTimes.reduce((a, b) => a + b, 0) / suggestionTimes.length
          : 0,
      },
      coreWebVitals: {
        // These would come from client-side tracking
        lcp: 0,
        fid: 0,
        cls: 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error, {
      component: 'performance-api',
      context: { correlationId: getCorrelationId(request) },
    });
  }
}
