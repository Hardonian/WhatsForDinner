'use client';

export const dynamic = 'force-dynamic';


import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  published_at: string;
  reading_time: number;
  category: string;
  featured_image?: string;
}

// Sample blog posts (in production, these would come from a CMS or database)
const SAMPLE_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'What to Make with Chicken and Rice: 10 Instant Recipes',
    excerpt: 'Stuck with chicken and rice? Get 10 delicious recipe ideas that use these pantry staples in creative ways.',
    slug: 'what-to-make-with-chicken-and-rice',
    published_at: '2025-01-27',
    reading_time: 5,
    category: 'Recipes',
  },
  {
    id: '2',
    title: 'Pantry Staples: 20 Meals from Ingredients You Already Have',
    excerpt: 'Transform common pantry items into delicious meals. No grocery trip required—just creativity and these recipes.',
    slug: 'pantry-staples-20-meals',
    published_at: '2025-01-26',
    reading_time: 8,
    category: 'Meal Planning',
  },
  {
    id: '3',
    title: 'How to Reduce Food Waste: Use What You Bought',
    excerpt: 'Learn how to reduce food waste by using ingredients you already have. Tips and recipes to make the most of your pantry.',
    slug: 'how-to-reduce-food-waste',
    published_at: '2025-01-25',
    reading_time: 6,
    category: 'Tips',
  },
  {
    id: '4',
    title: 'Quick Dinner Ideas with 5 Ingredients',
    excerpt: 'Short on time and ingredients? These 5-ingredient recipes prove you don\'t need a full pantry to make great meals.',
    slug: 'quick-dinner-ideas-5-ingredients',
    published_at: '2025-01-24',
    reading_time: 4,
    category: 'Quick Meals',
  },
  {
    id: '5',
    title: 'What to Make When You Have Nothing in the Fridge',
    excerpt: 'When your fridge is empty, your pantry can still save the day. Discover recipes that work with shelf-stable ingredients.',
    slug: 'recipes-with-nothing-in-fridge',
    published_at: '2025-01-23',
    reading_time: 7,
    category: 'Pantry Cooking',
  },
  {
    id: '6',
    title: 'Keto Recipes with Pantry Staples',
    excerpt: 'Following a keto diet? Here are delicious keto-friendly recipes you can make with common pantry ingredients.',
    slug: 'keto-recipes-pantry-staples',
    published_at: '2025-01-22',
    reading_time: 6,
    category: 'Diet-Specific',
  },
];

export default function BlogPage() {
  const [user, setUser] = useState<unknown>(null);
  const [posts, setPosts] = useState<BlogPost[]>(SAMPLE_POSTS);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Recipe Blog
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Meal planning tips, recipe ideas, and pantry cooking inspiration
          </p>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow border-2">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{post.category}</Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {post.reading_time} min
                  </div>
                </div>
                <CardTitle className="text-xl">{post.title}</CardTitle>
                <CardDescription className="mt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    {new Date(post.published_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                >
                  Read more
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto border-2 bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-2">Want More Recipe Ideas?</h2>
              <p className="text-muted-foreground mb-6">
                Get personalized recipe suggestions based on your pantry
              </p>
              <Link href="/">
                <Button size="lg" className="gap-2">
                  Try What's for Dinner?
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
