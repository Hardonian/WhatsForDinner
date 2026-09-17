export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowLeft, Share2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import SocialShare from '@/components/SocialShare';
import EmailCapture from '@/components/EmailCapture';
import { sanitizeForReact } from '@/lib/sanitize';

// In production, this would fetch from a CMS or database
const POSTS: Record<string, {
  title: string;
  content: string;
  excerpt: string;
  published_at: string;
  reading_time: number;
  category: string;
}> = {
  'what-to-make-with-chicken-and-rice': {
    title: 'What to Make with Chicken and Rice: 10 Instant Recipes',
    excerpt: 'Stuck with chicken and rice? Get 10 delicious recipe ideas that use these pantry staples in creative ways.',
    published_at: '2025-01-27',
    reading_time: 5,
    category: 'Recipes',
    content: `
# What to Make with Chicken and Rice: 10 Instant Recipes

Chicken and rice are pantry staples in most households. Here are 10 creative recipes to transform these simple ingredients into delicious meals.

## 1. Chicken and Rice Casserole
A comforting one-pot meal that's perfect for busy weeknights. Mix cooked rice, diced chicken, vegetables, and a creamy sauce, then bake until golden.

## 2. Chicken Fried Rice
Give your leftover rice new life with this classic stir-fry. Add scrambled eggs, soy sauce, and vegetables for a complete meal.

## 3. Chicken and Rice Soup
A nourishing soup that's perfect for cold days. Simmer chicken, rice, and vegetables in a flavorful broth.

## 4. Chicken and Rice Bowl
Layer cooked rice with seasoned chicken, fresh vegetables, and your favorite sauce for a healthy, balanced meal.

## 5. Chicken and Rice Stuffed Peppers
Hollow out bell peppers and stuff them with a mixture of chicken, rice, and herbs. Bake until tender.

## 6. Chicken and Rice Burrito Bowl
Mexican-inspired flavors with chicken, rice, beans, and toppings. Customize with your favorite salsa and guacamole.

## 7. Chicken and Rice Risotto
A creamy Italian dish that's easier than it looks. Slowly cook the rice with chicken stock and finish with Parmesan.

## 8. Chicken and Rice Stuffed Cabbage
Roll seasoned chicken and rice mixture in cabbage leaves and simmer in tomato sauce.

## 9. Chicken and Rice Paella
A simplified version of the Spanish classic. Saffron, chicken, rice, and vegetables combine for a vibrant dish.

## 10. Chicken and Rice Pilaf
Toast the rice with spices, then cook with chicken and stock for a fragrant, flavorful meal.

## Tips for Success

- Use leftover cooked chicken and rice for quick meals
- Experiment with different spices and seasonings
- Add vegetables for extra nutrition and flavor
- Make extra and freeze for future meals

Ready to try these recipes? Get personalized suggestions based on what's in your pantry with What's for Dinner?
    `,
  },
  'pantry-staples-20-meals': {
    title: 'Pantry Staples: 20 Meals from Ingredients You Already Have',
    excerpt: 'Transform common pantry items into delicious meals. No grocery trip required—just creativity and these recipes.',
    published_at: '2025-01-26',
    reading_time: 8,
    category: 'Meal Planning',
    content: `
# Pantry Staples: 20 Meals from Ingredients You Already Have

Your pantry is a treasure trove of meal possibilities. Here are 20 recipes that use common pantry staples.

## Breakfast Ideas
1. Oatmeal with dried fruits and nuts
2. Pancakes from scratch
3. French toast with bread and eggs
4. Granola with oats and honey

## Lunch Options
5. Pasta with canned tomatoes
6. Bean and rice burritos
7. Tuna salad sandwiches
8. Lentil soup with vegetables

## Dinner Recipes
9. Spaghetti with marinara
10. Rice and beans
11. Mac and cheese
12. Vegetable stir-fry with rice

## Snacks and Sides
13. Homemade crackers
14. Roasted chickpeas
15. Trail mix
16. Popcorn with seasoning

## Desserts
17. Rice pudding
18. Chocolate chip cookies
19. Bread pudding
20. Oatmeal cookies

Stock your pantry with these staples and never wonder what to make again!
    `,
  },
};

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = POSTS[params.slug];

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={null} />

      <main className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        {/* Back Link */}
        <Link href="/blog" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        {/* Article Header */}
        <div className="space-y-4 mb-8">
          <Badge variant="outline">{post.category}</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold">{post.title}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date(post.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {post.reading_time} min read
            </div>
          </div>
        </div>

        {/* Article Content */}
        <Card className="border-2 mb-8">
          <CardContent className="pt-6 prose prose-slate dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={sanitizeForReact(post.content.split('\n').map(para => {
              if (para.startsWith('# ')) {
                return `<h1>${para.slice(2)}</h1>`;
              } else if (para.startsWith('## ')) {
                return `<h2>${para.slice(3)}</h2>`;
              } else if (para.startsWith('### ')) {
                return `<h3>${para.slice(4)}</h3>`;
              } else if (para.trim()) {
                return `<p>${para}</p>`;
              }
              return '';
            }).join(''))} />
          </CardContent>
        </Card>

        {/* Share Section */}
        <Card className="border-2 mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-2">Share this article</h3>
                <p className="text-sm text-muted-foreground">Help others discover these recipes</p>
              </div>
              <SocialShare
                title={post.title}
                description={post.excerpt}
                url={`${typeof window !== 'undefined' ? window.location.origin : ''}/blog/${params.slug}`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Capture */}
        <EmailCapture
          title="Get More Recipe Ideas"
          description="Join our newsletter for weekly meal planning tips and recipe inspiration"
          source="blog_post"
        />

        {/* CTA */}
        <Card className="border-2 bg-gradient-to-br from-primary/5 to-background mt-8">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Try What's for Dinner?</h2>
            <p className="text-muted-foreground mb-6">
              Get personalized recipe suggestions based on your pantry
            </p>
            <Link href="/">
              <Button size="lg">
                Get Started Free
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
