'use client';

import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('page');



import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { analytics } from '@/lib/analytics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedCard } from '@/components/ui/animated-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Navbar from '@/components/Navbar';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  ChefHat,
  Calendar,
  TrendingUp,
  Clock,
  Zap,
  Target,
  BarChart3,
  Activity,
} from 'lucide-react';
// Skeleton loader removed - using inline loading state

interface DashboardData {
  summary: {
    totalRecipes: number;
    recipesToday: number;
    recipesThisWeek: number;
    recipesThisMonth: number;
    avgCookTime: number;
    avgCalories: number;
    avgLatency: number;
    successRate: number;
  };
  popularIngredients: Array<{ ingredient: string; count: number }>;
  cuisinePreferences: Array<{ cuisine: string; count: number }>;
  timeSeriesData: Array<{ date: string; recipes: number }>;
  eventCounts: Record<string, number>;
}

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];

export default function AnalyticsDashboard() {
  const [user, setUser] = useState<unknown>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      return user;
    };

    const fetchData = async () => {
      try {
        const user = await fetchUser();
        if (!user) {
          setError('Please sign in to view your analytics');
          setLoading(false);
          return;
        }

        // Set user ID for analytics
        analytics.setUserId(user.id);
        
        // Track page view
        await analytics.trackEvent('analytics_dashboard_viewed', {
          user_id: user.id,
        });

        const response = await fetch('/api/analytics/dashboard');

        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics');
        _logger.error('Error fetching analytics:', { err });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Navbar user={user} />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-destructive">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive/20">
                  <span className="text-xs font-bold">!</span>
                </div>
                <p className="font-medium">{error || 'No data available'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-6 sm:py-12 max-w-7xl space-y-6 sm:space-y-8">
        {/* Modern Header */}
        <AnimatedCard delay={0}>
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-5xl font-bold text-foreground">
                  Analytics <span className="gradient-text">Dashboard</span>
                </h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                  Track your recipe generation activity and insights
                </p>
              </div>
            </div>
          </div>
        </AnimatedCard>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
          <AnimatedCard delay={100}>
            <Card className="card-interactive border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipes</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalRecipes}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.recipesThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recipes Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.recipesToday}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.recipesThisWeek} this week
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cook Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.avgCookTime} min</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(data.summary.avgLatency)}ms avg latency
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Avg {data.summary.avgCalories} calories
            </p>
            </CardContent>
          </Card>
          </AnimatedCard>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Recipe Generation Over Time */}
          <AnimatedCard delay={300}>
            <Card className="card-interactive border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recipe Generation (Last 7 Days)
            </CardTitle>
            <CardDescription>Daily recipe generation activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                  className="text-xs"
                />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="recipes"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        </AnimatedCard>

        {/* Popular Ingredients */}
        <AnimatedCard delay={350}>
          <Card className="card-interactive border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Popular Ingredients
            </CardTitle>
            <CardDescription>Most frequently used ingredients</CardDescription>
          </CardHeader>
          <CardContent>
            {data.popularIngredients.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.popularIngredients.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="ingredient"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available yet
              </div>
            )}
          </CardContent>
        </Card>
        </AnimatedCard>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Cuisine Preferences */}
          <AnimatedCard delay={400}>
            <Card className="card-interactive border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Cuisine Preferences
            </CardTitle>
            <CardDescription>Distribution of cuisine types</CardDescription>
          </CardHeader>
          <CardContent>
            {data.cuisinePreferences.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.cuisinePreferences}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ cuisine, percent }) =>
                      `${cuisine}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {data.cuisinePreferences.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available yet
              </div>
            )}
          </CardContent>
        </Card>
        </AnimatedCard>

        {/* Event Activity */}
        <AnimatedCard delay={450}>
          <Card className="card-interactive border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Event Activity
            </CardTitle>
            <CardDescription>User interaction events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.eventCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([event, count]) => (
                  <div
                    key={event}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <span className="text-sm font-medium capitalize">
                      {event.replace(/_/g, ' ')}
                    </span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              {Object.keys(data.eventCounts).length === 0 && (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    No events tracked yet
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
        </AnimatedCard>
        </div>

        {/* Popular Ingredients List */}
        <AnimatedCard delay={500}>
          <Card className="card-interactive border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Top Ingredients
          </CardTitle>
          <CardDescription>Your most frequently used ingredients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {data.popularIngredients.length > 0 ? (
              data.popularIngredients.map((item, index) => (
                <Badge
                  key={item.ingredient}
                  variant={index < 3 ? 'default' : 'secondary'}
                  className="text-sm px-3 py-1"
                >
                  {item.ingredient} ({item.count})
                </Badge>
              ))
            ) : (
              <p className="text-muted-foreground">No ingredients tracked yet</p>
            )}
          </div>
        </CardContent>
      </Card>
      </AnimatedCard>
      </div>
    </div>
  );
}
