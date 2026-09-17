'use client';

import { useState } from 'react';
import { ShoppingCart, Check, Plus, Mic } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
}

export function GroceryListCard() {
  const [items, setItems] = useState<GroceryItem[]>([
    { id: '1', name: 'Organic Tomatoes', quantity: '2 lbs', category: 'Produce', checked: false },
    { id: '2', name: 'Chicken Breast', quantity: '1.5 lbs', category: 'Meat', checked: true },
    { id: '3', name: 'Brown Rice', quantity: '1 bag', category: 'Grains', checked: false },
    { id: '4', name: 'Avocados', quantity: '4 pieces', category: 'Produce', checked: false },
  ]);

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const checkedCount = items.filter(item => item.checked).length;
  const totalItems = items.length;
  const completionPercentage = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, GroceryItem[]>);

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-lg">Grocery List</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {checkedCount}/{totalItems}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Progress</span>
          <span>{Math.round(completionPercentage)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Items by Category */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category} className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {category}
            </h4>
            {categoryItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  item.checked 
                    ? 'bg-muted/50 opacity-75' 
                    : 'hover:bg-muted/30'
                }`}
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    item.checked
                      ? 'bg-green-500 border-green-500'
                      : 'border-muted-foreground/30'
                  }`}
                >
                  {item.checked && <Check className="w-3 h-3 text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${
                      item.checked ? 'line-through text-muted-foreground' : 'font-medium'
                    }`}
                  >
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Add Item */}
      <div className="mt-4 pt-4 border-t flex gap-2">
        <Input
          placeholder="Add item..."
          className="flex-1 text-sm"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value) {
              // Add new item logic
              e.currentTarget.value = '';
            }
          }}
        />
        <Button variant="outline" size="icon" className="flex-shrink-0">
          <Mic className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" className="flex-shrink-0">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}

export default GroceryListCard;
