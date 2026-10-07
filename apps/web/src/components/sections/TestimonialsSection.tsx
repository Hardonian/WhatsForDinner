"use client";
import { Card, CardContent } from "@/components/ui/card";
import InViewReveal from "@/components/motion/InViewReveal";
import StaggerList from "@/components/motion/StaggerList";

const testimonials = [
  {
    quote: "Hardonia delivers an exceptional user experience with attention to every detail.",
    author: "Sarah Johnson",
    role: "Product Manager",
  },
  {
    quote: "The performance and accessibility standards are top-notch. Highly recommended!",
    author: "Michael Chen",
    role: "Developer",
  },
  {
    quote: "Finally, a platform that values both design and functionality equally.",
    author: "Emily Rodriguez",
    role: "Designer",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 md:py-32 bg-muted/50">
      <div className="container">
        <InViewReveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Loved by users
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              See what people are saying about Hardonia
            </p>
          </div>
        </InViewReveal>
        <StaggerList className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <InViewReveal key={index} delay={index * 0.1}>
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4 text-lg">&quot;{testimonial.quote}&quot;</p>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            </InViewReveal>
          ))}
        </StaggerList>
      </div>
    </section>
  );
}
