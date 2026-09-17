'use client';

export const dynamic = 'force-dynamic';


import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import { EmailCapture } from '@/components/EmailCapture';
import { SocialShare } from '@/components/SocialShare';
import { analytics } from '@/lib/analytics';
import { 
  Heart, 
  Clock, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  ChefHat,
  Baby,
  Utensils
} from 'lucide-react';

export default function ForFamiliesPage() {
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const handleEmailSubmit = async () => {
    await analytics.trackEvent('email_captured', {
      source: 'for-families-landing',
      page: 'for-families',
    });
    setEmailSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={null} />
      
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-primary/5 py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center space-y-6">
            <Badge variant="outline" className="mb-4">
              <Baby className="h-4 w-4 mr-2" />
              For Busy Families
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Stop Fighting with Picky Eaters
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Get kid-approved recipes from ingredients you already have—in 30 seconds. Save 15 minutes per meal.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/" onClick={() => analytics.trackEvent('cta_clicked', { location: 'hero', page: 'for-families' })}>
                  Try It Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                See How It Works
              </Button>
            </div>

            {/* Social Proof */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">10,000+</div>
                <div className="text-sm text-muted-foreground">Recipes Generated</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">15 min</div>
                <div className="text-sm text-muted-foreground">Saved Per Meal</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">30 sec</div>
                <div className="text-sm text-muted-foreground">To Get Ideas</div>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              We Get It. Meal Planning with Kids Is Hard.
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    Picky Eaters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    "My kids won't eat what I cook" is a daily struggle. Our AI suggests kid-friendly recipes that actually get eaten.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    Time Crunch
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Spend 20 minutes deciding what to make? We do it in 30 seconds, so you can spend time with family instead.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    Budget Stress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Stop wasting money on groceries kids don't eat. Use what you already have, reduce waste by 30%.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-4">
              Designed for Busy Families
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              Everything you need to make meal planning stress-free
            </p>

            <div className="space-y-6">
              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Utensils className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle>Kid-Friendly Recipe Filter</CardTitle>
                      <p className="text-muted-foreground mt-2">
                        Filter recipes by kid-friendliness. No hidden vegetables, familiar flavors, and dishes your kids will actually eat.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle>Family Meal Planning</CardTitle>
                      <p className="text-muted-foreground mt-2">
                        Plan meals for 4+ servings. Generate recipes that feed your whole family, including picky eaters.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle>Quick Weeknight Meals</CardTitle>
                      <p className="text-muted-foreground mt-2">
                        Get dinner ideas in 30 seconds. No more staring at your pantry wondering what to make.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ChefHat className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle>Meal Prep for School Lunches</CardTitle>
                      <p className="text-muted-foreground mt-2">
                        Plan and prep school lunches that kids actually eat. Save time on busy mornings.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              How It Works
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-semibold mb-2">Add Your Pantry</h3>
                <p className="text-muted-foreground text-sm">
                  Tell us what ingredients you have. Takes 30 seconds.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="font-semibold mb-2">Get Kid-Friendly Recipes</h3>
                <p className="text-muted-foreground text-sm">
                  Our AI suggests recipes your kids will actually eat.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="font-semibold mb-2">Cook & Enjoy</h3>
                <p className="text-muted-foreground text-sm">
                  Save 15 minutes per meal, reduce waste, and enjoy family time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              What Parents Are Saying
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground italic mb-4">
                    "Finally, recipes my kids actually eat! No more dinner battles. This app saved my sanity."
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">Sarah M.</div>
                      <div className="text-sm text-muted-foreground">Mom of 3</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground italic mb-4">
                    "I save 15 minutes every night. The kid-friendly filter is a game-changer for picky eaters."
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">Mike T.</div>
                      <div className="text-sm text-muted-foreground">Dad of 2</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-primary/5">
          <div className="container mx-auto max-w-2xl text-center space-y-6">
            <h2 className="text-3xl font-bold">
              Ready to Make Meal Planning Easy?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of families using AI to plan meals their kids actually eat.
            </p>
            
            {!emailSubmitted ? (
              <EmailCapture
                title=""
                description=""
                cta="Get Started Free"
                source="for-families-landing"
                onSuccess={handleEmailSubmit}
              />
            ) : (
              <Card className="border-green-500">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Check your email to get started!</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="pt-6">
              <SocialShare
                title="What's for Dinner? - Meal Planning for Busy Families"
                description="Get kid-approved recipes from ingredients you already have—in 30 seconds."
                url={typeof window !== 'undefined' ? window.location.href : ''}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
