'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GroceryCategories } from '@/components/grocery/GroceryCategories';
import { GroceryQuiz } from '@/components/grocery/GroceryQuiz';
import { AvatarDisplay } from '@/components/grocery/AvatarDisplay';
import { PointsRewards } from '@/components/grocery/PointsRewards';
import { GrocerySocial } from '@/components/grocery/GrocerySocial';
import { RetailerPriceComparison } from '@/components/grocery/RetailerPriceComparison';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ShoppingCart,
  Search,
  Brain,
  Trophy,
  Users,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  TrendingDown,
  ArrowRight,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
  estimatedPrice: number;
  storeBrandPrice: number;
  checked: boolean;
}

interface CategoryProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  storeBrandPrice: number;
  unit: string;
  inStock: boolean;
}

const SAMPLE_CATEGORY_PRODUCTS: Record<string, CategoryProduct[]> = {
  produce: [
    { id: 'p1', name: 'Organic Hass Avocados (4 pack)', category: 'produce', price: 4.99, storeBrandPrice: 3.89, unit: 'bag', inStock: true },
    { id: 'p2', name: 'Fresh Asparagus Spears', category: 'produce', price: 3.49, storeBrandPrice: 2.79, unit: '1 lb bunch', inStock: true },
    { id: 'p3', name: 'Organic Baby Spinach', category: 'produce', price: 3.99, storeBrandPrice: 2.99, unit: '16 oz clam', inStock: true },
    { id: 'p4', name: 'Sweet Honeycrisp Apples', category: 'produce', price: 5.49, storeBrandPrice: 4.29, unit: '3 lb bag', inStock: true },
  ],
  dairy: [
    { id: 'd1', name: 'Grass-Fed Salted Butter', category: 'dairy', price: 4.89, storeBrandPrice: 3.49, unit: '16 oz (4 sticks)', inStock: true },
    { id: 'd2', name: 'Parmigiano-Reggiano Wedge', category: 'dairy', price: 7.99, storeBrandPrice: 5.99, unit: '8 oz', inStock: true },
    { id: 'd3', name: 'Organic Pasture Eggs (Grade A)', category: 'dairy', price: 5.29, storeBrandPrice: 3.99, unit: '12 count', inStock: true },
    { id: 'd4', name: 'Greek Whole Milk Yogurt', category: 'dairy', price: 4.49, storeBrandPrice: 3.29, unit: '32 oz tub', inStock: true },
  ],
  meat: [
    { id: 'm1', name: 'Wild Sockeye Salmon Fillets', category: 'meat', price: 14.99, storeBrandPrice: 11.99, unit: '1 lb', inStock: true },
    { id: 'm2', name: 'Organic Boneless Chicken Breasts', category: 'meat', price: 8.99, storeBrandPrice: 6.79, unit: '1.5 lb', inStock: true },
    { id: 'm3', name: 'Grass-Fed 85/15 Ground Beef', category: 'meat', price: 7.49, storeBrandPrice: 5.89, unit: '1 lb brick', inStock: true },
  ],
  pantry: [
    { id: 'pn1', name: 'Extra Virgin Cold-Pressed Olive Oil', category: 'pantry', price: 11.99, storeBrandPrice: 8.49, unit: '750 ml', inStock: true },
    { id: 'pn2', name: 'Bronze-Cut Penne Rigate Pasta', category: 'pantry', price: 2.99, storeBrandPrice: 1.79, unit: '16 oz', inStock: true },
    { id: 'pn3', name: 'San Marzano Whole Peeled Tomatoes', category: 'pantry', price: 4.29, storeBrandPrice: 2.89, unit: '28 oz can', inStock: true },
  ],
  bakery: [
    { id: 'b1', name: 'Artisan San Francisco Sourdough', category: 'bakery', price: 4.99, storeBrandPrice: 3.49, unit: '24 oz loaf', inStock: true },
    { id: 'b2', name: 'Brioche Hamburger Buns (4 pack)', category: 'bakery', price: 3.99, storeBrandPrice: 2.79, unit: '4 count', inStock: true },
  ],
};

