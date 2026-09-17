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
  Heart, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Brain,
  Activity,
  Shield
} from 'lucide-react';

export default function ForWellnessPage() {
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const handleEmailSubmit = async () => {
    await analytics.trackEvent('email_captured', {
      source: 'for-wellness-landing',
      page: 'for-wellness',
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
              <Heart className="h-4 w-4 mr-2" />
              For Wellness Platforms
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Complete Your Wellness Journey
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Meal planning reduces stress and supports your health goals. Stress-free nutrition in 30 seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/" onClick={() => analytics.trackEvent('cta_clicked', { location: 'hero', page: 'for-wellness' })}>
                  Try It Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Pain Points */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Wellness Includes Nutrition
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    Stress Reduction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Meal planning is stressful. Our AI makes it stress-free, so you can focus on your wellness goals.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-500" />
                    Healthy Choices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Eat healthy without the guesswork. Get nutrition-focused recipes that support your wellness journey.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    Time Saved
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Save 15+ minutes per meal. More time for meditation, exercise, and self-care.
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
              Built for Wellness
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              Everything you need for stress-free meal planning
            </p>

            <div className="space-y-6">
              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Heart className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle>Stress-Free Meal Planning</CardTitle>
                      <p className="text-muted-foreground mt-2">
                        Get meal ideas in 30 seconds. No decision fatigue, no stress—just healthy recipes.
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
                      <CardTitle>Healthy Recipe Suggestions</CardTitle>
                      <p className="text-muted-foreground mt-2">
                        Nutrition-focused recipes that support your wellness goals. Balanced, healthy, and delicious.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle>Wellness App Integration</CardTitle>
                      <p className="text-muted-foreground mt-2">
                        Integrate with Headspace, Calm, Noom, and other wellness platforms. Complete your wellness routine.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Brain className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle>Mindful Eating Prompts</CardTitle>
                      <p className="text-muted-foreground mt-2">
                        Take a breath before planning. Mindfulness prompts integrated into meal planning flow.
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
              Integrate with Your Wellness Platform
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>White-Label Solution</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Integrate meal planning into your wellness platform with our API and white-label solution.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Custom branding</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">API integration</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Revenue share model</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Partners</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Partner with leading wellness platforms to offer meal planning to your users.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Headspace</Badge>
                    <Badge variant="outline">Calm</Badge>
                    <Badge variant="outline">Noom</Badge>
                    <Badge variant="outline">MyFitnessPal</Badge>
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
              Ready to Complete Your Wellness Journey?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands using AI to plan healthy meals and reduce stress.
            </p>
            
            {!emailSubmitted ? (
              <EmailCapture
                title=""
                description=""
                cta="Get Started Free"
                source="for-wellness-landing"
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
