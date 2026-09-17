'use client';


import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AnimatedCard } from '@/components/ui/animated-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Navbar from '@/components/Navbar';
import {
  User,
  Trash2,
  Shield,
  Bell,
  Settings as SettingsIcon,
  ExternalLink,
  BarChart3,
  HelpCircle,
  ChevronRight,
  Sparkles,
  ChefHat,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<unknown>(null);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      
      // Load user preferences
      if (user) {
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (preferences) {
          setAnalyticsEnabled(preferences.analytics_enabled ?? true);
          setNotificationsEnabled(preferences.notifications_enabled ?? true);
        }
      }
      
      setLoading(false);
    };

    fetchUser();
  }, []);

  const handleAnalyticsToggle = async (enabled: boolean) => {
    setAnalyticsEnabled(enabled);
    if (user) {
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          analytics_enabled: enabled,
          updated_at: new Date().toISOString(),
        });
    }
  };

  const handleNotificationsToggle = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    if (user) {
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          notifications_enabled: enabled,
          updated_at: new Date().toISOString(),
        });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} />
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-6 sm:py-12 max-w-4xl space-y-6 sm:space-y-8">
        {/* Modern Header with Gradient */}
        <AnimatedCard delay={0}>
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <SettingsIcon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-5xl font-bold text-foreground">
                  Settings
                </h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                  Manage your account preferences and settings
                </p>
              </div>
            </div>
          </div>
        </AnimatedCard>

        {/* Account Section */}
        <AnimatedCard delay={100}>
          <Card className="card-interactive border-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                Account
              </CardTitle>
              <CardDescription>Manage your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <Link
                href="/settings/account/profile"
                className="flex items-center justify-between p-4 rounded-lg hover:bg-accent/50 transition-all group hover-lift"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 transition-colors">
                    <User className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold group-hover:text-primary transition-colors">Profile</div>
                    <div className="text-sm text-muted-foreground">Edit your profile information</div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
              <Separator />
              <Link
                href="/analytics"
                className="flex items-center justify-between p-4 rounded-lg hover:bg-accent/50 transition-all group hover-lift"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 transition-colors">
                    <BarChart3 className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold group-hover:text-primary transition-colors flex items-center gap-2">
                      Analytics Dashboard
                      <Badge variant="secondary" className="text-xs animate-pulse">New</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">View your recipe analytics and insights</div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
              <Separator />
              <Link
                href="/settings/account/delete"
                className="flex items-center justify-between p-4 rounded-lg hover:bg-destructive/10 transition-all group text-destructive hover-lift"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-destructive/10">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <div className="font-semibold">Delete Account</div>
                    <div className="text-sm">Permanently delete your account and data</div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-all" />
              </Link>
            </CardContent>
          </Card>
        </AnimatedCard>

        {/* Privacy Section */}
        <AnimatedCard delay={200}>
          <Card className="card-interactive border-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                Privacy & Data
              </CardTitle>
              <CardDescription>Control your privacy and data sharing preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <Link
                href="/settings/legal"
                className="flex items-center justify-between p-4 rounded-lg hover:bg-accent/50 transition-all group hover-lift"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 transition-colors">
                    <Shield className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold group-hover:text-primary transition-colors">Legal</div>
                    <div className="text-sm text-muted-foreground">Privacy Policy & Terms of Service</div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
              <Separator />
              <div className="flex items-center justify-between p-4 rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 rounded-md bg-muted">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Analytics</div>
                    <div className="text-sm text-muted-foreground">
                      Help us improve by sharing usage data
                    </div>
                  </div>
                </div>
                <Switch
                  checked={analyticsEnabled}
                  onCheckedChange={handleAnalyticsToggle}
                  aria-label="Enable analytics"
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>

        {/* Notifications Section */}
        <AnimatedCard delay={300}>
          <Card className="card-interactive border-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                Notifications
              </CardTitle>
              <CardDescription>Manage notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 rounded-md bg-muted">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Push Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Receive notifications about meal suggestions and updates
                    </div>
                  </div>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={handleNotificationsToggle}
                  aria-label="Enable push notifications"
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>

        {/* App Section */}
        <AnimatedCard delay={400}>
          <Card className="card-interactive border-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                  <ChefHat className="h-5 w-5 text-primary" />
                </div>
                App Information
              </CardTitle>
              <CardDescription>About this application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-center justify-between p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold">Version</div>
                    <div className="text-sm text-muted-foreground">
                      {process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="bg-primary/10 border-primary/20">Latest</Badge>
              </div>
              <Separator />
              <Link
                href="/support"
                className="flex items-center justify-between p-4 rounded-lg hover:bg-accent/50 transition-all group hover-lift"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 transition-colors">
                    <HelpCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold group-hover:text-primary transition-colors">Support</div>
                    <div className="text-sm text-muted-foreground">Get help and contact us</div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>
    </div>
  );
}