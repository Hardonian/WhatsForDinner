'use client';

export const dynamic = 'force-dynamic';


import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { TrendingUp, TrendingDown, Users, Target, Activity } from 'lucide-react';

interface TractionMetrics {
  growthRate: number;
  retention: number;
  activation: number;
  dau: number;
  wau: number;
  mau: number;
}

export default function TractionDashboardPage() {
  const [user, setUser] = useState<unknown>(null);
  const [data, setData] = useState<TractionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        setError('Unauthorized. Admin access required.');
        setLoading(false);
        return;
      }

      try {
        // Fetch traction metrics
        const response = await fetch('/api/admin/traction');
        if (!response.ok) {
          throw new Error('Failed to fetch traction metrics');
        }

        const metrics = await response.json();
        setData({
          growthRate: metrics.growthRate || 0,
          retention: metrics.retention || 0,
          activation: metrics.activation || 0,
          dau: metrics.dau || 0,
          wau: metrics.wau || 0,
          mau: metrics.mau || 0,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load traction metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error || 'No data available'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
      <div className="container mx-auto max-w-7xl space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Traction Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Key metrics mentors care about: growth rate, retention, activation
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Growth Rate
              </CardTitle>
              <CardDescription>Week-over-week growth</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {data.growthRate > 0 ? '+' : ''}
                {data.growthRate.toFixed(1)}%
              </div>
              <Badge variant={data.growthRate > 10 ? 'default' : 'secondary'} className="mt-2">
                {data.growthRate > 10 ? 'On Track' : 'Needs Improvement'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                7-Day Retention
              </CardTitle>
              <CardDescription>Users who return within 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.retention.toFixed(1)}%</div>
              <Badge variant={data.retention >= 40 ? 'default' : 'secondary'} className="mt-2">
                {data.retention >= 40 ? 'Target Met' : 'Below Target'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Activation Rate
              </CardTitle>
              <CardDescription>Signups → First recipe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.activation.toFixed(1)}%</div>
              <Badge variant={data.activation >= 40 ? 'default' : 'secondary'} className="mt-2">
                {data.activation >= 40 ? 'Target Met' : 'Below Target'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                DAU
              </CardTitle>
              <CardDescription>Daily Active Users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.dau.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                WAU
              </CardTitle>
              <CardDescription>Weekly Active Users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.wau.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                MAU
              </CardTitle>
              <CardDescription>Monthly Active Users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.mau.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
