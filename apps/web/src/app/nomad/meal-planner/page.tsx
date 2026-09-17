'use client';

export const dynamic = 'force-dynamic';


import { useState } from 'react';
import { Calendar, Plus, GripVertical, Utensils, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MealSlot {
  id: string;
  day: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  calories?: number;
  emoji: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', emoji: '??', time: '8:00 AM' },
  { id: 'lunch', label: 'Lunch', emoji: '??', time: '12:30 PM' },
  { id: 'dinner', label: 'Dinner', emoji: '???', time: '7:00 PM' },
  { id: 'snack', label: 'Snack', emoji: '??', time: '3:00 PM' },
];

export default function MealPlannerPage() {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [meals, setMeals] = useState<MealSlot[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleDragStart = (mealId: string) => {
    setDraggedItem(mealId);
  };

  const handleDrop = (day: string, mealType: string) => {
    if (draggedItem) {
      // Move meal to new slot
      setMeals((prev) =>
        prev.map((meal) =>
          meal.id === draggedItem
            ? { ...meal, day, meal: mealType as MealSlot['meal'] }
            : meal
        )
      );
      setDraggedItem(null);
    }
  };

  const handleAddMeal = (day: string, mealType: string) => {
    const newMeal: MealSlot = {
      id: `${Date.now()}`,
      day,
      meal: mealType as MealSlot['meal'],
      name: 'New Meal',
      calories: 0,
      emoji: MEAL_TYPES.find((m) => m.id === mealType)?.emoji || '???',
    };
    setMeals([...meals, newMeal]);
  };

  const getMealsForSlot = (day: string, mealType: string) => {
    return meals.filter((meal) => meal.day === day && meal.meal === mealType);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-brand-600" />
              <h1 className="text-2xl font-bold">Meal Planner</h1>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Recipe
            </Button>
          </div>
        </div>
      </div>

      {/* Week Selector */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Tabs defaultValue="this-week" className="w-full">
            <TabsList>
              <TabsTrigger value="this-week">This Week</TabsTrigger>
              <TabsTrigger value="next-week">Next Week</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Meal Planning Grid */}
      <div className="container mx-auto px-4 py-6">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-4 min-w-[1400px]">
            {DAYS.map((day) => (
              <div key={day} className="space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold text-lg">{day}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>

                {MEAL_TYPES.map((mealType) => {
                  const slotMeals = getMealsForSlot(day, mealType.id);
                  
                  return (
                    <Card
                      key={`${day}-${mealType.id}`}
                      className="p-3 min-h-[150px]"
                      onDragOver={(e) => {
                        e.preventDefault();
                      }}
                      onDrop={() => handleDrop(day, mealType.id)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{mealType.emoji}</span>
                        <span className="text-xs font-medium">{mealType.label}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {mealType.time}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {slotMeals.map((meal) => (
                          <div
                            key={meal.id}
                            draggable
                            onDragStart={() => handleDragStart(meal.id)}
                            className="p-2 bg-muted rounded-lg cursor-move hover:bg-muted/80 transition-colors"
                          >
                            <div className="flex items-start gap-2">
                              <DragHandleDots2Icon className="w-4 h-4 text-muted-foreground mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{meal.name}</p>
                                {meal.calories && (
                                  <p className="text-xs text-muted-foreground">
                                    {meal.calories} cal
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2 text-xs"
                        onClick={() => handleAddMeal(day, mealType.id)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Meal
                      </Button>
                    </Card>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <Card className="mt-6 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-brand-600" />
              <div>
                <div className="font-semibold">Weekly Summary</div>
                <div className="text-sm text-muted-foreground">
                  {meals.length} meals planned
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                {meals.reduce((sum, meal) => sum + (meal.calories || 0), 0)} cal
              </div>
              <div className="text-sm text-muted-foreground">Total calories</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}