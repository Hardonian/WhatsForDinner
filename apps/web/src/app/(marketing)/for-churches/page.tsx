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
  Users, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  ArrowRight,
  Church,
  Utensils,
  Calendar
} from 'lucide-react';

export default function ForChurchesPage() {
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const handleEmailSubmit = async () => {
    await analytics.trackEvent('email_captured', {
      source: 'for-churches-landing',
      page: 'for-churches',
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
              <Church className="h-4 w-4 mr-2" />
              For Church Organizations
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Simplify Church Meal Planning
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Organize potlucks, community meals, and volunteer dinners—all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/" onClick={() => analytics.trackEvent('cta_clicked', { location: 'hero', page: 'for-churches' })}>
                  Get Started Free
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
              Meal Planning Challenges We Solve
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Potluck Chaos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Planning potlucks is chaotic. Our recipe sharing makes it easy to coordinate dishes and avoid duplicates.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-green-500" />
                    Volunteer Meals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Coordinate volunteer meals for families in need. Share recipes, track signups, and ensure everyone is fed.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-purple-500" />
                    Budget Friendly
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Create budget-friendly meals for church events. Generate recipes that feed 50+ people without breaking the bank.
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
              Built for Church Communities
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              Everything you need to organize church meals
            </p>

            <div className="space-y-6">
              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle>Potluck Planning</CardTitle>
                      <p className="text-muted-foreground mt-2">
                        Plan potlucks with ease. Share recipes, coordinate dishes, and avoid duplicates.
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
                      <CardTitle>Large-Batch Recipes</CardTitle>
                      <p className="text-muted-foreground mt-2">
                        Generate recipes that feed 50+ people. Perfect for church events and community meals.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Utensils className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle>Volunteer Meal Coordination</CardTitle>
                      <p className="text-muted-foreground mt-2">
                        Coordinate meals for families in need. Track volunteer signups and ensure everyone is fed.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle>Recipe Sharing</CardTitle>
                      <p className="text-muted-foreground mt-2">
                        Share favorite recipes with your church community. Build a collection of church-approved recipes.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Special Pricing for Churches
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Church Group Discount</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold mb-2">20% Off</div>
                  <p className="text-muted-foreground mb-4">
                    All church accounts receive 20% off annual plans
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Unlimited meal planning</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Recipe sharing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Large-batch recipes</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary">
                <CardHeader>
                  <Badge className="mb-2">Best Value</Badge>
                  <CardTitle>Free for Meal Ministries</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold mb-2">Free</div>
                  <p className="text-muted-foreground mb-4">
                    Free accounts for non-profit meal ministries
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">All premium features</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Unlimited recipes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Priority support</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-primary/5">
          <div className="container mx-auto max-w-2xl text-center space-y-6">
            <h2 className="text-3xl font-bold">
              Ready to Simplify Church Meal Planning?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join churches using AI to organize community meals and potlucks.
            </p>
            
            {!emailSubmitted ? (
              <EmailCapture
                title=""
                description=""
                cta="Get Started Free"
                source="for-churches-landing"
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
              <p className="text-sm text-muted-foreground">
                Questions? Contact us at <a href="mailto:churches@whatsfordinner.com" className="text-primary hover:underline">churches@whatsfordinner.com</a>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
