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
  Stethoscope, 
  Users, 
  ClipboardCheck, 
  CheckCircle2, 
  ArrowRight,
  Shield,
  TrendingUp,
  Heart
} from 'lucide-react';

export default function ForHealthcarePage() {
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const handleEmailSubmit = async () => {
    await analytics.trackEvent('email_captured', {
      source: 'for-healthcare-landing',
      page: 'for-healthcare',
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
              <Stethoscope className="h-4 w-4 mr-2" />
              For Healthcare Providers
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Support Patient Nutrition Goals
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Meal planning tools for nutrition counseling and patient care. HIPAA-compliant and secure.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/" onClick={() => analytics.trackEvent('cta_clicked', { location: 'hero', page: 'for-healthcare' })}>
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
              Healthcare Nutrition Challenges
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Patient Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Patients don't follow meal plans. Our tools make meal planning easy and accessible.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-green-500" />
                    Support Tools
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Need easy meal planning tools. Provide patients with accessible nutrition support.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    Nutrition Counseling
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Nutrition counseling needs support. Give patients tools to succeed between appointments.
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
              Built for Healthcare Providers
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              Everything you need for patient nutrition support
            </p>

            <div className="space-y-6">
              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Stethoscope className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle>Healthcare Provider Dashboard</CardTitle>
                      <p className="text-muted-foreground mt-2">
                        Track patient progress, view meal plans, and monitor nutrition goals. Comprehensive patient insights.
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
                      <CardTitle>Patient Referral System</CardTitle>
                      <p className="text-muted-foreground mt-2">
                        Refer patients to meal planning. Track referrals and patient engagement. 20% commission for providers.
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
                      <CardTitle>Progress Tracking</CardTitle>
                      <p className="text-muted-foreground mt-2">
                        Track patient meals, nutrition goals, and progress over time. See what's working.
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
                      <CardTitle>HIPAA-Compliant</CardTitle>
                      <p className="text-muted-foreground mt-2">
                        Fully HIPAA-compliant solution. Protect patient health data with enterprise-grade security.
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
              Free for Healthcare Providers
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-primary border-2">
                <CardHeader>
                  <Badge className="mb-2">Best Value</Badge>
                  <CardTitle>Free for Providers</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold mb-2">Free</div>
                  <p className="text-muted-foreground mb-4">
                    Free premium accounts for healthcare providers
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Provider dashboard</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Patient referral system</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Progress tracking</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">HIPAA-compliant</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Patient Referral Program</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold mb-2">20% Commission</div>
                  <p className="text-muted-foreground mb-4">
                    Earn commission on patient referrals
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Track referrals</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Monitor patient engagement</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Monthly payouts</span>
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
              Ready to Support Patient Nutrition Goals?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join healthcare providers using meal planning tools for patient care.
            </p>
            
            {!emailSubmitted ? (
              <EmailCapture
                title=""
                description=""
                cta="Get Started Free"
                source="for-healthcare-landing"
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
                Questions? Contact us at <a href="mailto:healthcare@whatsfordinner.com" className="text-primary hover:underline">healthcare@whatsfordinner.com</a>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}