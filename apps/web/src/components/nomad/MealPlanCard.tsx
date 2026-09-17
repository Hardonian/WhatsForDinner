'use client';

import { useState } from 'react';
import { Calendar, Clock, Utensils, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Meal {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  time: string;
  calories?: number;
  emoji: string;
}

export function MealPlanCard() {
  const [meals, setMeals] = useState<Meal[]>([
    {
      id: '1',
      type: 'breakfast',
      name: 'Avocado Toast with Eggs',
      time: '8:00 AM',
      calories: 420,
      emoji: '??',
    },
    {
      id: '2',
      type: 'lunch',
      name: 'Mediterranean Bowl',
      time: '12:30 PM',
      calories: 580,
      emoji: '??',
    },
    {
      id: '3',
      type: 'dinner',
      name: 'Grilled Salmon & Veggies',
      time: '7:00 PM',
      calories: 650,
      emoji: '???',
    },
  ]);

  const getMealTypeColor = (type: Meal['type']) => {
    switch (type) {
      case 'breakfast':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'lunch':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'dinner':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'snack':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    }
  };

  const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-600" />
          <h3 className="font-semibold text-lg">Today's Meal Plan</h3>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {meals.map((meal) => (
          <div
            key={meal.id}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <span className="text-2xl">{meal.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={`${getMealTypeColor(meal.type)} text-xs`}>
                  {meal.type}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {meal.time}
                </span>
              </div>
              <p className="font-medium text-sm">{meal.name}</p>
              {meal.calories && (
                <p className="text-xs text-muted-foreground mt-1">
                  {meal.calories} cal
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Total Calories</span>
        </div>
        <span className="font-semibold">{totalCalories} cal</span>
      </div>

      <Button className="w-full mt-4" variant="outline">
        Edit Meal Plan
      </Button>
    </Card>
  );
}

export default MealPlanCard;
