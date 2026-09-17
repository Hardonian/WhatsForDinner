'use client';


import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Users, Target, TrendingUp, CheckCircle } from 'lucide-react';

interface ActivationFunnel {
  step: string;
  count: number;
  conversionRate: number;
  dropOffRate: number;
}

export default function ActivationFunnelPage() {
  const [user, setUser] = useState<unknown>(null);
  const [data, setData] = useState<ActivationFunnel[]>([]);
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
        const response = await fetch('/api/admin/activation-funnel');
        if (!response.ok) {
          throw new Error('Failed to fetch activation funnel');
        }

        const funnel = await response.json();
        setData(funnel.steps || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load activation funnel');
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
          <h1 className="text-3xl font-bold">Activation Funnel</h1>
          <p className="text-muted-foreground mt-2">
            PLG funnel: Signup → Pantry → First Recipe → Engagement → Upgrade
          </p>
        </div>

        <div className="space-y-4">
          {data.map((step, index) => (
            <Card key={step.step}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {index + 1}
                  </div>
                  {step.step}
                </CardTitle>
                <CardDescription>
                  Step {index + 1} of {data.length}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Users</div>
                    <div className="text-2xl font-bold">{step.count.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Conversion Rate</div>
                    <div className="text-2xl font-bold">{step.conversionRate.toFixed(1)}%</div>
                    <Badge variant={step.conversionRate > 50 ? 'default' : 'secondary'} className="mt-1">
                      {step.conversionRate > 50 ? 'Good' : 'Needs Improvement'}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Drop-Off Rate</div>
                    <div className="text-2xl font-bold">{step.dropOffRate.toFixed(1)}%</div>
                    <Badge variant={step.dropOffRate < 20 ? 'default' : 'destructive'} className="mt-1">
                      {step.dropOffRate < 20 ? 'Low' : 'High'}
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
