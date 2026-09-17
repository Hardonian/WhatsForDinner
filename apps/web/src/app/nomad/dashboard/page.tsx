'use client';


import { useState, useEffect } from 'react';
import { 
  Utensils, 
  Heart, 
  ShoppingCart, 
  ChefHat, 
  Users, 
  Calendar,
  QrCode,
  Share2,
  TrendingUp,
  Award,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Dashboard Widget Components
import { MealPlanCard } from '@/components/nomad/MealPlanCard';
import { HealthMetricsCard } from '@/components/nomad/HealthMetricsCard';
import { GroceryListCard } from '@/components/nomad/GroceryListCard';
import { RecipeSpotlightCard } from '@/components/nomad/RecipeSpotlightCard';
import { FamilyFeedCard } from '@/components/nomad/FamilyFeedCard';
import { StreaksBadgesCard } from '@/components/nomad/StreaksBadgesCard';
import { AdPlacement } from '@/components/nomad/AdPlacement';

interface DashboardProps {
  userTier?: 'free' | 'premium' | 'partner';
}

export default function NomadDashboard({ userTier = 'free' }: DashboardProps) {
  const [widgetOrder, setWidgetOrder] = useState<string[]>([]);

  useEffect(() => {
    // Initialize widget order based on user preferences
    const defaultOrder = [
      'meal-plan',
      'health-metrics',
      'grocery-list',
      'recipe-spotlight',
      'family-feed',
      'streaks-badges',
    ];
    
    // Insert ads for free tier (every 5th position)
    if (userTier === 'free') {
      const withAds: string[] = [];
      defaultOrder.forEach((widget, index) => {
        withAds.push(widget);
        if ((index + 1) % 5 === 0) {
          withAds.push(`ad-${Math.floor((index + 1) / 5)}`);
        }
      });
      setWidgetOrder(withAds);
    } else {
      setWidgetOrder(defaultOrder);
    }
  }, [userTier]);

  // Quick Actions
  const quickActions = [
    { icon: Utensils, label: 'Add Meal', action: '/nomad/meal-planner', color: 'text-brand-600' },
    { icon: QrCode, label: 'Scan Barcode', action: '/nomad/scan', color: 'text-blue-600' },
    { icon: MessageSquare, label: 'Message Family', action: '/nomad/family/chat', color: 'text-purple-600' },
    { icon: Share2, label: 'Share Recipe', action: '/nomad/recipes/share', color: 'text-green-600' },
  ];

  const renderWidget = (widgetId: string, index: number) => {
    switch (widgetId) {
      case 'meal-plan':
        return <MealPlanCard key={widgetId} />;
      case 'health-metrics':
        return <HealthMetricsCard key={widgetId} />;
      case 'grocery-list':
        return <GroceryListCard key={widgetId} />;
      case 'recipe-spotlight':
        return <RecipeSpotlightCard key={widgetId} />;
      case 'family-feed':
        return <FamilyFeedCard key={widgetId} />;
      case 'streaks-badges':
        return <StreaksBadgesCard key={widgetId} />;
      default:
        if (widgetId.startsWith('ad-')) {
          return <AdPlacement key={widgetId} tier={userTier} />;
        }
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">???</span>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
                Nomad
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {userTier === 'premium' && (
                <Badge variant="default" className="bg-premium-500">
                  <Award className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
              {userTier === 'partner' && (
                <Badge variant="default" className="bg-partner-500">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Partner
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="border-b bg-muted/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 whitespace-nowrap"
                  onClick={() => {
                    // Navigate to action
                    window.location.href = action.action;
                  }}
                >
                  <Icon className={`w-4 h-4 ${action.color}`} />
                  <span>{action.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dashboard Widgets */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgetOrder.map((widgetId, index) => renderWidget(widgetId, index))}
        </div>
      </div>

      {/* Banner Ad (Free Tier Only) */}
      {userTier === 'free' && (
        <div className="container mx-auto px-4 pb-6">
          <AdPlacement tier="free" type="banner" />
        </div>
      )}
    </div>
  );
}
