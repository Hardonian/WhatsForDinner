'use client';


import { Button } from '@whats-for-dinner/ui';
import { usePantry } from '@whats-for-dinner/utils';

export default function DemoPage() {
  const { items, addItem, removeItem, clearItems } = usePantry();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground">
            What's for Dinner? - Demo
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Demonstrating shared components across platforms
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Pantry Management */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              Pantry Items
            </h2>
            
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Add an item..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    addItem(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onPress={() => {
                    const item = prompt('Add item:');
                    if (item) addItem(item);
                  }}
                >
                  Add Item
                </Button>
                
                <Button
                  variant="outline"
                  onPress={clearItems}
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {items.length === 0 ? (
                <p className="text-muted-foreground">No items in pantry</p>
              ) : (
                items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-md border border-input bg-card p-3"
                  >
                    <span className="text-card-foreground">{item}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => removeItem(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Button Variants */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              Button Variants
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-foreground">Sizes</h3>
                <div className="flex gap-2">
                  <Button size="sm" onPress={() => alert('Small button!')}>
                    Small
                  </Button>
                  <Button size="md" onPress={() => alert('Medium button!')}>
                    Medium
                  </Button>
                  <Button size="lg" onPress={() => alert('Large button!')}>
                    Large
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-foreground">Variants</h3>
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" onPress={() => alert('Primary!')}>
                    Primary
                  </Button>
                  <Button variant="secondary" onPress={() => alert('Secondary!')}>
                    Secondary
                  </Button>
                  <Button variant="outline" onPress={() => alert('Outline!')}>
                    Outline
                  </Button>
                  <Button variant="ghost" onPress={() => alert('Ghost!')}>
                    Ghost
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-foreground">States</h3>
                <div className="flex gap-2">
                  <Button onPress={() => alert('Normal!')}>
                    Normal
                  </Button>
                  <Button disabled>
                    Disabled
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PWA Features */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            PWA Features
          </h2>
          <div className="rounded-lg border border-input bg-card p-6">
            <p className="text-card-foreground">
              This web app is a Progressive Web App (PWA) with offline support.
              You can install it on your device for a native app-like experience.
            </p>
            <div className="mt-4">
              <Button
                variant="primary"
                onPress={() => {
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.register('/sw.js')
                      .then(() => alert('Service Worker registered!'))
                      .catch(() => alert('Service Worker registration failed!'));
                  } else {
                    alert('Service Workers not supported in this browser');
                  }
                }}
              >
                Register Service Worker
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}