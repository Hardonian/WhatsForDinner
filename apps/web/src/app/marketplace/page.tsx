'use client';

export const dynamic = 'force-dynamic';
/**
 * Recipe Marketplace
 * Users can buy premium recipe packs and customizations
 */


import { useState } from 'react';
import { ShoppingCart, Star, Clock, Users, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RecipePack {
  id: string;
  name: string;
  description: string;
  price: number;
  recipeCount: number;
  category: 'quick' | 'meal-prep' | 'international' | 'kid-friendly' | 'dietary';
  rating: number;
  reviews: number;
  image?: string;
  features: string[];
}

const recipePacks: RecipePack[] = [
  {
    id: 'quick-easy',
    name: 'Quick & Easy Meals',
    description: '50 recipes ready in 30 minutes or less',
    price: 4.99,
    recipeCount: 50,
    category: 'quick',
    rating: 4.8,
    reviews: 234,
    features: ['30-min meals', 'One-pan recipes', 'Minimal prep']
  },
  {
    id: 'meal-prep',
    name: 'Meal Prep Master',
    description: '30 recipes perfect for weekly meal prep',
    price: 6.99,
    recipeCount: 30,
    category: 'meal-prep',
    rating: 4.9,
    reviews: 189,
    features: ['Freezer-friendly', 'Batch cooking', '5-day plans']
  },
  {
    id: 'international',
    name: 'International Cuisine',
    description: '40 recipes from around the world',
    price: 7.99,
    recipeCount: 40,
    category: 'international',
    rating: 4.7,
    reviews: 312,
    features: ['15+ cuisines', 'Authentic flavors', 'Cultural notes']
  },
  {
    id: 'kid-friendly',
    name: 'Kid-Friendly Favorites',
    description: '35 recipes kids actually want to eat',
    price: 5.99,
    recipeCount: 35,
    category: 'kid-friendly',
    rating: 4.9,
    reviews: 456,
    features: ['Picky eater approved', 'Hidden veggies', 'Fun shapes']
  },
];

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handlePurchase = async (pack: RecipePack) => {
    // Create checkout session
    const response = await fetch('/api/marketplace/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packId: pack.id })
    });

    const { checkoutUrl } = await response.json();
    window.location.href = checkoutUrl;
  };

  const filteredPacks = selectedCategory === 'all'
    ? recipePacks
    : recipePacks.filter(pack => pack.category === selectedCategory);

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Recipe Marketplace</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover premium recipe packs curated by chefs and nutritionists
        </p>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
        <TabsList className="grid w-full grid-cols-5 max-w-2xl mx-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="quick">Quick</TabsTrigger>
          <TabsTrigger value="meal-prep">Meal Prep</TabsTrigger>
          <TabsTrigger value="international">International</TabsTrigger>
          <TabsTrigger value="kid-friendly">Kids</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {filteredPacks.map(pack => (
          <Card key={pack.id} className="flex flex-col hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-muted-foreground" />
              </div>
              <div className="flex items-start justify-between mb-2">
                <CardTitle className="text-lg">{pack.name}</CardTitle>
                <Badge variant="secondary">{pack.recipeCount} recipes</Badge>
              </div>
              <CardDescription>{pack.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex items-center gap-1 mb-4">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold">{pack.rating}</span>
                <span className="text-sm text-muted-foreground">({pack.reviews})</span>
              </div>
              <ul className="space-y-2 mb-4 flex-1">
                {pack.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <div className="text-2xl font-bold">${pack.price}</div>
                  <div className="text-xs text-muted-foreground">One-time purchase</div>
                </div>
                <Button onClick={() => handlePurchase(pack)} size="sm">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Buy
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Customization Credits */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardHeader>
          <CardTitle>Recipe Customization Credits</CardTitle>
          <CardDescription>
            Customize any recipe with AI: make it vegetarian, spicier, or kid-friendly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { credits: 10, price: 2.99, popular: false },
              { credits: 25, price: 5.99, popular: true },
              { credits: 50, price: 9.99, popular: false },
            ].map((option, i) => (
              <Card key={i} className={option.popular ? 'border-2 border-primary' : ''}>
                <CardContent className="pt-6">
                  {option.popular && (
                    <Badge className="mb-2">Most Popular</Badge>
                  )}
                  <div className="text-3xl font-bold mb-1">{option.credits}</div>
                  <div className="text-sm text-muted-foreground mb-4">credits</div>
                  <div className="text-2xl font-bold mb-4">${option.price}</div>
                  <Button className="w-full" variant={option.popular ? 'default' : 'outline'}>
                    Purchase
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}