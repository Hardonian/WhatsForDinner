/**
 * Program Statistics Component
 * Displays program performance metrics
 */

'use client';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('programstats');



import { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProgramStatsProps {
  programType: 'referral' | 'affiliate';
  programId: string;
  period?: number; // days
}

interface Stats {
  metrics: {
    total_clicks: number;
    total_signups: number;
    total_conversions: number;
    conversion_rate: number;
    click_to_signup_rate: number;
  };
  revenue: {
    total_revenue: number;
    total_commission: number;
  } | null;
}

export function ProgramStats({ programType, programId, period = 30 }: ProgramStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch(
          `/api/programs/analytics?type=${programType}&id=${programId}&period=${period}`
        );
        const data = await response.json();
        setStats(data);
      } catch (error) {
        _logger.error('Failed to load stats:', { error: error instanceof Error ? error.message : String(error) });
      } finally {
        setLoading(false);
      }
    };

    void loadStats();
  }, [programType, programId, period]);

  if (loading) {
    return <div>Loading stats...</div>;
  }

  if (!stats) {
    return <div>No stats available</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Clicks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <div className="text-2xl font-bold">{stats.metrics.total_clicks}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Signups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div className="text-2xl font-bold">{stats.metrics.total_signups}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Conversions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <div className="text-2xl font-bold">{stats.metrics.total_conversions}</div>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {stats.metrics.conversion_rate.toFixed(1)}% rate
          </div>
        </CardContent>
      </Card>

      {stats.revenue && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <div className="text-2xl font-bold">
                ${stats.revenue.total_commission.toFixed(2)}
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              ${stats.revenue.total_revenue.toFixed(2)} referred
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
