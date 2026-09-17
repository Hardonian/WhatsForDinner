'use client';


import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react';

interface ChannelMetrics {
  channel: string;
  signups: number;
  conversions: number;
  cac: number;
  ltv: number;
  conversionRate: number;
}

export default function DistributionDashboardPage() {
  const [user, setUser] = useState<unknown>(null);
  const [data, setData] = useState<ChannelMetrics[]>([]);
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
        const response = await fetch('/api/admin/distribution');
        if (!response.ok) {
          throw new Error('Failed to fetch distribution metrics');
        }

        const metrics = await response.json();
        setData(metrics.channels || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load distribution metrics');
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

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
      <div className="container mx-auto max-w-7xl space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Distribution Metrics</h1>
          <p className="text-muted-foreground mt-2">
            Track signups, conversions, CAC, and LTV by channel
          </p>
        </div>

        <div className="grid gap-6">
          {data.map((channel) => (
            <Card key={channel.channel}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {channel.channel}
                </CardTitle>
                <CardDescription>Channel performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <div className="text-sm text-muted-foreground">Signups</div>
                    <div className="text-2xl font-bold">{channel.signups.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Conversions</div>
                    <div className="text-2xl font-bold">{channel.conversions.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Conversion Rate</div>
                    <div className="text-2xl font-bold">{channel.conversionRate.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">CAC</div>
                    <div className="text-2xl font-bold">${channel.cac.toFixed(2)}</div>
                    <Badge variant={channel.cac < 20 ? 'default' : 'destructive'} className="mt-1">
                      {channel.cac < 20 ? 'Good' : 'High'}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">LTV</div>
                    <div className="text-2xl font-bold">${channel.ltv.toFixed(2)}</div>
                    <Badge variant={channel.ltv > 144 ? 'default' : 'secondary'} className="mt-1">
                      {channel.ltv > 144 ? 'Target Met' : 'Below Target'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}