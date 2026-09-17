'use client';

export const dynamic = 'force-dynamic';


import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import { EmailCapture } from '@/components/EmailCapture';
import { analytics } from '@/lib/analytics';
import { 
  Dumbbell, 
  Target, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  Activity,
  TrendingUp,
  Clock
} from 'lucide-react';

export default function ForFitnessPage() {
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const handleEmailSubmit = async () => {
    await analytics.trackEvent('email_captured', {
      source: 'for-fitness-landing',
      page: 'for-fitness',
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
              <Dumbbell className="h-4 w-4 mr-2" />
              For Fitness Communities
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Fuel Your Fitness Goals
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Meal prep recipes with macros, protein focus, and athlete-friendly ingredients.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/" onClick={() => analytics.trackEvent('cta_clicked', { location: 'hero', page: 'for-fitness' })}>
                  Try It Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                See Features
              </Button>
            </div>
          </div>
        </section>

        {/* Pain Points */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Fitness Meal Prep Challenges
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    Time Consuming
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Meal prep takes too long. Our AI generates macro-friendly meal plans in 30 seconds.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-red-500" />
                    Macro Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Tracking macros is hard. Get recipes with macros displayed—calories, protein, carbs, fat.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 text-blue-500" />
                    High Protein Needs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Need high-protein recipes? Filter by protein content and get athlete-approved meal ideas.
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
              Built for Athletes & Fitness Enthusiasts
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              Everything you need for fitness meal planning
            </p>

            <div className="space-y-6">
              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle>High-Protein Recipes</CardTitle>
                      <p className="text-muted-foreground mt-2">
                        Filter recipes by protein content. Get high-protein meal ideas perfect for bulking, cutting, or maintaining.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Activity className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle>Macro-Friendly Meal Prep</CardTitle>
                      <p className="text-muted-foreground mt-2">
                        See macros per recipe: calories, protein, carbs, fat. Plan meals that fit your fitness goals.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle>Fitness Goals Mode</CardTitle>
                      <p className="text-muted-foreground mt-2">
                        Select your goal: bulk, cut, or maintain. Get recipes optimized for your fitness journey.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle>Meal Prep Batch Cooking</CardTitle>
                      <p className="text-muted-foreground mt-2">
                        Generate 7-day meal prep plans. Batch cook on weekends, eat healthy all week.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Integration */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Integrate with Fitness Apps
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>MyFitnessPal Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Export recipes with macros to MyFitnessPal. Plan meals in our app, track macros in MyFitnessPal.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Sync meal plans</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Export macros</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gym Partnerships</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Partner with gyms and fitness centers. Offer free premium accounts to members.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">CrossFit</Badge>
                    <Badge variant="outline">24 Hour Fitness</Badge>
                    <Badge variant="outline">Planet Fitness</Badge>
                    <Badge variant="outline">Local Gyms</Badge>
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
              Ready to Fuel Your Fitness Goals?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join athletes using AI to plan macro-friendly meals and meal prep.
            </p>
            
            {!emailSubmitted ? (
              <EmailCapture
                title=""
                description=""
                cta="Get Started Free"
                source="for-fitness-landing"
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
          </div>
        </section>
      </main>
    </div>
  );
}
