// Structured data (JSON-LD) component for recipes
'use client';

import { Recipe } from '@whats-for-dinner/utils';

interface RecipeStructuredDataProps {
  recipe: any;
  url?: string;
}

export function RecipeStructuredData({ recipe = {}, url }: { recipe?: any; url?: string }) {
  const prepMinutes = typeof recipe.prepTime === 'number' ? recipe.prepTime : parseInt(String(recipe.prepTime)) || 0;
  const cookMinutes = typeof recipe.cookTime === 'number' ? recipe.cookTime : parseInt(String(recipe.cookTime)) || 0;

  const structuredData = {
    '@context': 'https://schema.org/',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.description || `${recipe.title} recipe`,
    image: recipe.imageUrl || (recipe as any).image || `${typeof window !== 'undefined' ? window.location.origin : ''}/recipe-placeholder.jpg`,
    author: {
      '@type': 'Organization',
      name: "What's for Dinner?",
      url: 'https://whatsfordinner.com',
    },
    publisher: {
      '@type': 'Organization',
      name: "What's for Dinner?",
      url: 'https://whatsfordinner.com',
    },
    logo: {
      '@type': 'ImageObject',
      url: 'https://whatsfordinner.com/icon-512x512.png',
    },
    datePublished: new Date().toISOString(),
    prepTime: recipe.prepTime ? `PT${prepMinutes}M` : undefined,
    cookTime: recipe.cookTime ? `PT${cookMinutes}M` : undefined,
    totalTime: (prepMinutes || cookMinutes)
      ? `PT${prepMinutes + cookMinutes}M` 
      : undefined,
    recipeYield: recipe.servings || '4',
    recipeIngredient: recipe.ingredients || [],
    recipeInstructions: recipe.instructions 
      ? recipe.instructions.map((step, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          text: step,
        }))
      : [],
    nutrition: recipe.nutrition ? {
      '@type': 'NutritionInformation',
      calories: recipe.nutrition.calories,
      proteinContent: (recipe.nutrition as any).protein ? `${(recipe.nutrition as any).protein}g` : undefined,
      carbohydrateContent: (recipe.nutrition as any).carbs ? `${(recipe.nutrition as any).carbs}g` : undefined,
      fatContent: (recipe.nutrition as any).fat ? `${(recipe.nutrition as any).fat}g` : undefined,
      fiberContent: (recipe.nutrition as any).fiber ? `${(recipe.nutrition as any).fiber}g` : undefined,
      sugarContent: (recipe.nutrition as any).sugar ? `${(recipe.nutrition as any).sugar}g` : undefined,
      sodiumContent: (recipe.nutrition as any).sodium ? `${(recipe.nutrition as any).sodium}mg` : undefined,
    } : undefined,
    url: url || (typeof window !== 'undefined' ? window.location.href : ''),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData, null, 2) }}
    />
  );
}

// Website structured data (server component)
export function WebsiteStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org/',
    '@type': 'WebSite',
    name: "What's for Dinner?",
    url: 'https://whatsfordinner.com',
    description: 'AI-powered meal planning app that suggests recipes based on ingredients you already have',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://whatsfordinner.com/?ingredients={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: "What's for Dinner?",
      logo: {
        '@type': 'ImageObject',
        url: 'https://whatsfordinner.com/icon-512x512.png',
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData, null, 2) }}
    />
  );
}

// Organization structured data (server component)
export function OrganizationStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org/',
    '@type': 'Organization',
    name: "What's for Dinner?",
    url: 'https://whatsfordinner.com',
    logo: 'https://whatsfordinner.com/icon-512x512.png',
    description: 'AI-powered meal planning app that helps reduce food waste and save time',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@whatsfordinner.com',
    },
    sameAs: [
      // Add social media URLs when available
      // 'https://twitter.com/whatsfordinner',
      // 'https://facebook.com/whatsfordinner',
      // 'https://instagram.com/whatsfordinner',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData, null, 2) }}
    />
  );
}

// Breadcrumb structured data
export function BreadcrumbStructuredData({ items }: { items: Array<{ name: string; url: string }> }) {
  const structuredData = {
    '@context': 'https://schema.org/',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData, null, 2) }}
    />
  );
}

export default RecipeStructuredData;
