/**
 * Multilingual Culinary Translation Engine & Audio Synthesizer
 * Translates recipe steps, ingredients, and culinary instructions into
 * Spanish, French, Italian, Japanese, and German with native SpeechSynthesis audio voices.
 */

export type CulinaryLanguage = 'en' | 'es' | 'fr' | 'it' | 'ja' | 'de';

export interface LanguageOption {
  code: CulinaryLanguage;
  name: string;
  flag: string;
  bcp47Locale: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', bcp47Locale: 'en-US' },
  { code: 'es', name: 'Español', flag: '🇪🇸', bcp47Locale: 'es-ES' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', bcp47Locale: 'fr-FR' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', bcp47Locale: 'it-IT' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', bcp47Locale: 'ja-JP' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', bcp47Locale: 'de-DE' },
];

/**
 * Culinary lexicon mapping common cooking terms, actions, and phrases across supported languages
 */
const CULINARY_LEXICON: Record<CulinaryLanguage, Record<string, string>> = {
  en: {},
  es: {
    'step': 'Paso',
    'min': 'min',
    'mins': 'minutos',
    'minutes': 'minutos',
    'heat': 'calentar',
    'pan': 'sartén',
    'skillet': 'sartén',
    'oil': 'aceite',
    'butter': 'mantequilla',
    'garlic': 'ajo',
    'salt': 'sal',
    'pepper': 'pimienta',
    'sear': 'sellar',
    'flip': 'voltear',
    'simmer': 'cocinar a fuego lento',
    'roast': 'asar',
    'bake': 'hornear',
    'rest': 'dejar reposar',
    'serve': 'servir',
    'pat dry': 'secar con toalla de papel',
    'undisturbed': 'sin mover',
    'remove from heat': 'retirar del fuego',
  },
  fr: {
    'step': 'Étape',
    'min': 'min',
    'mins': 'minutes',
    'minutes': 'minutes',
    'heat': 'chauffer',
    'pan': 'poêle',
    'skillet': 'poêle en fonte',
    'oil': 'huile',
    'butter': 'beurre',
    'garlic': 'ail',
    'salt': 'sel',
    'pepper': 'poivre',
    'sear': 'saisir',
    'flip': 'retourner',
    'simmer': 'mijoter',
    'roast': 'rôtir',
    'bake': 'cuire au four',
    'rest': 'laisser reposer',
    'serve': 'servir chaud',
    'pat dry': 'éponger avec du papier absorbant',
    'undisturbed': 'sans déplacer',
    'remove from heat': 'retirer du feu',
  },
  it: {
    'step': 'Passo',
    'min': 'min',
    'mins': 'minuti',
    'minutes': 'minuti',
    'heat': 'scaldare',
    'pan': 'padella',
    'skillet': 'padella in ghisa',
    'oil': 'olio',
    'butter': 'burro',
    'garlic': 'aglio',
    'salt': 'sale',
    'pepper': 'pepe',
    'sear': 'rosolare a fiamma viva',
    'flip': 'girare',
    'simmer': 'sobbollire a fuoco dolce',
    'roast': 'arrostire',
    'bake': 'infornare',
    'rest': 'far riposare',
    'serve': 'servire caldo',
    'pat dry': 'asciugare tamponando',
    'undisturbed': 'senza toccare',
    'remove from heat': 'togliere dal fuoco',
  },
  ja: {
    'step': 'ステップ',
    'min': '分',
    'mins': '分',
    'minutes': '分',
    'heat': '加熱する',
    'pan': 'フライパン',
    'skillet': 'スキレット',
    'oil': '油',
    'butter': 'バター',
    'garlic': 'にんにく',
    'salt': '塩',
    'pepper': '胡椒',
    'sear': '強火で焼き色をつける',
    'flip': '裏返す',
    'simmer': '弱火でコトコト煮込む',
    'roast': '香ばしくローストする',
    'bake': 'オーブンで焼く',
    'rest': '寝かせて休ませる',
    'serve': '温かいうちに盛り付ける',
    'pat dry': '水気をしっかりと拭き取る',
    'undisturbed': '動かさずに',
    'remove from heat': '火から下ろす',
  },
  de: {
    'step': 'Schritt',
    'min': 'Min',
    'mins': 'Minuten',
    'minutes': 'Minuten',
    'heat': 'erhitzen',
    'pan': 'Pfanne',
    'skillet': 'Gusseisenpfanne',
    'oil': 'Öl',
    'butter': 'Butter',
    'garlic': 'Knoblauch',
    'salt': 'Salz',
    'pepper': 'Pfeffer',
    'sear': 'scharf anbraten',
    'flip': 'wenden',
    'simmer': 'sanft köcheln lassen',
    'roast': 'rösten',
    'bake': 'im Ofen backen',
    'rest': 'ruhen lassen',
    'serve': 'heiß servieren',
    'pat dry': 'mit Küchenpapier trocken tupfen',
    'undisturbed': 'ohne zu wenden',
    'remove from heat': 'von der Hitze nehmen',
  },
};

/**
 * Translates a single recipe instruction step into target culinary language
 */
export function translateRecipeStep(stepText: string, targetLang: CulinaryLanguage): string {
  if (targetLang === 'en' || !stepText) return stepText;

  const dictionary = CULINARY_LEXICON[targetLang];
  if (!dictionary) return stepText;

  // Prefix translation banner when translating dynamically
  let translated = stepText;
  const entries = Object.entries(dictionary).sort((a, b) => b[0].length - a[0].length);

  for (const [englishTerm, targetTerm] of entries) {
    const regex = new RegExp(`\\b${englishTerm}\\b`, 'gi');
    translated = translated.replace(regex, targetTerm);
  }

  return translated;
}

/**
 * Text-to-Speech audio synthesizer for native language pronunciation
 */
export function speakCulinaryText(
  text: string,
  lang: CulinaryLanguage = 'en',
  onEnd?: () => void
): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return () => {};
  }

  window.speechSynthesis.cancel();

  const langOption = SUPPORTED_LANGUAGES.find(l => l.code === lang) || SUPPORTED_LANGUAGES[0];
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langOption.bcp47Locale;
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);

  return () => {
    window.speechSynthesis.cancel();
  };
}
