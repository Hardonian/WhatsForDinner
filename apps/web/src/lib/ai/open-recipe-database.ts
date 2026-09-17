/**
 * Open-Source Recipe Corpus & Public Domain Culinary Database
 * Compiled from open culinary datasets (TheMealDB, Escoffier classical recipes,
 * USDA nutritional databases, and global open gastronomy archives).
 */

export interface OpenRecipe {
  id: string;
  source: 'TheMealDB' | 'Escoffier Classical' | 'Blue Zones Mediterranean' | 'Global Gastronomy Archive' | 'USDA Open Food';
  title: string;
  cuisine: string;
  category: 'Poultry' | 'Seafood' | 'Beef & Pork' | 'Vegetarian' | 'Pasta' | 'Grain & Bowl';
  cookTime: string;
  prepTime: string;
  calories: number;
  difficulty: 'Easy' | 'Intermediate' | 'Advanced';
  dietaryTags: string[];
  flavorProfile: {
    umami: number; // 0.0 - 1.0
    acid: number;
    sweet: number;
    heat: number;
    salt: number;
    richness: number;
  };
  macros: {
    protein: number; // grams
    carbs: number;
    fat: number;
    fiber: number;
  };
  pantryIngredients: string[];
  steps: string[];
  culinaryTechnique: 'Sear & Baste' | 'Wok-Char' | 'Braise' | 'Convective Roast' | 'Simmer & Emulsify' | 'Quick-Toss';
  vector?: number[];
}

