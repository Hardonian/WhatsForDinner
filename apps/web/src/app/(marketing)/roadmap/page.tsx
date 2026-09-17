'use client';

export const dynamic = 'force-dynamic';


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, Sparkles, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'planned';
  category: 'feature' | 'improvement' | 'integration';
  targetDate?: string;
}

const ROADMAP_ITEMS: RoadmapItem[] = [
  // Completed Milestones (Live in Current Release)
  {
    id: '1',
    title: 'OmniCart Multi-Retailer Grocery Export',
    description: 'Deep-link basket creation with store-brand price arbitrage for Instacart, Walmart, Kroger, and Amazon Fresh.',
    status: 'completed',
    category: 'integration',
    targetDate: 'v2.1 (Current Release)',
  },
  {
    id: '2',
    title: 'OmniChef™ Kitchen HUD & Speech Recognition',
    description: 'Hands-free voice cooking assistant with Web Speech API, wake lock prevention, and auditory countdown alarms.',
    status: 'completed',
    category: 'feature',
    targetDate: 'v2.1 (Current Release)',
  },
  {
    id: '3',
    title: 'Culinary Git™ Branching & Creator Royalties',
    description: 'Fork recipes, swap ingredients, remix cooking styles, track semantic diffs, and earn 30% creator grocery royalties.',
    status: 'completed',
    category: 'feature',
    targetDate: 'v2.1 (Current Release)',
  },
  {
    id: '4',
    title: '64-Dimensional Vector Neural RAG Database',
    description: 'Unit-normalized semantic culinary vector space grounded by Escoffier, TheMealDB, and Blue Zones longevity datasets.',
    status: 'completed',
    category: 'feature',
    targetDate: 'v2.1 (Current Release)',
  },
  {
    id: '5',
    title: 'Universal Barcode & Offscreen Vision Scanner',
    description: 'Client-side canvas pre-compression and Open Food Facts barcode lookup with Nova classification and macro extraction.',
    status: 'completed',
    category: 'improvement',
    targetDate: 'v2.1 (Current Release)',
  },
  {
    id: '6',
    title: 'Self-Serve Stripe Billing & PDF Invoicing',
    description: 'Live customer portal, checkout sessions, custom byte-streamed PDF receipts, and automated 30-day refunds.',
    status: 'completed',
    category: 'integration',
    targetDate: 'v2.1 (Current Release)',
  },
  {
    id: '7',
    title: 'PWA Offline Mode & Ambient Kitchen Sync',
    description: 'Service worker asset caching and floating real-time network connectivity HUD for uninterrupted kitchen cooking.',
    status: 'completed',
    category: 'improvement',
    targetDate: 'v2.1 (Current Release)',
  },

  // In Progress (Next Release - v2.2)
  {
    id: '8',
    title: 'Smart Kitchen IoT & Bluetooth Probe Sync',
    description: 'Web Bluetooth API pairing with MEATER and ThermoPro probes to auto-advance HUD steps upon USDA safe internal temp.',
    status: 'in_progress',
    category: 'integration',
    targetDate: 'v2.2 (Q4 2026)',
  },
  {
    id: '9',
    title: 'Live WebRTC Shelf Vision & Video Scanning',
    description: 'Continuous video stream scanning using on-device WebAssembly YOLO models to auto-inventory fridge shelves in real time.',
    status: 'in_progress',
    category: 'feature',
    targetDate: 'v2.2 (Q4 2026)',
  },
  {
    id: '10',
    title: 'Multiplayer Kitchen Sync (Live WebSockets)',
    description: 'Multi-device family cooking sync: one cook on appetizers, one on main, with shared synchronized timers.',
    status: 'in_progress',
    category: 'feature',
    targetDate: 'v2.2 (Q4 2026)',
  },

  // Planned (Future Releases - v2.3 & v3.0)
  {
    id: '11',
    title: 'Predictive Auto-Replenishment Engine',
    description: 'Household consumption velocity modeling that auto-stages pantry essentials into grocery carts before they deplete.',
    status: 'planned',
    category: 'feature',
    targetDate: 'v2.3 (Q1 2027)',
  },
  {
    id: '12',
    title: 'Clinical Dietetics & Wearable CGM Sync',
    description: 'Sync with Apple Health, Oura, and continuous glucose monitors (CGMs) to calibrate meal macros to metabolic recovery.',
    status: 'planned',
    category: 'integration',
    targetDate: 'v2.3 (Q1 2027)',
  },
  {
    id: '13',
    title: 'Enterprise Healthcare & Institutional Wellness',
    description: 'FHIR/HL7 electronic medical records integration generating medically tailored meals for clinical health plans.',
    status: 'planned',
    category: 'integration',
    targetDate: 'v3.0 (Q2 2027)',
  },
];

export default function RoadmapPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const completedItems = ROADMAP_ITEMS.filter(item => item.status === 'completed');
  const inProgressItems = ROADMAP_ITEMS.filter(item => item.status === 'in_progress');
  const plannedItems = ROADMAP_ITEMS.filter(item => item.status === 'planned');

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-8 sm:py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Product Roadmap
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See what we're building next and help shape our future
          </p>
        </div>

        {/* In Progress */}
        <div className="space-y-6 mb-12">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">In Progress</h2>
            <Badge variant="outline">{inProgressItems.length}</Badge>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {inProgressItems.map((item) => (
              <Card key={item.id} className="border-2 border-primary/20 bg-primary/5">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="capitalize">{item.category}</Badge>
                    <Badge variant="default" className="bg-primary">
                      <Clock className="h-3 w-3 mr-1" />
                      In Progress
                    </Badge>
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  {item.targetDate && (
                    <CardDescription>Target: {item.targetDate}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Planned */}
        <div className="space-y-6 mb-12">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Planned</h2>
            <Badge variant="outline">{plannedItems.length}</Badge>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plannedItems.map((item) => (
              <Card key={item.id} className="border-2">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="capitalize">{item.category}</Badge>
                    <Badge variant="outline">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Planned
                    </Badge>
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  {item.targetDate && (
                    <CardDescription>Target: {item.targetDate}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Completed */}
        {completedItems.length > 0 && (
          <div className="space-y-6 mb-12">
            <div className="flex items-center gap-3">
              <Check className="h-6 w-6 text-green-600" />
              <h2 className="text-2xl font-bold">Recently Completed</h2>
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400">
                {completedItems.length}
              </Badge>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {completedItems.map((item) => (
                <Card key={item.id} className="border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="capitalize">{item.category}</Badge>
                      <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <Check className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                    <CardTitle>{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <Card className="border-2 bg-gradient-to-br from-primary/5 to-background">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Have a Feature Request?</h2>
            <p className="text-muted-foreground mb-6">
              We'd love to hear your ideas! Your feedback helps shape our roadmap.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/support">
                <Button variant="outline">
                  Submit Feedback
                </Button>
              </Link>
              <Link href="/">
                <Button className="gap-2">
                  Try What's for Dinner?
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}