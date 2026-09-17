/**
 * Comprehensive Culinary Definition Glossary
 * Extensive reference for classical & global ingredients, kitchen instruments/tools, and cooking techniques.
 */

export interface GlossaryEntry {
  term: string;
  phonetic: string;
  category: 'ingredient' | 'instrument' | 'technique';
  definition: string;
  usageTip: string;
  substituteOrAlternative?: string;
  origin?: string;
}

export const CULINARY_GLOSSARY: GlossaryEntry[] = [
  // --- INGREDIENTS ---
  {
    term: 'Doubanjiang',
    phonetic: 'doh-bahn-jee-ahng',
    category: 'ingredient',
    definition: 'A rich, fermented paste made from broad beans, soybeans, salt, and fiery red chili peppers; the pungent backbone of Sichuan cooking.',
    usageTip: 'Fry in hot oil at the beginning of cooking until the oil turns fragrant and vibrant red.',
    substituteOrAlternative: 'Gochujang mixed with a pinch of miso and red pepper flakes.',
    origin: 'Pixian, Sichuan, China',
  },
  {
    term: 'Mirin',
    phonetic: 'mee-reen',
    category: 'ingredient',
    definition: 'A sweet Japanese rice cooking wine with low alcohol content and high natural sugar created through koji fermentation.',
    usageTip: 'Provides delicate luster and shine to teriyaki glazes while subduing strong fishy aromas.',
    substituteOrAlternative: 'Dry white wine or sake mixed with 1/2 tsp sugar per tablespoon.',
    origin: 'Japan',
  },
  {
    term: 'Ghee',
    phonetic: 'g-ee',
    category: 'ingredient',
    definition: 'Clarified butter simmered until all milk solids caramelize and are strained out, leaving pure golden, nutty, high-smoke-point butterfat.',
    usageTip: 'High smoke point of 485°F (250°C) makes it ideal for searing steaks and tempering spices.',
    substituteOrAlternative: 'Clarified butter or neutral avocado oil with a drop of toasted sesame oil.',
    origin: 'India',
  },
  {
    term: 'Tarragon',
    phonetic: 'tair-uh-gon',
    category: 'ingredient',
    definition: 'A delicate perennial culinary herb with an anise-like, sweet licorice herbal aroma; a cornerstone of French Béarnaise and Chasseur sauces.',
    usageTip: 'Add at the very end of cooking—high prolonged heat diminishes its volatile essential oils.',
    substituteOrAlternative: 'Fresh chervil, fennel fronds, or a small pinch of ground anise.',
    origin: 'France / Eurasia',
  },
  {
    term: 'Shallot',
    phonetic: 'shal-uht',
    category: 'ingredient',
    definition: 'A member of the allium family with clustered bulbs, offering a milder, sweeter, more complex flavor than yellow or white onions.',
    usageTip: 'Mince finely for pan pan-sauces (fond deglazing) and raw vinaigrettes.',
    substituteOrAlternative: 'Yellow onion finely minced with half a clove of garlic.',
    origin: 'Central Asia',
  },
  {
    term: 'Gochujang',
    phonetic: 'goh-choo-jahng',
    category: 'ingredient',
    definition: 'A savory, spicy, and sweet Korean fermented condiment made from chili powder, glutinous rice, fermented soybeans, and salt.',
    usageTip: 'Whisk with honey, sesame oil, and rice vinegar for marinades or dipping sauces.',
    substituteOrAlternative: 'Sriracha combined with a touch of miso paste and brown sugar.',
    origin: 'Korea',
  },
  {
    term: 'Sumac',
    phonetic: 'soo-mak',
    category: 'ingredient',
    definition: 'A deep crimson spice ground from wild dried berries, prized for its tart, fruity, astringent acidity similar to fresh lemon juice.',
    usageTip: 'Sprinkle as a finishing garnish over roasted meats, hummus, and crisp cucumber salads.',
    substituteOrAlternative: 'Fresh lemon zest with a tiny pinch of salt.',
    origin: 'Middle East & Mediterranean',
  },

  {
    term: 'Miso',
    phonetic: 'mee-soh',
    category: 'ingredient',
    definition: 'A traditional Japanese seasoning produced by fermenting soybeans with salt and koji fungus, yielding deep savory umami complexity.',
    usageTip: 'Never boil miso directly; dissolve in warm broth off the heat to preserve beneficial probiotic enzymes and delicate aromatics.',
    substituteOrAlternative: 'Soy sauce mixed with a pinch of tahini or nutritional yeast.',
    origin: 'Japan',
  },
  {
    term: 'Tahini',
    phonetic: 'tah-hee-nee',
    category: 'ingredient',
    definition: 'A silky, nutty paste made from toasted, ground hulled sesame seeds, foundational to Middle Eastern and Mediterranean cuisine.',
    usageTip: 'Whisk with cold ice water, garlic, and fresh lemon juice—it will seize up initially before blooming into a luxurious pale cream.',
    substituteOrAlternative: 'Unsweetened sunflower seed butter or smooth natural peanut butter.',
    origin: 'Middle East',
  },
  {
    term: 'Fish Sauce',
    phonetic: 'fish saws',
    category: 'ingredient',
    definition: 'An amber liquid condiment made from fermenting wild anchovies and sea salt for up to two years, imparting concentrated glutamate umami.',
    usageTip: 'A few drops enhance tomato bolognese, gravies, and marinades without tasting overtly fishy.',
    substituteOrAlternative: 'Soy sauce combined with Worcestershire sauce and a mashed anchovy fillet.',
    origin: 'Southeast Asia',
  },
  {
    term: 'Harissa',
    phonetic: 'hah-ree-sah',
    category: 'ingredient',
    definition: 'A fragrant North African chili paste flavored with roasted red peppers, garlic, caraway seeds, coriander, and olive oil.',
    usageTip: 'Rub onto chicken thighs or roasted carrots before roasting for smoky, complex heat.',
    substituteOrAlternative: 'Chili crisp or smoked paprika blended with cayenne and olive oil.',
    origin: 'Tunisia / North Africa',
  },
  {
    term: 'Kombu',
    phonetic: 'kohm-boo',
    category: 'ingredient',
    definition: 'Thick dried kelp rich in naturally occurring glutamic acid, forming the backbone of Japanese dashi broth and dashi tare.',
    usageTip: 'Wipe surface gently with a damp cloth to remove grit, but leave the white powdery mannitol crystals—that is pure umami.',
    substituteOrAlternative: 'Dried shiitake mushroom caps or concentrated mushroom broth.',
    origin: 'Hokkaido, Japan',
  },

  // --- INSTRUMENTS & TOOLS ---
  {
    term: 'Mandoline',
    phonetic: 'man-duh-leen',
    category: 'instrument',
    definition: 'A flat culinary cutting surface with an adjustable razor blade for slicing vegetables uniformly into paper-thin ribbons or juliennes.',
    usageTip: 'Always utilize the safety hand guard or a cut-resistant chainmail glove to protect fingers.',
    substituteOrAlternative: 'Sharp chef knife or wide Y-peeler.',
    origin: 'France',
  },
  {
    term: 'Spider Strainer',
    phonetic: 'spye-der stray-ner',
    category: 'instrument',
    definition: 'A wide, shallow wire mesh basket with a long bamboo or stainless steel handle, used to retrieve delicate items from boiling liquid or hot frying oil.',
    usageTip: 'Ideal for blanching dumplings, scooping pasta, and skimming broth.',
    substituteOrAlternative: 'Slotted spoon or perforated metal ladle.',
    origin: 'East Asia',
  },
  {
    term: 'Microplane',
    phonetic: 'mye-kroh-playn',
    category: 'instrument',
    definition: 'An etched stainless steel rasp grater that shaves hard cheeses, citrus zests, nutmeg, ginger, and garlic into gossamer ribbons without bruising.',
    usageTip: 'Grate citrus zest with light pressure; stop before reaching the bitter white pith.',
    substituteOrAlternative: 'Fine side of a classic box grater.',
    origin: 'United States',
  },
  {
    term: 'Chinois',
    phonetic: 'sheen-wah',
    category: 'instrument',
    definition: 'A conical, ultra-fine mesh strainer used to clarify consommé, smooth velvet purées, and filter stocks to restaurant-grade crystal clarity.',
    usageTip: 'Press solids gently with the round base of a ladle to extract all flavorful juices without pushing pulp through.',
    substituteOrAlternative: 'Standard fine-mesh strainer lined with double-layered cheesecloth.',
    origin: 'France',
  },
  {
    term: 'Mortar and Pestle',
    phonetic: 'mor-ter and pes-uhl',
    category: 'instrument',
    definition: 'A heavy stone, granite, or wooden bowl (mortar) and club-shaped pestle used to crush, bruise, and emulsify whole spices, herbs, and pastes.',
    usageTip: 'Crushing cell walls releases essential oils and aromatics far superior to electric blades.',
    substituteOrAlternative: 'Spice grinder or rolling pin with heavy plastic bag.',
    origin: 'Ancient Global',
  },
  {
    term: 'Cast-Iron Skillet',
    phonetic: 'kast eye-ern skil-it',
    category: 'instrument',
    definition: 'A heavy, high-thermal-mass pan made of molten iron that retains extreme heat evenly for exceptional Maillard crusts and searing.',
    usageTip: 'Preheat for at least 5 minutes before adding oil so heat penetrates deeply through the metal.',
    substituteOrAlternative: 'Carbon steel skillet or heavy stainless steel tri-ply pan.',
    origin: 'Traditional Global',
  },
  {
    term: 'Dutch Oven',
    phonetic: 'duhch uhv-uhn',
    category: 'instrument',
    definition: 'A heavy, enameled cast-iron pot with tight-fitting lid that traps steam and provides uniform radiant heat for braises, stews, and sourdough.',
    usageTip: 'The tight lid prevents evaporation during 3-hour low-temperature braises, melting connective tissues into rich gelatin.',
    substituteOrAlternative: 'Heavy stockpot tightly sealed with heavy-duty aluminum foil.',
    origin: 'Netherlands / France (Cocotte)',
  },
  {
    term: 'Immersion Blender',
    phonetic: 'ih-mur-zhuhn blen-der',
    category: 'instrument',
    definition: 'A handheld stick blender with a motorized blade wand that purées soups, sauces, and emulsions directly inside hot cooking vessels.',
    usageTip: 'Keep the blade guard fully submerged against the bottom of the pot to prevent hot splatters and incorporate air gradually.',
    substituteOrAlternative: 'Standard countertop blender (blend in small batches with lid vented).',
    origin: 'Switzerland (Bamix)',
  },
  {
    term: 'Bench Scraper',
    phonetic: 'bench skray-per',
    category: 'instrument',
    definition: 'A rectangular stainless steel blade with a rolled grip handle used for dividing dough, scraping cutting boards, and scooping chopped produce.',
    usageTip: 'Never scrape your cutting board with the sharp edge of your knife; use the bench scraper to preserve blade edge geometry.',
    substituteOrAlternative: 'Wide chef knife spine (dull edge only).',
    origin: 'Baking / Professional Kitchen',
  },
  {
    term: 'Instant-Read Probe',
    phonetic: 'in-stunt reed prohb',
    category: 'instrument',
    definition: 'A rapid thermocouple digital thermometer that measures internal food temperature in under 2 seconds to guarantee food safety and doneness.',
    usageTip: 'Insert into the thickest geometrical center of the protein without touching bone or pan metal.',
    substituteOrAlternative: 'Leave-in analog oven meat thermometer.',
    origin: 'Modern Food Science',
  },

  // --- TECHNIQUES ---
  {
    term: 'Deglazing',
    phonetic: 'dee-glay-zing',
    category: 'technique',
    definition: 'Pouring cold liquid (wine, stock, citrus juice) into a blistering hot pan after searing meat to dissolve caramelized browned bits (fond) into a rich sauce.',
    usageTip: 'Scrape the bottom of the pan with a wooden spoon immediately as the liquid bubbles violently.',
    origin: 'Classical French',
  },
  {
    term: 'Emulsification',
    phonetic: 'ee-mul-suh-fuh-kay-shun',
    category: 'technique',
    definition: 'The chemical blending of two immiscible liquids (like oil and water/vinegar) into a uniform, creamy suspension using an emulsifier (egg yolk, mustard, or cold butter).',
    usageTip: 'Whisk oil in drop-by-drop initially to prevent the emulsion from splitting or curdling.',
    origin: 'Universal Food Chemistry',
  },
  {
    term: 'Chiffonade',
    phonetic: 'shif-uh-nahd',
    category: 'technique',
    definition: 'A slicing technique where leafy greens or herbs (basil, sage, mint) are stacked, rolled tightly into a cylinder, and cut into fine ribbons.',
    usageTip: 'Slice in a single clean forward slicing motion to prevent bruising the delicate herb margins.',
    origin: 'France',
  },
  {
    term: 'Braising',
    phonetic: 'bray-zing',
    category: 'technique',
    definition: 'A combination cooking technique: searing protein over high heat first, then simmering covered in flavorful liquid over low heat until collagen converts to gelatin.',
    usageTip: 'Keep the liquid level halfway up the meat—never fully submerge, or you are boiling rather than braising.',
    origin: 'France & Traditional Global',
  },
  {
    term: 'Basting (Arrosé)',
    phonetic: 'ah-roh-zay',
    category: 'technique',
    definition: 'Continuously spooning melted foaming butter, pan drippings, and infused aromatics (thyme, crushed garlic) over protein while searing.',
    usageTip: 'Tilt the pan toward you at a 30-degree angle so butter pools in the lower lip for effortless continuous spooning.',
    origin: 'Classical French',
  },
  {
    term: 'Maillard Reaction',
    phonetic: 'my-yar ree-ak-shun',
    category: 'technique',
    definition: 'A chemical reaction between amino acids and reducing sugars at 280°F–330°F (140°C–165°C) that produces hundreds of new savory flavor compounds and golden-brown color.',
    usageTip: 'Surface water suppresses the temperature to 212°F (boiling), preventing the reaction. Always thoroughly dry proteins before searing.',
    origin: 'Discovered by Louis-Camille Maillard',
  },
  {
    term: 'Mise en Place',
    phonetic: 'meez ahn plahs',
    category: 'technique',
    definition: 'The culinary philosophy and practice of measuring, chopping, and organizing all ingredients and tools prior to firing the stove.',
    usageTip: 'Having small ramekins of salt, minced garlic, and liquids ready guarantees nothing scorches while you search your kitchen.',
    origin: 'Classical French Brigade',
  },
  {
    term: 'Blanching',
    phonetic: 'blan-ching',
    category: 'technique',
    definition: 'Submerging produce into boiling salted water for 60 to 90 seconds, followed immediately by an ice-water shock to deactivate enzymes and fix vibrant color.',
    usageTip: 'The shock bath halts residual thermal cooking instantly, maintaining a crisp, tender snap.',
    origin: 'France',
  },
  {
    term: 'Sous-Vide',
    phonetic: 'soo-veed',
    category: 'technique',
    definition: 'Cooking vacuum-sealed foods in a precision temperature-controlled water bath to achieve exact edge-to-edge doneness without overcooking.',
    usageTip: 'Sear briefly for 45 seconds per side in a smoking cast iron pan post-bath to develop a crisp Maillard exterior.',
    origin: 'France',
  },
  {
    term: 'Reduction',
    phonetic: 'rih-duhk-shun',
    category: 'technique',
    definition: 'Simmering a liquid uncovered until water evaporates, thickening the viscosity and concentrating aromas, natural sugars, and umami.',
    usageTip: 'Reduce until the liquid coats the back of a spoon (nappe consistency).',
    origin: 'Classical French',
  },
];

/**
 * Look up culinary terms matching any text query
 */
export function lookupCulinaryTerm(query: string): GlossaryEntry | undefined {
  const normalized = query.trim().toLowerCase();
  return CULINARY_GLOSSARY.find(
    entry =>
      entry.term.toLowerCase() === normalized ||
      entry.term.toLowerCase().includes(normalized) ||
      normalized.includes(entry.term.toLowerCase())
  );
}

/**
 * Scan a block of text and return all detected glossary terms
 */
export function detectGlossaryTerms(text: string): GlossaryEntry[] {
  const lower = text.toLowerCase();
  return CULINARY_GLOSSARY.filter(entry =>
    lower.includes(entry.term.toLowerCase())
  );
}