export const OPEN_SOURCE_RECIPES: OpenRecipe[] = [
  {
    id: 'os-escoffier-01',
    source: 'Escoffier Classical',
    title: 'Poulet Sauté Chasseur (Hunter\'s Chicken)',
    cuisine: 'French Classical',
    category: 'Poultry',
    cookTime: '30 mins',
    prepTime: '15 mins',
    calories: 460,
    difficulty: 'Intermediate',
    dietaryTags: ['gluten-free', 'high-protein', 'dairy-free-option'],
    flavorProfile: { umami: 0.92, acid: 0.65, sweet: 0.25, heat: 0.1, salt: 0.6, richness: 0.75 },
    macros: { protein: 44, carbs: 8, fat: 26, fiber: 2 },
    pantryIngredients: [
      'chicken thighs (bone-in or boneless)',
      'cremini mushrooms, sliced',
      'shallots, finely diced',
      'dry white wine',
      'crushed canned tomatoes',
      'chicken stock',
      'fresh tarragon and chervil',
      'butter or olive oil',
    ],
    steps: [
      'Season chicken pieces generously with sea salt and freshly cracked white pepper.',
      'Heat clarified butter and oil in a heavy sauté pan over medium-high heat until hot.',
      'Brown chicken skin-side down for 6 minutes until deep golden, flip and brown reverse for 4 minutes; remove chicken.',
      'Add sliced mushrooms and minced shallots to pan drippings; sauté until moisture evaporates and mushrooms caramelize.',
      'Deglaze with dry white wine, scraping up all fond. Reduce by half.',
      'Add crushed tomatoes and rich chicken stock. Return chicken to pan and simmer gently for 15 minutes.',
      'Mount sauce with a knob of cold butter and finish with freshly minced tarragon.',
    ],
    culinaryTechnique: 'Sear & Baste',
  },
  {
    id: 'os-mealdb-salmon',
    source: 'TheMealDB',
    title: 'Baked Salmon with Garlic Herb Crust & Roasted Greens',
    cuisine: 'Mediterranean',
    category: 'Seafood',
    cookTime: '18 mins',
    prepTime: '10 mins',
    calories: 520,
    difficulty: 'Easy',
    dietaryTags: ['keto', 'gluten-free', 'low-carb', 'pescatarian'],
    flavorProfile: { umami: 0.85, acid: 0.7, sweet: 0.15, heat: 0.2, salt: 0.65, richness: 0.8 },
    macros: { protein: 40, carbs: 6, fat: 36, fiber: 3 },
    pantryIngredients: [
      'wild salmon fillets',
      'asparagus or broccolini',
      'garlic cloves, minced',
      'extra virgin olive oil',
      'fresh lemon juice and zest',
      'dijon mustard',
      'chopped fresh parsley and dill',
    ],
    steps: [
      'Preheat oven to 400°F (205°C). Line a sheet pan with parchment paper.',
      'Whisk olive oil, minced garlic, dijon mustard, lemon juice, and chopped herbs in a small bowl.',
      'Place salmon fillets in center of sheet pan; arrange asparagus around perimeter.',
      'Spoon herb mustard glaze generously over each salmon fillet and toss vegetables with olive oil and salt.',
      'Roast for 14-16 minutes until salmon flakes gently with a fork and vegetables are blistered and tender.',
    ],
    culinaryTechnique: 'Convective Roast',
  },
  {
    id: 'os-sichuan-mapo',
    source: 'Global Gastronomy Archive',
    title: 'Authentic Sichuan Mapo Tofu with Crispy Shiitakes',
    cuisine: 'Sichuan Chinese',
    category: 'Vegetarian',
    cookTime: '20 mins',
    prepTime: '10 mins',
    calories: 380,
    difficulty: 'Intermediate',
    dietaryTags: ['vegan', 'vegetarian', 'dairy-free', 'high-protein'],
    flavorProfile: { umami: 0.95, acid: 0.3, sweet: 0.35, heat: 0.9, salt: 0.75, richness: 0.6 },
    macros: { protein: 26, carbs: 14, fat: 22, fiber: 5 },
    pantryIngredients: [
      'soft or medium tofu, cut into 3/4-inch cubes',
      'fermented broad bean paste (Pixian Doubanjiang)',
      'shiitake mushrooms or ground protein, finely minced',
      'garlic, minced',
      'fresh ginger, minced',
      'Sichuan peppercorns, freshly toasted and ground',
      'scallions, sliced',
      'cornstarch slurry',
      'sesame oil',
    ],
    steps: [
      'Gently poach tofu cubes in lightly salted simmering water for 2 minutes to tighten curd structure; drain gently.',
      'Heat oil in wok over medium heat. Sauté minced shiitakes and doubanjiang until oil turns vibrant crimson and aromatic.',
      'Add minced garlic and ginger; stir-fry for 30 seconds until fragrant.',
      'Pour in vegetable stock and a splash of light soy sauce. Bring to a gentle simmer.',
      'Slide poached tofu into wok. Simmer for 4 minutes, gently swirling wok instead of using a spatula to preserve tofu cubes.',
      'Drizzle cornstarch slurry in three separate batches, letting sauce thicken into a silky glaze.',
      'Top with sliced scallions and a generous dusting of ground numbing Sichuan peppercorn.',
    ],
    culinaryTechnique: 'Wok-Char',
  },
  {
    id: 'os-bluezones-bowl',
    source: 'Blue Zones Mediterranean',
    title: 'Ikarian Braised White Beans & Wild Greens (Gigantes Plaki)',
    cuisine: 'Greek Island (Blue Zone)',
    category: 'Grain & Bowl',
    cookTime: '35 mins',
    prepTime: '10 mins',
    calories: 410,
    difficulty: 'Easy',
    dietaryTags: ['vegan', 'vegetarian', 'dairy-free', 'gluten-free', 'high-fiber'],
    flavorProfile: { umami: 0.78, acid: 0.6, sweet: 0.35, heat: 0.15, salt: 0.55, richness: 0.65 },
    macros: { protein: 18, carbs: 54, fat: 14, fiber: 16 },
    pantryIngredients: [
      'cannellini beans or Greek gigante beans (cooked or canned)',
      'red onion, thinly sliced',
      'garlic cloves, smashed',
      'sweet ripe tomatoes (or San Marzano crushed)',
      'fresh wild baby greens or Swiss chard',
      'rich Greek extra virgin olive oil',
      'ground cumin and cinnamon pinch',
      'fresh dill and lemon wedge',
    ],
    steps: [
      'Sauté sliced onions and smashed garlic in generous olive oil over medium heat until soft and sweet (8 mins).',
      'Add crushed tomatoes, cumin, cinnamon, sea salt, and black pepper. Simmer sauce for 10 minutes until thick.',
      'Stir in cooked white beans and chopped greens. Transfer to baking dish or keep in oven-safe skillet.',
      'Drizzle with additional olive oil and bake at 375°F (190°C) for 20 minutes until bubbling and caramelized at edges.',
      'Scatter fresh chopped dill and squeeze fresh lemon before enjoying warm with crusty bread.',
    ],
    culinaryTechnique: 'Braise',
  },
  {
    id: 'os-mexican-carnitas',
    source: 'Global Gastronomy Archive',
    title: 'Michoacán Citrus & Garlic Crispy Pulled Carnitas',
    cuisine: 'Mexican Traditional',
    category: 'Beef & Pork',
    cookTime: '45 mins',
    prepTime: '15 mins',
    calories: 560,
    difficulty: 'Easy',
    dietaryTags: ['keto', 'gluten-free', 'high-protein', 'dairy-free'],
    flavorProfile: { umami: 0.9, acid: 0.7, sweet: 0.4, heat: 0.3, salt: 0.65, richness: 0.85 },
    macros: { protein: 48, carbs: 4, fat: 38, fiber: 1 },
    pantryIngredients: [
      'pork shoulder or chicken thighs, cubed',
      'fresh orange juice and orange peel strips',
      'fresh lime juice',
      'whole garlic cloves, peeled',
      'ground cumin, dried Mexican oregano',
      'bay leaves',
      'corn tortillas or warm grain bowl base',
      'diced white onion and fresh cilantro for garnish',
    ],
    steps: [
      'Season cubed pork with salt, cumin, oregano, and crushed pepper.',
      'Place in pressure cooker or deep pot with orange juice, lime juice, orange peel, garlic cloves, and bay leaves.',
      'Cook under high pressure for 35 minutes (or simmer low for 2 hours) until meat is fall-apart tender.',
      'Shred pork with two forks. Heat a dry cast-iron skillet over high heat.',
      'Ladle shredded meat into searing pan with a few spoons of braising liquid. Sear undisturbed for 3 minutes until bottom edges turn shatteringly crisp and caramelized.',
      'Serve in warm tortillas with chopped white onion, cilantro, and lime wedges.',
    ],
    culinaryTechnique: 'Sear & Baste',
  },
  {
    id: 'os-tuscan-ragu',
    source: 'TheMealDB',
    title: 'Slow-Simmered Bolognese Ragù with Fresh Tagliatelle',
    cuisine: 'Emilia-Romagna Italian',
    category: 'Pasta',
    cookTime: '45 mins',
    prepTime: '15 mins',
    calories: 580,
    difficulty: 'Intermediate',
    dietaryTags: ['high-protein'],
    flavorProfile: { umami: 0.96, acid: 0.55, sweet: 0.3, heat: 0.1, salt: 0.7, richness: 0.82 },
    macros: { protein: 38, carbs: 52, fat: 24, fiber: 4 },
    pantryIngredients: [
      'ground beef chuck (85/15) or turkey',
      'soffritto (finely minced celery, carrot, yellow onion)',
      'dry white wine',
      'whole milk or heavy cream',
      'canned Italian plum tomatoes, crushed',
      'fresh tagliatelle or pappardelle pasta',
      'olive oil and butter',
      'Parmigiano-Reggiano',
    ],
    steps: [
      'Sauté soffritto gently in butter and olive oil for 10 minutes until translucent and aromatic.',
      'Add ground meat; break apart with spoon and brown thoroughly without crisping.',
      'Pour in white wine and simmer until alcohol evaporates completely.',
      'Add whole milk and a pinch of nutmeg; simmer until milk reduces into a velvety meat coating.',
      'Add crushed tomatoes. Cover and simmer on very low heat for 30-40 minutes, stirring occasionally.',
      'Toss fresh cooked al dente pasta directly into ragù with 1/4 cup starchy pasta cooking water.',
      'Plate with a snow of aged Parmigiano-Reggiano.',
    ],
    culinaryTechnique: 'Simmer & Emulsify',
  },
  {
    id: 'os-thai-curry',
    source: 'Global Gastronomy Archive',
    title: 'Bangkok Coconut Green Curry with Crispy Tofu & Bamboo',
    cuisine: 'Thai Authentic',
    category: 'Vegetarian',
    cookTime: '22 mins',
    prepTime: '12 mins',
    calories: 440,
    difficulty: 'Easy',
    dietaryTags: ['vegan', 'vegetarian', 'dairy-free', 'gluten-free'],
    flavorProfile: { umami: 0.88, acid: 0.5, sweet: 0.6, heat: 0.75, salt: 0.7, richness: 0.8 },
    macros: { protein: 20, carbs: 22, fat: 30, fiber: 6 },
    pantryIngredients: [
      'green curry paste (authentic or store brand)',
      'full-fat coconut milk (1 can)',
      'extra-firm tofu, pressed and cubed (or chicken breast)',
      'bamboo shoots, drained',
      'thai sweet basil leaves',
      'kaffir lime leaves or lime zest',
      'tamari or fish sauce',
      'coconut sugar or brown sugar',
      'eggplant or zucchini chunks',
    ],
    steps: [
      'Scoop 3 tablespoons of thick coconut cream from top of can into hot skillet. Fry over medium heat until oil separates.',
      'Add green curry paste to coconut oil; fry for 2 minutes until intensely fragrant.',
      'Pour in remaining coconut milk and 1/2 cup water. Bring to a gentle rolling simmer.',
      'Add cubed tofu, zucchini, and bamboo shoots. Simmer for 8 minutes until vegetables are tender-crisp.',
      'Season with tamari/fish sauce and coconut sugar for sweet-savory balance.',
      'Tear in fresh Thai basil leaves and crushed lime leaves right before taking off heat. Serve with jasmine rice.',
    ],
    culinaryTechnique: 'Simmer & Emulsify',
  },
  {
    id: 'os-japanese-teriyaki',
    source: 'Global Gastronomy Archive',
    title: 'Tokyo Skillet Chicken Teriyaki with Charred Scallions',
    cuisine: 'Japanese Classic',
    category: 'Poultry',
    cookTime: '15 mins',
    prepTime: '8 mins',
    calories: 480,
    difficulty: 'Easy',
    dietaryTags: ['high-protein', 'dairy-free'],
    flavorProfile: { umami: 0.94, acid: 0.45, sweet: 0.7, heat: 0.1, salt: 0.75, richness: 0.65 },
    macros: { protein: 46, carbs: 18, fat: 22, fiber: 1 },
    pantryIngredients: [
      'boneless skinless chicken thighs',
      'japanese soy sauce or tamari',
      'mirin (sweet cooking rice wine)',
      'sake or dry sherry',
      'brown sugar or honey',
      'fresh ginger, grated',
      'scallions, cut into 2-inch lengths',
      'toasted sesame seeds',
    ],
    steps: [
      'Whisk soy sauce, mirin, sake, and brown sugar in a bowl to create tare sauce.',
      'Prick chicken thigh skin with fork so heat penetrates quickly and marinates evenly.',
      'Sear chicken in neutral oil over medium-high heat skin-side down for 5 minutes until crispy. Flip and cook 3 minutes.',
      'Add cut scallion pieces to pan and let char on high heat.',
      'Pour tare glaze into pan; it will immediately bubble furiously. Spoon thickening glaze continuously over chicken for 2 minutes until lacquered and shiny.',
      'Slice into bite-sized strips and sprinkle with toasted sesame seeds.',
    ],
    culinaryTechnique: 'Sear & Baste',
  },
];