export default function GroceryPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('produce');
  const [activeTab, setActiveTab] = useState('shop');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const userId = 'current-user';

  // Load live cart on mount
  useEffect(() => {
    async function loadCart() {
      try {
        const res = await fetch('/api/grocery/cart');
        if (res.ok) {
          const data = await res.json();
          if (data.items) {
            setCartItems(data.items);
          }
        }
      } catch {
        // Fallback
      } finally {
        setLoadingCart(false);
      }
    }
    loadCart();
  }, []);

  const handleAddItem = async (name: string, category: string = 'General', price: number = 3.99, storeBrandPrice: number = 2.99) => {
    try {
      const res = await fetch('/api/grocery/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          item: {
            name,
            quantity: 1,
            category,
            estimatedPrice: price,
            storeBrandPrice,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCartItems(data.items);
        toast.success(`Added "${name}" to OmniCart!`);
      }
    } catch {
      toast.error('Could not add item to cart');
    }
  };

  const handleUpdateQuantity = async (id: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(id);
      return;
    }
    try {
      const res = await fetch('/api/grocery/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          item: { id, quantity: newQty },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCartItems(data.items);
      }
    } catch {
      toast.error('Could not update quantity');
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      const res = await fetch('/api/grocery/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          item: { id },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCartItems(data.items);
        toast.info('Item removed from cart');
      }
    } catch {
      toast.error('Could not remove item');
    }
  };

  const handleToggleChecked = async (id: string, currentChecked: boolean) => {
    try {
      const res = await fetch('/api/grocery/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle',
          item: { id, checked: !currentChecked },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCartItems(data.items);
      }
    } catch {
      // Ignore
    }
  };

  const totalCost = cartItems.reduce((acc, i) => acc + (i.estimatedPrice * i.quantity), 0);
  const storeBrandCost = cartItems.reduce((acc, i) => acc + (i.storeBrandPrice * i.quantity), 0);
  const totalSavings = Math.max(0, totalCost - storeBrandCost);

  const categoryKey = selectedCategory?.toLowerCase() || 'produce';
  const displayedProducts = SAMPLE_CATEGORY_PRODUCTS[categoryKey] || SAMPLE_CATEGORY_PRODUCTS['produce'];

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OmniCart™ Grocery Orchestrator</h1>
          <p className="text-muted-foreground text-sm">
            Live multi-retailer price arbitrage, store-brand auto-savings, and instant delivery dispatch.
          </p>
        </div>
        <AvatarDisplay userId={userId} size="md" showCustomize />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto p-1 gap-1">
          <TabsTrigger value="shop" className="py-2">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Arbitrage
          </TabsTrigger>
          <TabsTrigger value="cart" className="py-2 relative">
            <Package className="h-4 w-4 mr-2" />
            My Cart
            {cartItems.length > 0 && (
              <Badge className="ml-1.5 bg-primary text-white text-xs px-1.5 py-0 h-4">
                {cartItems.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="categories" className="py-2">
            <Search className="h-4 w-4 mr-2" />
            Aisles
          </TabsTrigger>
          <TabsTrigger value="quiz" className="py-2">
            <Brain className="h-4 w-4 mr-2" />
            Quiz
          </TabsTrigger>
          <TabsTrigger value="rewards" className="py-2">
            <Trophy className="h-4 w-4 mr-2" />
            Rewards
          </TabsTrigger>
          <TabsTrigger value="social" className="py-2">
            <Users className="h-4 w-4 mr-2" />
            Social
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Shop & Price Arbitrage */}
        <TabsContent value="shop" className="space-y-8">
          <RetailerPriceComparison
            missingItems={cartItems.length > 0 ? cartItems.map(i => `${i.name} (${i.quantity}x)`) : undefined}
          />

          <div>
            <h2 className="text-xl font-bold tracking-tight mb-4">Browse by Supermarket Aisle</h2>
            <GroceryCategories
              onCategorySelect={(category) => {
                setSelectedCategory(category.id);
                setActiveTab('categories');
              }}
              selectedCategory={selectedCategory}
            />
          </div>
        </TabsContent>

        {/* Tab 2: Live Cart Management */}
        <TabsContent value="cart" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Household Grocery Basket</CardTitle>
                      <CardDescription>Items synced across all family members</CardDescription>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {cartItems.length} items
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quick Add Bar */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newItemName.trim()) {
                        handleAddItem(newItemName.trim());
                        setNewItemName('');
                      }
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      placeholder="Quick add item (e.g. Greek yogurt, cilantro, limes)..."
                      value={newItemName}
                      onChange={e => setNewItemName(e.target.value)}
                    />
                    <Button type="submit" className="font-semibold">
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add
                    </Button>
                  </form>

                  {/* Cart Items List */}
                  {loadingCart ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs">Syncing household cart...</p>
                    </div>
                  ) : cartItems.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Your grocery cart is currently empty.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => setActiveTab('categories')}
                      >
                        Browse Grocery Aisles
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {cartItems.map((item) => (
                        <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleChecked(item.id, item.checked)}
                              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                item.checked ? 'bg-primary border-primary text-white' : 'border-muted-foreground/40'
                              }`}
                            >
                              {item.checked && <CheckCircle2 className="w-4 h-4" />}
                            </button>
                            <div>
                              <div className={`font-medium text-sm ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                                {item.name}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <span className="capitalize">{item.category}</span>
                                <span>•</span>
                                <span>${item.estimatedPrice.toFixed(2)} each</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center border rounded-lg overflow-hidden h-8">
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                className="px-2 hover:bg-muted text-muted-foreground"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2.5 text-xs font-mono font-bold">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                className="px-2 hover:bg-muted text-muted-foreground"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Price Summary & Export Card */}
            <div className="space-y-4">
              <Card className="border-2 border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Basket Totals</span>
                    <Badge className="bg-emerald-600 text-white text-xs">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      Save ${(totalSavings).toFixed(2)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Standard Brand Total:</span>
                    <span className="font-semibold font-mono">${totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b text-emerald-600 font-semibold">
                    <span>Store-Brand Price Arbitrage:</span>
                    <span className="font-mono">${storeBrandCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-base font-bold">
                    <span>Estimated Final Basket:</span>
                    <span className="text-primary font-mono text-lg">${storeBrandCost.toFixed(2)}</span>
                  </div>

                  <Button
                    className="w-full font-bold shadow-lg"
                    onClick={() => setActiveTab('shop')}
                  >
                    <span>Dispatch to Retailer</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    1-click export to Instacart, Kroger, Walmart+, or Amazon Fresh.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Categories & Real Products */}
        <TabsContent value="categories" className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight mb-4">Select Aisle</h2>
            <GroceryCategories
              onCategorySelect={(category) => setSelectedCategory(category.id)}
              selectedCategory={selectedCategory}
            />
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-bold capitalize">
                {categoryKey} Staples & Supermarket Picks
              </h3>
              <span className="text-xs text-muted-foreground">
                {displayedProducts.length} items in stock
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {displayedProducts.map((prod) => (
                <Card key={prod.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {prod.unit}
                        </Badge>
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> In Stock
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm line-clamp-2">{prod.name}</h4>
                    </div>

                    <div className="pt-2 border-t space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-base font-bold font-mono text-primary">
                          ${prod.storeBrandPrice.toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground line-through font-mono">
                          ${prod.price.toFixed(2)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="w-full text-xs font-semibold h-8"
                        onClick={() => handleAddItem(prod.name, prod.category, prod.price, prod.storeBrandPrice)}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add to OmniCart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: Quizzes */}
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
                onComplete={() => toast.success('Quiz completed! Earned +50 rewards points.')}
              />
            </div>
          </div>
        </TabsContent>

        {/* Tab 5: Rewards */}
        <TabsContent value="rewards">
          <PointsRewards userId={userId} />
        </TabsContent>

        {/* Tab 6: Social */}
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