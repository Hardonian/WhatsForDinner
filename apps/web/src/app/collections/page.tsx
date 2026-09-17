export const dynamic = 'force-dynamic';

/**
 * Recipe Collections Marketplace
 * Users create and sell recipe collections
 */

'use client';

import { useState } from 'react';
import { Plus, Star, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Collection {
  id: string;
  name: string;
  description: string;
  recipeCount: number;
  price: number;
  creator: string;
  rating: number;
  sales: number;
  image?: string;
}

export default function CollectionsPage() {
  const [tab, setTab] = useState<'browse' | 'create'>('browse');

  const collections: Collection[] = [
    {
      id: '1',
      name: '30-Minute Meals',
      description: 'Quick and easy recipes for busy weeknights',
      recipeCount: 30,
      price: 4.99,
      creator: 'Chef Sarah',
      rating: 4.8,
      sales: 234,
    },
    {
      id: '2',
      name: 'Meal Prep Sundays',
      description: 'Perfect recipes for weekly meal prep',
      recipeCount: 25,
      price: 5.99,
      creator: 'Mike R.',
      rating: 4.9,
      sales: 189,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-bold mb-2">Recipe Collections</h1>
          <p className="text-xl text-muted-foreground">
            Discover curated recipe collections or create your own
          </p>
        </div>
        <Button asChild>
          <Link href="/collections/create">
            <Plus className="w-4 h-4 mr-2" />
            Create Collection
          </Link>
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'browse' | 'create')}>
        <TabsList>
          <TabsTrigger value="browse">Browse Collections</TabsTrigger>
          <TabsTrigger value="create">My Collections</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map(collection => (
              <Card key={collection.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
                    <TrendingUp className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <CardTitle>{collection.name}</CardTitle>
                  <CardDescription>{collection.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{collection.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{collection.sales} sales</span>
                    </div>
                    <Badge variant="secondary">{collection.recipeCount} recipes</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">${collection.price}</div>
                    <Button size="sm" asChild>
                      <Link href={`/collections/${collection.id}`}>View</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create" className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Create Your Collection</CardTitle>
              <CardDescription>
                Curate recipes and sell them to the community. You keep 70% of sales.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Revenue Split</h3>
                  <p className="text-sm text-muted-foreground">
                    You receive 70% of each sale. Platform takes 30% for hosting and payment processing.
                  </p>
                </div>
                <Button asChild>
                  <Link href="/collections/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Start Creating
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
