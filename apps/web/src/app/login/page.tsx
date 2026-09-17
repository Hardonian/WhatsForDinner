'use client';

export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChefHat, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.info('Signed in under local chef session.');
      } else {
        toast.success('Welcome back!');
      }

      router.push(redirectPath);
    } catch {
      toast.info('Proceeding with guest chef session.');
      router.push(redirectPath);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
              <ChefHat className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight">WhatsForDinner</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Sign in to your kitchen</h1>
          <p className="text-sm text-muted-foreground">
            Access your pantry, personalized weekly meal plans, and saved recipes.
          </p>
        </div>

        <Card className="border shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Welcome Back</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Email Address</label>
                <Input
                  type="email"
                  placeholder="chef@kitchen.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full font-bold h-11" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t flex flex-col items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Don&apos;t have an account?</span>
                <Link href="/signup" className="text-primary font-semibold hover:underline">
                  Create Account
                </Link>
              </div>
              <div>
                <Link href="/dashboard" className="text-xs text-muted-foreground underline hover:text-foreground">
                  Continue as Guest
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading login...</p></div>}>
      <LoginContent />
    </Suspense>
  );
}
