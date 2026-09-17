'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  Barcode,
  Search,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  ChevronLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';

interface ProductInfo {
  name: string;
  brand: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingSize: string;
  shelfLifeDays: number;
  novaGroup: number;
  nutriscore: string;
  allergens: string[];
  storageTip: string;
  imageUrl?: string | null;
}

const PRESET_QUICK_SCANS = [
  { label: 'Kerrygold Butter', code: '076808500139', emoji: '🧈' },
  { label: 'Organic Whole Milk', code: '011110038334', emoji: '🥛' },
  { label: 'Thai Coconut Milk', code: '0737628064500', emoji: '🥥' },
  { label: 'McCormick Pepper', code: '052100004310', emoji: '🧂' },
];

export default function NomadBarcodeScanPage() {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<ProductInfo | null>(null);
  const [isAdded, setIsAdded] = useState(false);

  const handleLookup = async (code = barcodeInput) => {
    const target = code.trim();
    if (!target) {
      toast.error('Please enter or scan a barcode');
      return;
    }

    setIsSearching(true);
    setIsAdded(false);

    try {
      const res = await fetch(`/api/pantry/barcode?barcode=${encodeURIComponent(target)}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (data.success && data.product) {
        setScannedProduct(data.product);
        toast.success(`Recognized ${data.product.name}!`, {
          description: `Verified through ${data.source === 'open_food_facts' ? 'Open Food Facts' : 'Certified Grocery Database'}.`,
        });
      } else {
        toast.error(data.error || 'Product not recognized in database');
      }
    } catch {
      toast.error('Could not connect to barcode lookup service');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToPantry = async () => {
    if (!scannedProduct) return;

    try {
      const res = await fetch('/api/pantry/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              name: scannedProduct.name,
              category: scannedProduct.category,
              quantity: 1,
              unit: scannedProduct.servingSize || 'unit',
            },
          ],
          source: 'barcode_scanner',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsAdded(true);
        toast.success(`"${scannedProduct.name}" added to your live pantry!`, {
          description: `Expected shelf-life: ~${scannedProduct.shelfLifeDays} days.`,
        });
      }
    } catch {
      toast.error('Failed to sync to pantry');
    }
  };

  return (
    <div className="min-h-screen p-4 pb-24 md:pb-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/nomad/dashboard">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span>Dashboard</span>
          </Button>
        </Link>
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
          <QrCode className="w-3.5 h-3.5 mr-1" />
          Nomad Barcode Scanner v1.0
        </Badge>
      </div>

      {/* Main Barcode Card */}
      <Card className="border shadow-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500/10 via-primary/5 to-transparent pb-4">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Barcode className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Universal Barcode & Product Lookup</span>
          </CardTitle>
          <CardDescription>
            Scan any UPC/EAN barcode to pull verified nutritional macros, processing classifications (Nova), and safe storage limits.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Barcode Input Form */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Enter 12 or 13 digit UPC / EAN..."
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
                className="font-mono text-sm pl-9"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <Button
              onClick={() => handleLookup()}
              disabled={isSearching}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5"
            >
              {isSearching ? 'Scanning...' : 'Lookup'}
            </Button>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Quick Test Samples:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_QUICK_SCANS.map(item => (
                <Button
                  key={item.code}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBarcodeInput(item.code);
                    handleLookup(item.code);
                  }}
                  className="text-xs h-8"
                >
                  <span className="mr-1.5">{item.emoji}</span>
                  <span>{item.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Scanned Result Display */}
          <AnimatePresence>
            {scannedProduct && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-5 rounded-2xl border bg-muted/20 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge variant="secondary" className="text-[11px] mb-1">
                      {scannedProduct.brand} • {scannedProduct.category}
                    </Badge>
                    <h3 className="text-xl font-bold text-foreground leading-tight">
                      {scannedProduct.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Serving: {scannedProduct.servingSize}
                    </p>
                  </div>

                  <div className="text-right">
                    <Badge className="bg-emerald-600 text-white text-xs font-mono font-bold">
                      Nutri-Score: {scannedProduct.nutriscore}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">Nova Group {scannedProduct.novaGroup}</p>
                  </div>
                </div>

                {/* Macro Grid */}
                <div className="grid grid-cols-4 gap-2 text-center py-2 border-y bg-background/60 rounded-xl">
                  <div className="p-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Calories</span>
                    <p className="text-base font-extrabold text-foreground">{scannedProduct.calories}</p>
                  </div>
                  <div className="p-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Protein</span>
                    <p className="text-base font-extrabold text-foreground">{scannedProduct.protein}g</p>
                  </div>
                  <div className="p-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Carbs</span>
                    <p className="text-base font-extrabold text-foreground">{scannedProduct.carbs}g</p>
                  </div>
                  <div className="p-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Fat</span>
                    <p className="text-base font-extrabold text-foreground">{scannedProduct.fat}g</p>
                  </div>
                </div>

                {/* Storage & Allergen Notice */}
                <div className="text-xs space-y-2">
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span><strong>Optimal Storage:</strong> {scannedProduct.storageTip}</span>
                  </div>

                  {scannedProduct.allergens.length > 0 && (
                    <div className="flex items-start gap-2 text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span><strong>Allergen Alerts:</strong> {scannedProduct.allergens.join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Add to Pantry Button */}
                <Button
                  onClick={handleAddToPantry}
                  disabled={isAdded}
                  className={`w-full font-bold h-11 rounded-xl shadow-lg transition-all ${
                    isAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      <span>Saved to Pantry!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      <span>Add to Pantry ({scannedProduct.shelfLifeDays}d Shelf-Life)</span>
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
