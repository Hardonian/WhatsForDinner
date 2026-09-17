export const dynamic = 'force-dynamic';

/**
 * Marketing Landing Page
 * 
 * High-converting landing page with all marketing components
 */

import { HeroSection } from '@/components/marketing/HeroSection';
import { FeaturesSection } from '@/components/marketing/FeaturesSection';
import { TestimonialsSection } from '@/components/marketing/TestimonialsSection';
import { PricingSection } from '@/components/marketing/PricingSection';

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      
      {/* Final CTA Section */}
      <section className="bg-primary py-20 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-4xl font-bold md:text-5xl">
            Ready to Transform Your Meal Planning?
          </h2>
          <p className="mb-8 text-xl opacity-90">
            Join thousands of families saving time and eating better
          </p>
          <a
            href="/auth/signup"
            className="inline-block rounded-lg bg-background px-8 py-4 text-lg font-semibold text-primary transition-all hover:scale-105"
          >
            Start Free Today →
          </a>
        </div>
      </section>
    </main>
  );
}
