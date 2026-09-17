'use client';


import { Button } from '@whats-for-dinner/ui';
import { usePantry } from '@whats-for-dinner/utils';

export default function TestPage() {
  const { items, addItem } = usePantry();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <h1 className="text-4xl font-bold text-foreground">
          Test Page
        </h1>
        
        <div className="space-y-4">
          <Button
            variant="primary"
            onPress={() => addItem('Test Item')}
          >
            Add Test Item
          </Button>
          
          <div>
            <h2 className="text-2xl font-semibold mb-4">Items ({items.length})</h2>
            {items.map((item, index) => (
              <div key={index} className="p-2 bg-card rounded">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}