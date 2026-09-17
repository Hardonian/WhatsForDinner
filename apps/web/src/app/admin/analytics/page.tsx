'use client';


import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Activity,
  Target,
} from 'lucide-react';

interface AdminAnalytics {
  dau: number;
  activationRate: number;
  errorRate: number;
  signups: number;
  activations: number;
  totalRecipes: number;
  recipesToday: number;
}

export default function AdminAnalyticsPage() {
  const [user, setUser] = useState<unknown>(null);
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      // Check if user is admin (you may need to adjust this based on your auth setup)
      if (!user) {
        setError('Unauthorized. Admin access required.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/analytics/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const dashboardData = await response.json();
        setData({
          dau: dashboardData.summary.dau || 0,
          activationRate: dashboardData.summary.activationRate || 0,
          errorRate: dashboardData.summary.errorRate || 0,
          signups: dashboardData.summary.signups || 0,
          activations: dashboardData.summary.activations || 0,
          totalRecipes: dashboardData.summary.totalRecipes || 0,
          recipesToday: dashboardData.summary.recipesToday || 0,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
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
          <h1 className="text-3xl font-bold">Admin Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Core metrics: DAU, activation rate, error rate
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* DAU */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.dau}</div>
              <p className="text-xs text-muted-foreground">
                Active in last 24 hours
              </p>
            </CardContent>
          </Card>

          {/* Activation Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activation Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.activationRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {data.activations} activated / {data.signups} signups
              </p>
              <Badge 
                variant={data.activationRate >= 50 ? 'default' : 'destructive'} 
                className="mt-2"
              >
                {data.activationRate >= 50 ? 'On Target' : 'Below Target'}
              </Badge>
            </CardContent>
          </Card>

          {/* Error Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.errorRate.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">
                Errors per total events
              </p>
              <Badge 
                variant={data.errorRate < 1 ? 'default' : 'destructive'} 
                className="mt-2"
              >
                {data.errorRate < 1 ? 'Healthy' : 'Needs Attention'}
              </Badge>
            </CardContent>
          </Card>

          {/* Total Recipes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recipes</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalRecipes}</div>
              <p className="text-xs text-muted-foreground">
                {data.recipesToday} generated today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Success Criteria Status */}
        <Card>
          <CardHeader>
            <CardTitle>Sprint Success Criteria</CardTitle>
            <CardDescription>Current status vs. targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-5 w-5 ${data.activationRate >= 50 ? 'text-green-500' : 'text-gray-400'}`} />
                  <span>Activation Rate ≥ 50%</span>
                </div>
                <Badge variant={data.activationRate >= 50 ? 'default' : 'secondary'}>
                  {data.activationRate.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-5 w-5 ${data.errorRate < 1 ? 'text-green-500' : 'text-gray-400'}`} />
                  <span>Error Rate &lt; 1%</span>
                </div>
                <Badge variant={data.errorRate < 1 ? 'default' : 'destructive'}>
                  {data.errorRate.toFixed(2)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-5 w-5 ${data.dau > 0 ? 'text-green-500' : 'text-gray-400'}`} />
                  <span>DAU Tracking</span>
                </div>
                <Badge variant={data.dau > 0 ? 'default' : 'secondary'}>
                  {data.dau} users
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
