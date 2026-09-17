'use client';

import { Heart, Droplet, Activity, Moon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface HealthMetric {
  id: string;
  label: string;
  value: number;
  target: number;
  unit: string;
  icon: typeof Heart;
  color: string;
}

export function HealthMetricsCard() {
  const metrics: HealthMetric[] = [
    {
      id: 'calories',
      label: 'Calories',
      value: 1650,
      target: 2000,
      unit: 'cal',
      icon: Activity,
      color: 'text-orange-600',
    },
    {
      id: 'water',
      label: 'Water',
      value: 6,
      target: 8,
      unit: 'glasses',
      icon: Droplet,
      color: 'text-blue-600',
    },
    {
      id: 'steps',
      label: 'Steps',
      value: 8420,
      target: 10000,
      unit: 'steps',
      icon: Activity,
      color: 'text-green-600',
    },
    {
      id: 'sleep',
      label: 'Sleep',
      value: 7.5,
      target: 8,
      unit: 'hours',
      icon: Moon,
      color: 'text-purple-600',
    },
  ];

  const getProgress = (value: number, target: number) => {
    return Math.min((value / target) * 100, 100);
  };

  const getStatusColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-red-600" />
        <h3 className="font-semibold text-lg">Health Metrics</h3>
      </div>

      <div className="space-y-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const progress = getProgress(metric.value, metric.target);
          const isComplete = metric.value >= metric.target;

          return (
            <div key={metric.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${metric.color}`} />
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {metric.value.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {metric.target.toLocaleString()} {metric.unit}
                  </span>
                  {isComplete && (
                    <Badge variant="default" className="bg-green-500 text-xs">
                      ?
                    </Badge>
                  )}
                </div>
              </div>
              <div className="relative">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${getStatusColor(progress)}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t">
        <button className="text-sm text-brand-600 hover:text-brand-700 font-medium w-full text-left">
          View Detailed Metrics ?
        </button>
      </div>
    </Card>
  );
}

export default HealthMetricsCard;
