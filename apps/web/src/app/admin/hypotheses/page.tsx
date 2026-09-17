'use client';

export const dynamic = 'force-dynamic';


import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CheckCircle, Clock, XCircle, HelpCircle } from 'lucide-react';

interface Hypothesis {
  id: string;
  hypothesis: string;
  status: 'validated' | 'testing' | 'untested' | 'invalidated';
  evidence: string;
  test: string;
  results: string;
}

export default function HypothesesDashboardPage() {
  const [user, setUser] = useState<unknown>(null);
  const [data, setData] = useState<Hypothesis[]>([]);
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
        const response = await fetch('/api/admin/hypotheses');
        if (!response.ok) {
          throw new Error('Failed to fetch hypotheses');
        }

        const hypotheses = await response.json();
        setData(hypotheses.hypotheses || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load hypotheses');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'testing':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'untested':
        return <HelpCircle className="h-5 w-5 text-gray-500" />;
      case 'invalidated':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <HelpCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validated':
        return <Badge variant="default">Validated</Badge>;
      case 'testing':
        return <Badge variant="secondary">Testing</Badge>;
      case 'untested':
        return <Badge variant="outline">Untested</Badge>;
      case 'invalidated':
        return <Badge variant="destructive">Invalidated</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

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
          <h1 className="text-3xl font-bold">Hypothesis Status Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Track hypothesis status: Validated, Testing, Untested, Invalidated
          </p>
        </div>

        <div className="grid gap-6">
          {data.map((hypothesis) => (
            <Card key={hypothesis.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(hypothesis.status)}
                  {hypothesis.hypothesis}
                </CardTitle>
                <CardDescription>
                  {getStatusBadge(hypothesis.status)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Evidence</div>
                    <div className="text-sm">{hypothesis.evidence}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Test</div>
                    <div className="text-sm">{hypothesis.test}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Results</div>
                    <div className="text-sm">{hypothesis.results}</div>
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
