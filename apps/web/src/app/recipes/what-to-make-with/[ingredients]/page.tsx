export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import RecipeSuggestions from '@/components/RecipeSuggestions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PageProps {
  params: {
    ingredients: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const ingredients = decodeURIComponent(params.ingredients).replace(/-/g, ' ');
  const title = `What to Make with ${ingredients} - Recipe Ideas | What's for Dinner`;
  const description = `Get personalized recipe suggestions using ${ingredients}. AI-powered meal planning that starts with what you have.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function WhatToMakeWithPage({ params }: PageProps) {
  const ingredients = decodeURIComponent(params.ingredients).replace(/-/g, ', ');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
      <div className="container mx-auto max-w-6xl space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">
            What to Make with {ingredients}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Get personalized recipe suggestions based on what you have in your pantry.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recipe Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <RecipeSuggestions ingredients={ingredients.split(', ')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Get More Recipe Ideas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Want unlimited recipe suggestions? Sign up for free and get personalized meal planning
              based on your pantry, dietary preferences, and cooking style.
            </p>
            <a
              href="/auth"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Sign Up Free
            </a>
          </CardContent>
        </Card>

        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Recipe',
              name: `Recipes with ${ingredients}`,
              description: `Personalized recipe suggestions using ${ingredients}`,
              recipeIngredient: ingredients.split(', '),
            }),
          }}
        />
      </div>
    </div>
  );
}
