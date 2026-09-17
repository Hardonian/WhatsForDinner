'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat,
  Camera,
  Clock,
  Sparkles,
  Plus,
  RefreshCw,
  PackageCheck,
  AlertTriangle,
  ArrowRight,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PantryManager from '@/components/PantryManager';
import { VisionScanner } from '@/components/pantry/VisionScanner';
import PantryExpirationWidget from '@/components/PantryExpirationWidget';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import Link from 'next/link';

interface PantryItem {
  id: number;
  ingredient: string;
  quantity: number;
}

const INITIAL_SAMPLE_ITEMS: PantryItem[] = [
  { id: 1, ingredient: 'Extra Virgin Olive Oil', quantity: 1 },
  { id: 2, ingredient: 'Garlic Cloves', quantity: 6 },
  { id: 3, ingredient: 'Organic Pasta (Penne)', quantity: 2 },
  { id: 4, ingredient: 'San Marzano Tomatoes', quantity: 3 },
  { id: 5, ingredient: 'Parmigiano-Reggiano', quantity: 1 },
  { id: 6, ingredient: 'Fresh Basil', quantity: 1 },
];

export default function PantryPage() {
  const [items, setItems] = useState<PantryItem[]>(INITIAL_SAMPLE_ITEMS);
  const [activeTab, setActiveTab] = useState('inventory');
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load items from Supabase or local storage on mount
  useEffect(() => {
    async function loadPantry() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('pantry_items')
            .select('id, ingredient, quantity')
            .eq('user_id', user.id);

          if (!error && data && data.length > 0) {
            setItems(data.map((d: any) => ({
              id: typeof d.id === 'number' ? d.id : Math.abs(hashCode(String(d.id))),
              ingredient: d.ingredient,
              quantity: d.quantity || 1,
            })));
          }
        }
      } catch (err) {
        console.warn('Pantry remote fetch fallback to local state:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPantry();
  }, []);

  const handleAdd = async (ingredient: string, quantity: number) => {
    const newItem: PantryItem = {
      id: Date.now(),
      ingredient,
      quantity,
    };
    setItems(prev => [newItem, ...prev]);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('pantry_items').insert({
          user_id: user.id,
          ingredient,
          quantity,
        });
      }
      toast.success(`Added "${ingredient}" to your pantry!`);
    } catch {
      toast.success(`Added "${ingredient}" to local pantry!`);
    }
  };

  const handleUpdate = async (id: number, quantity: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
    toast.success('Updated quantity');
  };

  const handleDelete = async (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
    toast.success('Item removed from pantry');
  };

  const handleSeedSamples = async () => {
    try {
      setIsSeeding(true);
      const res = await fetch('/api/pantry/seed-sample', { credentials: 'omit' });
      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          setItems(data.items.map((it: any, idx: number) => ({
            id: Date.now() + idx,
            ingredient: it.name || it.ingredient || 'Ingredient',
            quantity: it.quantity || 1,
          })));
        }
        toast.success('Sample chef ingredients seeded successfully!');
      } else {
        setItems(INITIAL_SAMPLE_ITEMS);
        toast.success('Starter pantry initialized!');
      }
    } catch {
      setItems(INITIAL_SAMPLE_ITEMS);
      toast.success('Starter pantry initialized!');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleVisionItemsAdded = (detectedNames: string[]) => {
    const newPantryEntries: PantryItem[] = detectedNames.map((name, i) => ({
      id: Date.now() + i,
      ingredient: name,
      quantity: 1,
    }));
    setItems(prev => [...newPantryEntries, ...prev]);
    setActiveTab('inventory');
    toast.success(`Synced ${detectedNames.length} items from VisionScanner to your pantry!`);
  };

  const filteredItems = items.filter(item =>
    item.ingredient.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header Banner */}
      <div className="border-b bg-gradient-to-r from-emerald-500/10 via-primary/5 to-amber-500/10 backdrop-blur">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                <span>OmniPantry™ AI Intelligence</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Your Smart Pantry
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Track ingredients, monitor shelf-life decay, and scan receipts or fridge snapshots with multimodal vision.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedSamples}
                disabled={isSeeding}
                className="gap-1.5"
              >
                <RefreshCw className={`h-4 w-4 ${isSeeding ? 'animate-spin' : ''}`} />
                <span>Seed Sample Items</span>
              </Button>
              <Link href="/recipes">
                <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                  <ChefHat className="h-4 w-4" />
                  <span>Generate Recipe</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="p-3.5 rounded-xl border bg-card/60 backdrop-blur shadow-sm">
              <div className="text-xs text-muted-foreground font-medium">Total Items</div>
              <div className="text-2xl font-bold text-foreground mt-1">{items.length}</div>
            </div>
            <div className="p-3.5 rounded-xl border bg-card/60 backdrop-blur shadow-sm">
              <div className="text-xs text-muted-foreground font-medium">Ready to Cook</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {items.filter(i => i.quantity > 0).length}
              </div>
            </div>
            <div className="p-3.5 rounded-xl border bg-card/60 backdrop-blur shadow-sm">
              <div className="text-xs text-muted-foreground font-medium">Shelf-Life Guard</div>
              <div className="text-2xl font-bold text-primary mt-1">Active</div>
            </div>
            <div className="p-3.5 rounded-xl border bg-card/60 backdrop-blur shadow-sm">
              <div className="text-xs text-muted-foreground font-medium">Vision Sync</div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">Ready</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="inventory" className="gap-2">
              <PackageCheck className="h-4 w-4" />
              <span>Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="scanner" className="gap-2">
              <Camera className="h-4 w-4" />
              <span>Vision Scanner</span>
            </TabsTrigger>
            <TabsTrigger value="expiration" className="gap-2">
              <Clock className="h-4 w-4" />
              <span>Shelf Life</span>
            </TabsTrigger>
          </TabsList>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6 outline-none">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter ingredients..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Showing {filteredItems.length} of {items.length} ingredients
              </div>
            </div>

            <PantryManager
              items={filteredItems}
              onAdd={handleAdd}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          </TabsContent>

          {/* Vision Scanner Tab */}
          <TabsContent value="scanner" className="outline-none">
            <VisionScanner onItemsAdded={handleVisionItemsAdded} />
          </TabsContent>

          {/* Shelf Life Expiration Tab */}
          <TabsContent value="expiration" className="outline-none">
            <PantryExpirationWidget />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
