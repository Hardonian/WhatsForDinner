/**
 * Testimonials Section Component
 * 
 * Social proof to build trust and drive conversions
 */

'use client';

import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah M.',
    role: 'Busy Mom of 3',
    image: '/avatars/sarah.jpg',
    rating: 5,
    text: "This app has completely changed how I plan meals. I save at least 2 hours every week, and my kids actually eat what I make now!",
    highlight: 'Saves 2+ hours per week',
  },
  {
    name: 'Mike R.',
    role: 'Health Enthusiast',
    image: '/avatars/mike.jpg',
    rating: 5,
    text: "The nutrition tracking is incredible. I've been hitting my macros consistently for the first time ever. Game changer!",
    highlight: 'Hits macros consistently',
  },
  {
    name: 'Jennifer L.',
    role: 'Working Professional',
    image: '/avatars/jennifer.jpg',
    rating: 5,
    text: "I used to waste so much food. Now I only buy what I need, and the meal suggestions are always delicious. Love it!",
    highlight: 'Reduced food waste by 40%',
  },
  {
    name: 'David K.',
    role: 'College Student',
    image: '/avatars/david.jpg',
    rating: 5,
    text: "As a student on a budget, this app helps me eat well without breaking the bank. The quick meal ideas are perfect for my schedule.",
    highlight: 'Eats well on a budget',
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-muted/50 py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-4xl font-bold md:text-5xl">
            Loved by Thousands of Families
          </h2>
          <p className="mb-16 text-xl text-muted-foreground">
            See what real users are saying
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="group relative rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-lg"
            >
              <Quote className="absolute right-4 top-4 h-8 w-8 text-primary/20" />
              
              <div className="mb-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60" />
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>

              <div className="mb-3 flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="mb-3 text-muted-foreground">&quot;{testimonial.text}&quot;</p>
              
              <div className="rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                {testimonial.highlight}
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badge */}
        <div className="mt-12 text-center">
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            Trusted by families across the country
          </p>
          <div className="flex items-center justify-center gap-8 text-2xl font-bold text-muted-foreground">
            <div>10K+</div>
            <div className="h-8 w-px bg-border" />
            <div>4.9★</div>
            <div className="h-8 w-px bg-border" />
            <div>98%</div>
          </div>
          <div className="mt-2 flex items-center justify-center gap-8 text-xs text-muted-foreground">
            <div>Active Users</div>
            <div>Average Rating</div>
            <div>Would Recommend</div>
          </div>
        </div>
      </div>
    </section>
  );
}
