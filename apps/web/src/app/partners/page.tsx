'use client';
/**
 * Partner Program Page
 * Enterprise and strategic partnership opportunities
 */

import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('page');



import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/supabase-js';
import {
  Building2,
  TrendingUp,
  Users,
  Handshake,
  DollarSign,
  Check,
  ArrowRight,
  Star,
  Zap,
  Award,
  Globe,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

interface PartnerTier {
  name: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'enterprise';
  revenue_share: number;
  minimum_commitment: number | null;
  benefits: string[];
  color: string;
}

const partnerTiers: PartnerTier[] = [
  {
    name: 'Bronze',
    tier: 'bronze',
    revenue_share: 5,
    minimum_commitment: 1000,
    benefits: [
      '5% revenue share',
      'Co-marketing opportunities',
      'Dedicated support',
      'API access',
      'Marketing materials'
    ],
    color: 'bg-orange-100 dark:bg-orange-950'
  },
  {
    name: 'Silver',
    tier: 'silver',
    revenue_share: 10,
    minimum_commitment: 5000,
    benefits: [
      '10% revenue share',
      'Priority support',
      'Custom integrations',
      'White-label options',
      'Dedicated account manager',
      'Co-marketing campaigns'
    ],
    color: 'bg-gray-100 dark:bg-gray-800'
  },
  {
    name: 'Gold',
    tier: 'gold',
    revenue_share: 15,
    minimum_commitment: 25000,
    benefits: [
      '15% revenue share',
      'VIP support',
      'Custom pricing',
      'Early feature access',
      'Partner portal',
      'Sales training',
      'Joint go-to-market'
    ],
    color: 'bg-yellow-100 dark:bg-yellow-950'
  },
  {
    name: 'Platinum',
    tier: 'platinum',
    revenue_share: 20,
    minimum_commitment: 100000,
    benefits: [
      '20% revenue share',
      'Executive sponsor',
      'Co-branded solutions',
      'Market development funds',
      'Exclusive events',
      'Product roadmap input',
      'Strategic planning'
    ],
    color: 'bg-purple-100 dark:bg-purple-950'
  },
  {
    name: 'Enterprise',
    tier: 'enterprise',
    revenue_share: 25,
    minimum_commitment: null,
    benefits: [
      '25% revenue share',
      'Custom agreements',
      'Dedicated team',
      'Exclusive territories',
      'Co-innovation programs',
      'Board-level engagement',
      'Strategic equity considerations'
    ],
    color: 'bg-blue-100 dark:bg-blue-950'
  }
];

export default function PartnerProgramPage() {
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    website_url: '',
    partner_type: '',
    expected_volume: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
      if (authUser?.email) {
        setFormData(prev => ({
          ...prev,
          contact_email: authUser.email || ''
        }));
      }
    };
    void loadUser();
  }, [supabase]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create partner inquiry
      const { error } = await supabase
        .from('partners')
        .insert({
          company_name: formData.company_name,
          contact_name: formData.contact_name,
          contact_email: formData.contact_email,
          website_url: formData.website_url || null,
          partner_type: formData.partner_type || 'strategic',
          status: 'prospect',
          metadata: {
            expected_volume: formData.expected_volume,
            message: formData.message
          }
        });

      if (error) {
        _logger.error('Failed to submit partner inquiry:', { error: error instanceof Error ? error.message : String(error) });
        alert('Failed to submit. Please try again.');
      } else {
        alert('Thank you! We\'ll contact you within 24-48 hours to discuss partnership opportunities.');
        setFormData({
          company_name: '',
          contact_name: '',
          contact_email: user?.email || '',
          website_url: '',
          partner_type: '',
          expected_volume: '',
          message: ''
        });
      }
    } catch (error) {
      _logger.error('Error submitting form:', { error: error instanceof Error ? error.message : String(error) });
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, user, supabase]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
          <Handshake className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Partner Program
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Strategic partnerships that drive mutual growth. Revenue sharing, co-marketing, 
          and integrated solutions for enterprise partners.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <DollarSign className="w-4 h-4 mr-2" />
            Up to 25% Revenue Share
          </Badge>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Users className="w-4 h-4 mr-2" />
            Co-Marketing Support
          </Badge>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Zap className="w-4 h-4 mr-2" />
            Custom Integrations
          </Badge>
        </div>
      </div>

      {/* Partner Types */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Partnership Types</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { type: 'Strategic', icon: Building2, desc: 'Long-term strategic partnerships' },
            { type: 'Technology', icon: Zap, desc: 'Technical integrations and APIs' },
            { type: 'Distribution', icon: Globe, desc: 'Channel and distribution partners' },
            { type: 'Integration', icon: BarChart3, desc: 'Platform and tool integrations' }
          ].map(({ type, icon: Icon, desc }) => (
            <Card key={type} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Icon className="w-8 h-8 text-primary mb-2" />
                <CardTitle>{type} Partner</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Partner Tiers */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-4">Partner Tiers</h2>
        <p className="text-center text-muted-foreground mb-12">
          Choose the partnership level that matches your scale and goals
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partnerTiers.map((tier) => (
            <Card key={tier.tier} className={`${tier.color} border-2 hover:shadow-xl transition-all`}>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <Badge variant="outline" className="text-lg">
                    {tier.revenue_share}%
                  </Badge>
                </div>
                {tier.minimum_commitment && (
                  <CardDescription>
                    Min. commitment: ${tier.minimum_commitment.toLocaleString()}/month
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {tier.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={tier.tier === 'enterprise' ? 'default' : 'outline'}>
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="mb-16 bg-muted/50 rounded-2xl p-12">
        <h2 className="text-3xl font-bold text-center mb-12">Why Partner With Us?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold text-xl mb-2">Proven Track Record</h3>
            <p className="text-muted-foreground">
              12,847+ active users, 4.8/5 rating, growing 40% month-over-month
            </p>
          </div>
          <div className="text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold text-xl mb-2">Dedicated Support</h3>
            <p className="text-muted-foreground">
              Dedicated account managers, technical support, and marketing resources
            </p>
          </div>
          <div className="text-center">
            <Award className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold text-xl mb-2">Mutual Growth</h3>
            <p className="text-muted-foreground">
              Revenue sharing, co-marketing, and strategic alignment for long-term success
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Partner Interest Form</CardTitle>
            <CardDescription>
              Tell us about your company and partnership goals. We'll respond within 24-48 hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Company Name *
                  </label>
                  <Input
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Your Company"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Contact Name *
                  </label>
                  <Input
                    required
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="Your Name"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Email *
                </label>
                <Input
                  type="email"
                  required
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Website URL
                </label>
                <Input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://yourcompany.com"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Partner Type
                  </label>
                  <select
                    value={formData.partner_type}
                    onChange={(e) => setFormData({ ...formData, partner_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select type...</option>
                    <option value="strategic">Strategic</option>
                    <option value="technology">Technology</option>
                    <option value="distribution">Distribution</option>
                    <option value="integration">Integration</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Expected Monthly Volume
                  </label>
                  <Input
                    value={formData.expected_volume}
                    onChange={(e) => setFormData({ ...formData, expected_volume: e.target.value })}
                    placeholder="$10,000+"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Tell us about your partnership goals
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md min-h-[120px]"
                  placeholder="How would you like to partner with us?..."
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Partnership Inquiry'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* CTA Section */}
      <div className="mt-16 text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-12">
        <h2 className="text-3xl font-bold mb-4">Ready to Grow Together?</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join our partner program and unlock new revenue streams while helping users 
          discover better meal planning.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="#contact-form">
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/docs/partnership">
              View Partnership Guide
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}