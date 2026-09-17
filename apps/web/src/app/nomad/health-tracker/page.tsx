'use client';

export const dynamic = 'force-dynamic';


import { useState } from 'react';
import { Heart, Activity, Droplet, Moon, TrendingUp, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function HealthTrackerPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [waterGlasses, setWaterGlasses] = useState(6);
  const [calories, setCalories] = useState(1650);

  const metrics = [
    {
      id: 'calories',
      label: 'Calories',
      value: 1650,
      target: 2000,
      unit: 'cal',
      icon: Activity,
      color: 'text-orange-600',
      trend: '+5%',
    },
    {
      id: 'water',
      label: 'Water',
      value: 6,
      target: 8,
      unit: 'glasses',
      icon: Droplet,
      color: 'text-blue-600',
      trend: '+2',
    },
    {
      id: 'steps',
      label: 'Steps',
      value: 8420,
      target: 10000,
      unit: 'steps',
      icon: Activity,
      color: 'text-green-600',
      trend: '+12%',
    },
    {
      id: 'sleep',
      label: 'Sleep',
      value: 7.5,
      target: 8,
      unit: 'hours',
      icon: Moon,
      color: 'text-purple-600',
      trend: '+0.5h',
    },
  ];

  const weeklyData = [
    { day: 'Mon', calories: 1850, water: 7, steps: 9200, sleep: 7.5 },
    { day: 'Tue', calories: 2100, water: 8, steps: 11200, sleep: 8 },
    { day: 'Wed', calories: 1950, water: 6, steps: 8800, sleep: 7 },
    { day: 'Thu', calories: 2200, water: 9, steps: 12500, sleep: 8.5 },
    { day: 'Fri', calories: 1750, water: 7, steps: 7500, sleep: 7 },
    { day: 'Sat', calories: 2400, water: 6, steps: 6800, sleep: 9 },
    { day: 'Sun', calories: 1650, water: 6, steps: 8420, sleep: 7.5 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-red-600" />
              <h1 className="text-2xl font-bold">Health Tracker</h1>
            </div>
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              View History
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
            <TabsTrigger value="calories" className="flex-1">Calories</TabsTrigger>
            <TabsTrigger value="water" className="flex-1">Hydration</TabsTrigger>
            <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                const progress = (metric.value / metric.target) * 100;
                const isComplete = metric.value >= metric.target;

                return (
                  <Card key={metric.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Icon className={`w-5 h-5 ${metric.color}`} />
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {metric.trend}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-2xl font-bold">{metric.value.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">
                            of {metric.target.toLocaleString()} {metric.unit}
                          </div>
                        </div>
                        {isComplete && (
                          <span className="text-2xl">?</span>
                        )}
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isComplete ? 'bg-green-500' : metric.color.replace('text-', 'bg-')
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Weekly Chart */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Weekly Progress</h3>
              <div className="space-y-4">
                {weeklyData.map((dayData, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{dayData.day}</span>
                      <span className="text-muted-foreground">
                        {dayData.calories} cal ? {dayData.water}?? ? {dayData.steps.toLocaleString()} steps
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 transition-all duration-300"
                        style={{ width: `${(dayData.calories / 2400) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Calories Tab */}
          <TabsContent value="calories" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Daily Calorie Intake</h3>
                <div className="text-2xl font-bold">
                  {calories} <span className="text-lg text-muted-foreground">/ 2000 cal</span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Log Calories</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="number"
                      placeholder="Enter calories"
                      className="flex-1"
                    />
                    <Button>Add</Button>
                  </div>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 transition-all duration-300"
                    style={{ width: `${(calories / 2000) * 100}%` }}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Water Tab */}
          <TabsContent value="water" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg">Hydration Tracker</h3>
                <div className="text-2xl font-bold">
                  {waterGlasses} <span className="text-lg text-muted-foreground">/ 8 glasses</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setWaterGlasses(index + 1)}
                    className={`aspect-square rounded-lg border-2 flex items-center justify-center text-3xl transition-all ${
                      index < waterGlasses
                        ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/20'
                        : 'border-border hover:border-blue-300'
                    }`}
                  >
                    ??
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}
                >
                  -
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setWaterGlasses(Math.min(8, waterGlasses + 1))}
                  className="flex-1"
                >
                  Log Glass
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setWaterGlasses(Math.min(8, waterGlasses + 1))}
                >
                  +
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Activity Tracking</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold">Steps</div>
                      <div className="text-sm text-muted-foreground">8,420 / 10,000 steps</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Connect Wearable
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-2">
                    Sync with Google Fit or Apple Health to automatically track steps, workouts, and sleep.
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Google Fit</Button>
                    <Button variant="outline" size="sm">Apple Health</Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
