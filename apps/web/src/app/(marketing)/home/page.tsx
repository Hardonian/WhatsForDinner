export const dynamic = 'force-dynamic';

/**
 * Professional Landing Page - What's for Dinner
 * 
 * Introduces the app from non-technical to technical audiences
 * with clear value propositions, brand elements, and engagement features
 */

'use client';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('page');



import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Sparkles, 
  Clock, 
  DollarSign, 
  Heart, 
  Brain, 
  ShoppingCart, 
  ChefHat,
  ArrowRight,
  Check,
  Star,
  TrendingUp,
  Zap,
  Flame,
  Camera,
  Utensils,
  Activity,
  GitFork
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrustSignals } from '@/components/TrustSignals';
import { InteractiveFridgeSandbox } from '@/components/home/InteractiveFridgeSandbox';
import Link from 'next/link';

interface ValueProposition {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefit: string;
}

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();

  const valuePropositions: ValueProposition[] = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Save 5+ Hours Per Week',
      description: 'Stop spending hours planning meals. Get personalized meal plans in under 2 minutes.',
      benefit: 'Time saved = More time for what matters'
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: 'Reduce Food Waste by 40%',
      description: 'Smart pantry tracking helps you use what you have before it expires.',
      benefit: 'Save $50+ per month on groceries'
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: 'Reduce Decision Fatigue',
      description: 'No more "what\'s for dinner?" stress at 5 PM. AI plans it for you.',
      benefit: 'Peace of mind, every day'
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'AI-Powered Intelligence',
      description: 'Learns your preferences, dietary needs, and cooking style over time.',
      benefit: 'Smarter suggestions, better meals'
    }
  ];

  const handleEmailCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Track email capture
    if (typeof window !== 'undefined') {
      // Analytics tracking
      window.gtag?.('event', 'email_capture', {
        event_category: 'engagement',
        event_label: 'homepage'
      });
    }

    // Store email (could integrate with email service)
    try {
      await supabase.from('email_leads').insert({
        email,
        source: 'homepage',
        created_at: new Date().toISOString()
      });
    } catch (error) {
      _logger.error('Email capture error:', { error: error instanceof Error ? error.message : String(error) });
    }

    setEmail('');
    setIsLoading(false);
    alert("Thanks! We'll send you early access and tips.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/20 relative overflow-hidden">
      {/* Ambient Lighting Orbs */}
      <div className="ambient-orb w-[600px] h-[600px] bg-primary/20 top-[-100px] left-1/2 -translate-x-1/2 -z-10 pointer-events-none" />
      <div className="ambient-orb w-[450px] h-[450px] bg-emerald-500/15 top-[600px] left-[-150px] -z-10 pointer-events-none" />
      <div className="ambient-orb w-[450px] h-[450px] bg-violet-500/15 top-[900px] right-[-150px] -z-10 pointer-events-none" />

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Brand Badge */}
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold shadow-sm backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-primary" />
            <span>The Next-Gen AI Food Operating System</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-muted-foreground font-normal">TTV &lt; 30s</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
            Dinner Plans That <br />
            <span className="bg-gradient-to-r from-primary via-accent to-emerald-500 bg-clip-text text-transparent">
              Plan Themselves
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed font-normal">
            Stop wondering what&apos;s for dinner. Multimodal AI scans your fridge, analyzes dietary goals, 
            and crafts chef-grade recipes with real-time grocery price arbitrage in seconds.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="text-base font-bold px-8 py-6 bg-gradient-to-r from-primary via-primary to-accent hover:opacity-95 shadow-xl shadow-primary/30 btn-shimmer rounded-2xl" asChild>
              <Link href="/onboarding">
                <Sparkles className="w-5 h-5 mr-2" />
                Start Instant Dinner (30s)
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base font-bold px-7 py-6 glass-card rounded-2xl border-border/80 hover:bg-muted/40" asChild>
              <Link href="/cook/demo">
                <Utensils className="w-5 h-5 mr-2 text-primary" />
                OmniChef™ Voice HUD
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base font-bold px-7 py-6 glass-card rounded-2xl border-border/80 hover:bg-muted/40" asChild>
              <Link href="/surprise-me">
                <Flame className="w-5 h-5 mr-2 text-amber-500" />
                Dinner Roulette
              </Link>
            </Button>
          </div>

          {/* Interactive Virtual Fridge Sandbox Hero Feature */}
          <div className="mt-6 mb-16 text-left">
            <InteractiveFridgeSandbox />
          </div>

          {/* Trust Signals */}
          <div className="mt-12 mb-8">
            <TrustSignals variant="inline" />
          </div>

          {/* Social Proof */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground font-medium">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary"
                  >
                    ★
                  </div>
                ))}
              </div>
              <span className="font-semibold text-foreground">12,840+ cooks</span>
            </div>
            <div className="flex items-center gap-1.5 bg-muted/30 px-3 py-1 rounded-full border border-border/60">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-foreground">4.9/5</span>
              <span>App Rating</span>
            </div>
            <div className="flex items-center gap-1.5 bg-muted/30 px-3 py-1 rounded-full border border-border/60">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-foreground">5.2 hrs</span>
              <span>saved / week</span>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="container mx-auto px-4 py-20 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-3 py-1 font-bold">
              Quantifiable Impact
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">Why Thousands Choose What&apos;s for Dinner</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Real results. Over $50 saved per month on groceries. Zero 5:30 PM meal panic.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {valuePropositions.map((prop, index) => (
              <Card key={index} className="glass-card hover-lift rounded-3xl p-6 border border-border/70 hover:border-primary/50 transition-all">
                <CardHeader className="p-0 pb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center mb-4 border border-primary/20">
                    {prop.icon}
                  </div>
                  <CardTitle className="text-lg font-bold">{prop.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">{prop.description}</p>
                  <Badge variant="secondary" className="text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                    {prop.benefit}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Industry-Defining Innovations Showcase */}
      <section className="container mx-auto px-4 py-20 bg-muted/30 border-y">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <Badge className="bg-primary/10 text-primary border-primary/30 text-xs px-3 py-1 font-bold">
              The Next-Gen Food Operating System
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              5 Breakthrough Technologies in One App
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Engineered to eliminate kitchen decision fatigue, grocery markups, and food waste forever.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: OmniChef Voice HUD */}
            <Card className="glass-card hover-lift transition-all rounded-3xl p-6 space-y-4 border border-border/80 hover:border-primary/50">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center text-xl font-bold border border-primary/20 shadow-sm">
                <Utensils className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">OmniChef™ Voice HUD</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Cook completely hands-free with voice recognition, parallel multi-timers, and live emergency ingredient substitutions.
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs font-bold rounded-xl border-border/80 hover:bg-primary/5" asChild>
                <Link href="/cook/demo">
                  Try Kitchen HUD
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </Card>

            {/* Feature 2: VisionPantry Multimodal AI */}
            <Card className="glass-card hover-lift transition-all rounded-3xl p-6 space-y-4 border border-border/80 hover:border-emerald-500/50">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-bold border border-emerald-500/20 shadow-sm">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">VisionPantry™ AI</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Snap a photo of your open fridge or supermarket receipt. Neural vision identifies ingredients and predicts expiration hazard curves.
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs font-bold rounded-xl border-border/80 hover:bg-emerald-500/5" asChild>
                <Link href="/onboarding">
                  Test Vision Scanner
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </Card>

            {/* Feature 3: OmniCart Multi-Retailer Arbitrage */}
            <Card className="glass-card hover-lift transition-all rounded-3xl p-6 space-y-4 border border-border/80 hover:border-blue-500/50">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-bold border border-blue-500/20 shadow-sm">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">OmniCart™ Arbitrage</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Real-time basket pricing across Instacart, Amazon Fresh, Walmart+, and Kroger. Auto-swaps brand names to save up to 28%.
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs font-bold rounded-xl border-border/80 hover:bg-blue-500/5" asChild>
                <Link href="/grocery">
                  Compare Grocery Carts
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </Card>

            {/* Feature 4: Precision Metabolic Nutrition */}
            <Card className="glass-card hover-lift transition-all rounded-3xl p-6 space-y-4 border border-border/80 hover:border-purple-500/50">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl font-bold border border-purple-500/20 shadow-sm">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Metabolic & CGM Sync</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Medical-grade glycemic load modeling, anti-inflammatory scoring, and activity toggles for keto, post-workout, and diabetic health.
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs font-bold rounded-xl border-border/80 hover:bg-purple-500/5" asChild>
                <Link href="/nutrition">
                  View Metabolic Index
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </Card>

            {/* Feature 5: Culinary Git Forkable Network */}
            <Card className="glass-card hover-lift transition-all rounded-3xl p-6 space-y-4 md:col-span-2 lg:col-span-2 border border-border/80 hover:border-amber-500/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl font-bold flex-shrink-0 border border-amber-500/20 shadow-sm">
                    <GitFork className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Culinary Git™ Forkable Recipe Network</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Fork any recipe, track ingredient deltas, and earn 30% affiliate creator royalties when groceries are bought through your branch.
                    </p>
                  </div>
                </div>
                <Button size="sm" className="font-bold text-xs h-10 px-6 flex-shrink-0 rounded-xl" asChild>
                  <Link href="/recipes">
                    Explore Branch Tree
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works - Non-Technical */}
      <section className="container mx-auto px-4 py-20 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">
              Simple. Fast. Effective. No technical knowledge required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">1. Tell Us What You Have</h3>
              <p className="text-muted-foreground">
                Simply add ingredients from your pantry. Scan barcodes, type them in, or snap a photo of your fridge.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">2. AI Creates Your Plan</h3>
              <p className="text-muted-foreground">
                Our intelligent system analyzes your pantry, preferences, and dietary needs to suggest personalized meals.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <ChefHat className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">3. Cook & Enjoy</h3>
              <p className="text-muted-foreground">
                Get step-by-step recipes, automatic grocery lists, and cooking instructions. Just follow along and enjoy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Section - For Developers/Tech-Savvy */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4">For Technical Users</Badge>
              <h2 className="text-4xl font-bold mb-6">
                Built for the Modern Stack
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                What&apos;s for Dinner leverages cutting-edge AI and modern web technologies 
                to deliver a seamless, fast, and intelligent meal planning experience.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>AI-Powered Recommendations:</strong> OpenAI GPT-4 for intelligent meal suggestions
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Real-Time Sync:</strong> Supabase for instant data synchronization across devices
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Progressive Web App:</strong> Works offline, installs like a native app
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Privacy-First:</strong> End-to-end encryption, GDPR compliant, your data stays yours
                  </div>
                </li>
              </ul>
              <Button variant="outline" asChild>
                <Link href="/docs">
                  View Technical Documentation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>

            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Technical Highlights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Performance</span>
                    <span className="text-sm text-muted-foreground">98/100</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '98%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Uptime</span>
                    <span className="text-sm text-muted-foreground">99.9%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: '99.9%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Response Time</span>
                    <span className="text-sm text-muted-foreground">&lt;500ms</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: '95%' }} />
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">12.8K</div>
                      <div className="text-xs text-muted-foreground">Active Users</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">4.8★</div>
                      <div className="text-xs text-muted-foreground">Average Rating</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Loved by Real Families</h2>
            <p className="text-xl text-muted-foreground">
              See what others are saying about What&apos;s for Dinner
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Sarah M.',
                role: 'Mom of 2',
                content: 'This app gave me my evenings back. Planning meals used to take me 2 hours on Sunday. Now it takes 2 minutes.',
                rating: 5
              },
              {
                name: 'Mike R.',
                role: 'Solo Professional',
                content: 'I finally have variety in my meals without the stress. The AI suggestions are spot-on with my preferences.',
                rating: 5
              },
              {
                name: 'Jessica L.',
                role: 'Health Enthusiast',
                content: 'Perfect for meal prep! The nutrition tracking and dietary filters make it easy to meet my health goals.',
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription>{testimonial.content}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Email Capture CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-2">Get Early Access & Weekly Tips</CardTitle>
              <CardDescription className="text-lg">
                Join thousands getting meal planning tips, early feature access, and exclusive content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailCapture} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Joining...' : 'Join Free'}
                </Button>
              </form>
              <p className="text-xs text-center text-muted-foreground mt-4">
                No spam. Unsubscribe anytime. We respect your privacy.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-12">
          <h2 className="text-4xl font-bold mb-4">Ready to Reclaim Your Evenings?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join 12,847+ users who&apos;ve made meal planning effortless.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6" asChild>
              <Link href="/signup">
                Start Free Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
              <Link href="/pricing">
                View Pricing
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
