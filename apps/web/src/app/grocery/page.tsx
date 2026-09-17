export const dynamic = 'force-dynamic';

/**
 * Main Grocery Page
 * Integrates all grocery features: categories, search, cart, quiz, gamification, social
 */

'use client';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('page');



import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GroceryCategories } from '@/components/grocery/GroceryCategories';
import { GroceryQuiz } from '@/components/grocery/GroceryQuiz';
import { AvatarDisplay } from '@/components/grocery/AvatarDisplay';
import { PointsRewards } from '@/components/grocery/PointsRewards';
import { GrocerySocial } from '@/components/grocery/GrocerySocial';
import { GroceryCategory } from '@/lib/grocery/types';
import { RetailerPriceComparison } from '@/components/grocery/RetailerPriceComparison';
import { ShoppingCart, Search, Brain, Trophy, Users } from 'lucide-react';

export default function GroceryPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [activeTab, setActiveTab] = useState('shop');
  const userId = 'current-user'; // TODO: Get from auth

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Grocery Shopping</h1>
          <p className="text-muted-foreground">
            Find ingredients, compare prices, and earn rewards
          </p>
        </div>
        <AvatarDisplay userId={userId} size="md" showCustomize />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="shop">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Shop
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Search className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="quiz">
            <Brain className="h-4 w-4 mr-2" />
            Quiz
          </TabsTrigger>
          <TabsTrigger value="rewards">
            <Trophy className="h-4 w-4 mr-2" />
            Rewards
          </TabsTrigger>
          <TabsTrigger value="social">
            <Users className="h-4 w-4 mr-2" />
            Social
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shop" className="space-y-8">
          {/* OmniCart Multi-Retailer Arbitrage Matrix */}
          <RetailerPriceComparison />

          <div>
            <h2 className="text-2xl font-semibold mb-4">Browse by Category</h2>
            <GroceryCategories
              onCategorySelect={(category) => {
                setSelectedCategory(category.id);
                setActiveTab('categories');
              }}
              selectedCategory={selectedCategory}
            />
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Grocery Categories</h2>
            <GroceryCategories
              onCategorySelect={(category) => setSelectedCategory(category.id)}
              selectedCategory={selectedCategory}
            />
          </div>
          {selectedCategory && (
            <div className="mt-6">
              <p className="text-muted-foreground">
                Category selected: {selectedCategory}
              </p>
              {/* TODO: Show products in selected category */}
            </div>
          )}
        </TabsContent>

        <TabsContent value="quiz" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Grocery Quizzes</h2>
            <p className="text-muted-foreground mb-6">
              Complete quizzes to earn points and unlock rewards
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GroceryQuiz
                quizId="dietary-preferences"
                userId={userId}
                onComplete={(result) => {
                  _logger.info('Quiz completed:', { result });
                }}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rewards">
          <PointsRewards userId={userId} />
        </TabsContent>

        <TabsContent value="social">
          <GrocerySocial
            listId="current-list"
            userId={userId}
            userName="Current User"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
