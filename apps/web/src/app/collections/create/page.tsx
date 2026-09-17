'use client';
/**
 * Create Recipe Collection Page
 * Users can create and sell recipe collections
 */

import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('page');



import { useState } from 'react';
import { Save, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { z } from 'zod';

const collectionSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  category: z.enum(['quick', 'meal-prep', 'dietary', 'cuisine', 'seasonal']),
  price: z.number().min(2.99).max(9.99),
  recipeIds: z.array(z.string()).min(5).max(50),
});

export default function CreateCollectionPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('quick');
  const [price, setPrice] = useState([4.99]);
  const [recipeIds, setRecipeIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    try {
      const data = collectionSchema.parse({
        name,
        description,
        category,
        price: price[0],
        recipeIds,
      });

      setIsCreating(true);
      const response = await fetch('/api/collections/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const { collectionId } = await response.json();
      window.location.href = `/collections/${collectionId}`;
    } catch (error) {
      _logger.error('Create collection error:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-4xl font-bold mb-8">Create Recipe Collection</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Collection Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Collection Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., 30-Minute Meals"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[100px] border rounded-md p-3"
                placeholder="Describe your collection..."
              />
            </div>
            <div>
              <Label>Category</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {['quick', 'meal-prep', 'dietary', 'cuisine', 'seasonal'].map((cat) => (
                  <Button
                    key={cat}
                    variant={category === cat ? 'default' : 'outline'}
                    onClick={() => setCategory(cat)}
                    className="capitalize"
                  >
                    {cat.replace('-', ' ')}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <Label>Price: ${price[0].toFixed(2)}</Label>
                <span className="text-sm text-muted-foreground">
                  You'll receive 70% (${(price[0] * 0.7).toFixed(2)})
                </span>
              </div>
              <Slider
                value={price}
                onValueChange={setPrice}
                min={2.99}
                max={9.99}
                step={0.50}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>$2.99</span>
                <span>$9.99</span>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-semibold mb-1">Revenue Split</p>
              <p>You: 70% (${(price[0] * 0.7).toFixed(2)})</p>
              <p>Platform: 30% (${(price[0] * 0.3).toFixed(2)})</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Select Recipes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Select 5-50 recipes for your collection. You can add recipes you've created or saved.
            </p>
            <div className="border rounded-lg p-4 min-h-[200px]">
              <p className="text-sm text-muted-foreground text-center py-8">
                Recipe selector coming soon...
                <br />
                Selected: {recipeIds.length} recipes
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button onClick={handleCreate} disabled={isCreating} className="flex-1" size="lg">
            <Save className="w-4 h-4 mr-2" />
            Create Collection
          </Button>
          <Button variant="outline" asChild>
            <Link href="/collections">Cancel</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}