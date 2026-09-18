export const CREDIT_PACKS = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    credits: 10,
    price: 4.99,
    description: '10 AI recipe & image generation credits',
  },
  popular: {
    id: 'popular',
    name: 'Sous Chef Pack',
    credits: 25,
    price: 9.99,
    popular: true,
    description: '25 AI recipe, image & pantry scan credits',
  },
  pro_pack: {
    id: 'pro_pack',
    name: 'Executive Chef Pack',
    credits: 50,
    price: 17.99,
    description: '50 AI credits with priority high-res image generation',
  },
  chef_bundle: {
    id: 'chef_bundle',
    name: 'Culinary Master Bundle',
    credits: 150,
    price: 44.99,
    badge: 'Best Value',
    description: '150 AI credits - maximum culinary freedom and bulk meal plans',
  },
} as const;

export type CreditPackId = keyof typeof CREDIT_PACKS;

export const MARKETPLACE_PACKS: Record<string, { id: string; name: string; price: number; description: string }> = {
  'quick-easy': {
    id: 'quick-easy',
    name: 'Quick & Easy Meals Pack',
    price: 4.99,
    description: '50 recipes ready in 30 minutes or less',
  },
  'meal-prep': {
    id: 'meal-prep',
    name: 'Meal Prep Master Pack',
    price: 6.99,
    description: '30 recipes perfect for weekly batch cooking',
  },
  'international': {
    id: 'international',
    name: 'International Cuisine Pack',
    price: 7.99,
    description: '40 recipes from around the world with authentic flavors',
  },
  'kid-friendly': {
    id: 'kid-friendly',
    name: 'Kid-Friendly Favorites Pack',
    price: 5.99,
    description: '35 recipes approved by picky eaters',
  },
};
