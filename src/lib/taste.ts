// Taste types, picker dishes and copy for the /taste pages.
// The taste type keys are shared with the TasteBuddy app; labels are a first
// proposal and are meant to be iterated here, in this one module.
import { APPLE_URL, buildGooglePlayHref } from './marketing/app-links';

export type TasteLocale = 'en' | 'de';

export const TASTE_TYPE_KEYS = [
  'baker',
  'pasta_lover',
  'spice_explorer',
  'green_cook',
  'quick_cook',
  'comfort_cook',
  'fresh_light',
  'protein_fan',
  'all_rounder',
] as const;

export type TasteTypeKey = (typeof TASTE_TYPE_KEYS)[number];

export interface TasteType {
  key: TasteTypeKey;
  icon: string;
  label: Record<TasteLocale, string>;
  description: Record<TasteLocale, string>;
}

// Table order matters: it breaks ties in the picker.
export const TASTE_TYPES: readonly TasteType[] = [
  {
    key: 'baker',
    icon: '🧁',
    label: { en: 'Weekend Baker', de: 'Wochenend-Bäcker:in' },
    description: { en: 'Cookies, cakes and bread are your thing', de: 'Kekse, Kuchen und Brot sind dein Ding' },
  },
  {
    key: 'pasta_lover',
    icon: '🍝',
    label: { en: 'Pasta Lover', de: 'Pasta-Fan' },
    description: { en: 'There is always room for pasta', de: 'Für Pasta ist immer Platz' },
  },
  {
    key: 'spice_explorer',
    icon: '🌶️',
    label: { en: 'Spice Explorer', de: 'Gewürz-Entdecker:in' },
    description: { en: 'Curries, chili and bold flavors', de: 'Currys, Chili und kräftige Aromen' },
  },
  {
    key: 'green_cook',
    icon: '🥦',
    label: { en: 'Green Cook', de: 'Gemüseküche' },
    description: { en: 'Vegetables take center stage', de: 'Gemüse spielt die Hauptrolle' },
  },
  {
    key: 'quick_cook',
    icon: '⚡',
    label: { en: 'Weeknight Speedster', de: 'Feierabend-Blitzkoch' },
    description: { en: 'On the table in 30 minutes', de: 'In 30 Minuten auf dem Tisch' },
  },
  {
    key: 'comfort_cook',
    icon: '🍲',
    label: { en: 'Comfort Cook', de: 'Soulfood-Koch' },
    description: { en: 'Soups, stews and one-pot classics', de: 'Suppen, Eintöpfe und One-Pot-Klassiker' },
  },
  {
    key: 'fresh_light',
    icon: '🥗',
    label: { en: 'Fresh & Light', de: 'Frisch & Leicht' },
    description: { en: 'Salads, bowls and lighter plates', de: 'Salate, Bowls und leichte Teller' },
  },
  {
    key: 'protein_fan',
    icon: '🍗',
    label: { en: 'Protein Fan', de: 'Protein-Fan' },
    description: { en: 'Chicken, meat and fish first', de: 'Hähnchen, Fleisch und Fisch zuerst' },
  },
  {
    key: 'all_rounder',
    icon: '🍱',
    label: { en: 'All-Rounder', de: 'Allrounder' },
    description: { en: 'A bit of everything', de: 'Von allem etwas' },
  },
];

export const FALLBACK_TASTE_TYPE: TasteTypeKey = 'all_rounder';

export function isTasteTypeKey(value: unknown): value is TasteTypeKey {
  return typeof value === 'string' && (TASTE_TYPE_KEYS as readonly string[]).includes(value);
}

export function getTasteType(key: unknown): TasteType {
  const resolved = isTasteTypeKey(key) ? key : FALLBACK_TASTE_TYPE;
  return TASTE_TYPES.find((type) => type.key === resolved)!;
}

// ---------------------------------------------------------------------------
// Picker

export interface PickerDish {
  id: string;
  icon: string;
  name: Record<TasteLocale, string>;
  tastes: readonly TasteTypeKey[];
}

export const PICKER_DISHES: readonly PickerDish[] = [
  { id: 'cookies', icon: '🍪', name: { en: 'Cookies', de: 'Kekse' }, tastes: ['baker'] },
  { id: 'cake', icon: '🍰', name: { en: 'Cake', de: 'Kuchen' }, tastes: ['baker'] },
  { id: 'bread', icon: '🍞', name: { en: 'Fresh bread', de: 'Frisches Brot' }, tastes: ['baker'] },
  { id: 'spaghetti', icon: '🍝', name: { en: 'Spaghetti', de: 'Spaghetti' }, tastes: ['pasta_lover'] },
  { id: 'mac_cheese', icon: '🧀', name: { en: 'Mac & cheese', de: 'Käse-Makkaroni' }, tastes: ['pasta_lover', 'comfort_cook'] },
  { id: 'pizza', icon: '🍕', name: { en: 'Pizza', de: 'Pizza' }, tastes: ['pasta_lover'] },
  { id: 'curry', icon: '🍛', name: { en: 'Curry', de: 'Curry' }, tastes: ['spice_explorer'] },
  { id: 'tacos', icon: '🌮', name: { en: 'Tacos', de: 'Tacos' }, tastes: ['spice_explorer', 'quick_cook'] },
  { id: 'ramen', icon: '🍜', name: { en: 'Ramen', de: 'Ramen' }, tastes: ['spice_explorer', 'comfort_cook'] },
  { id: 'veggies', icon: '🥦', name: { en: 'Roasted veggies', de: 'Ofengemüse' }, tastes: ['green_cook'] },
  { id: 'salad', icon: '🥗', name: { en: 'Big salad', de: 'Großer Salat' }, tastes: ['fresh_light', 'green_cook'] },
  { id: 'falafel', icon: '🥙', name: { en: 'Falafel wrap', de: 'Falafel-Wrap' }, tastes: ['green_cook', 'quick_cook'] },
  { id: 'poke', icon: '🍣', name: { en: 'Poke bowl', de: 'Poke Bowl' }, tastes: ['fresh_light', 'protein_fan'] },
  { id: 'omelet', icon: '🍳', name: { en: 'Omelet', de: 'Omelett' }, tastes: ['quick_cook', 'protein_fan'] },
  { id: 'stew', icon: '🍲', name: { en: 'Stew', de: 'Eintopf' }, tastes: ['comfort_cook'] },
  { id: 'steak', icon: '🥩', name: { en: 'Steak', de: 'Steak' }, tastes: ['protein_fan'] },
];

export const PICKER_MIN_PICKS = 3;

/**
 * Picks the taste type with the most votes. Ties go to the first type in
 * table order. If no type got at least two votes there is no clear signal,
 * so the result is `all_rounder`.
 */
export function pickTasteType(picked: ReadonlyArray<ReadonlyArray<string>>): TasteTypeKey {
  const scores = new Map<TasteTypeKey, number>();
  for (const tastes of picked) {
    for (const key of tastes) {
      if (isTasteTypeKey(key)) {
        scores.set(key, (scores.get(key) ?? 0) + 1);
      }
    }
  }

  let best: TasteTypeKey = FALLBACK_TASTE_TYPE;
  let bestScore = 1;
  for (const { key } of TASTE_TYPES) {
    const score = scores.get(key) ?? 0;
    if (score > bestScore) {
      best = key;
      bestScore = score;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Shared taste payload (POST /functions/v1/shared-taste, payload v1)

export interface TasteCount {
  name: string;
  count: number;
}

export interface SharedTaste {
  tasteType: TasteTypeKey;
  recipeCount: number | null;
  cuisineCount: number | null;
  topCuisines: TasteCount[];
  topIngredients: TasteCount[];
  locale: TasteLocale;
  imageUrl: string | null;
}

const MAX_NAME_LENGTH = 40;

function toCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;
}

function toCountList(value: unknown, limit: number): TasteCount[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .flatMap((entry) => {
      const name = typeof entry?.name === 'string' ? entry.name.trim().slice(0, MAX_NAME_LENGTH) : '';
      const count = toCount(entry?.count);
      return name && count !== null ? [{ name, count }] : [];
    })
    .slice(0, limit);
}

function toImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function toTasteLocale(value: unknown): TasteLocale {
  return typeof value === 'string' && value.toLowerCase().startsWith('de') ? 'de' : 'en';
}

/** Turns an untrusted shared-taste response body into a safe, complete shape. */
export function normalizeSharedTaste(body: unknown): SharedTaste {
  const record = (body && typeof body === 'object' ? body : {}) as Record<string, any>;
  const payload = (record.payload && typeof record.payload === 'object' ? record.payload : {}) as Record<string, unknown>;

  return {
    tasteType: isTasteTypeKey(payload.taste_type) ? payload.taste_type : FALLBACK_TASTE_TYPE,
    recipeCount: toCount(payload.recipe_count),
    cuisineCount: toCount(payload.cuisine_count),
    topCuisines: toCountList(payload.top_cuisines, 5),
    topIngredients: toCountList(payload.top_ingredients, 10),
    locale: toTasteLocale(payload.locale),
    imageUrl: toImageUrl(record.image_url),
  };
}

// ---------------------------------------------------------------------------
// Store links and copy

export type TasteSurface = 'shared_page' | 'picker';

const APP_STORE_CAMPAIGN: Record<TasteSurface, string> = {
  shared_page: 'taste_share',
  picker: 'taste_picker',
};

export function getTasteStoreLinks(surface: TasteSurface) {
  const ios = new URL(APPLE_URL);
  ios.searchParams.set('ct', APP_STORE_CAMPAIGN[surface]);

  return {
    ios: ios.toString(),
    android: buildGooglePlayHref({
      utm_source: 'taste_share',
      utm_medium: 'web',
      utm_campaign: 'taste',
      utm_content: surface,
    }),
  };
}

export function getPickerPath(locale: TasteLocale) {
  return locale === 'de' ? '/de/taste/' : '/taste/';
}

export const TASTE_COPY = {
  en: {
    sharedEyebrow: 'My taste on TasteBuddy',
    sharedTitle: (label: string) => `My taste: ${label}`,
    imageAlt: (label: string) => `Taste card: ${label}`,
    recipes: (count: number) => `${count} ${count === 1 ? 'recipe' : 'recipes'}`,
    cuisines: (count: number) => `${count} ${count === 1 ? 'cuisine' : 'cuisines'}`,
    topCuisines: 'Top cuisines',
    topIngredients: 'Top ingredients',
    whatsYours: "What's your taste?",
    getApp: 'Or get the app',
    notFoundTitle: 'This taste is no longer shared',
    notFoundBody: 'The link may have been removed. Find out your own taste instead.',
    unavailableTitle: 'This taste could not be loaded',
    unavailableBody: 'Please try again in a moment, or find out your own taste.',
    pickerTitle: "What's your taste?",
    pickerMetaTitle: "What's your taste? Find your cooking style | TasteBuddy",
    pickerDescription: 'Tap the dishes you love and discover your taste type in 30 seconds. No sign-up needed. Then let TasteBuddy build your real taste from the recipes you save.',
    pickerIntro: (min: number) => `Tap at least ${min} dishes you love.`,
    pickerButton: 'Show my taste',
    resultEyebrow: 'Your taste',
    resultCta: 'Get TasteBuddy to build your real taste from the recipes you save',
    startOver: 'Start over',
    appStoreAlt: 'Download on the App Store',
    googlePlayAlt: 'Get it on Google Play',
  },
  de: {
    sharedEyebrow: 'Mein Geschmack auf TasteBuddy',
    sharedTitle: (label: string) => `Mein Geschmack: ${label}`,
    imageAlt: (label: string) => `Geschmackskarte: ${label}`,
    recipes: (count: number) => `${count} ${count === 1 ? 'Rezept' : 'Rezepte'}`,
    cuisines: (count: number) => `${count} ${count === 1 ? 'Küche' : 'Küchen'}`,
    topCuisines: 'Top-Küchen',
    topIngredients: 'Top-Zutaten',
    whatsYours: 'Was ist dein Geschmack?',
    getApp: 'Oder hol dir die App',
    notFoundTitle: 'Dieser Geschmack wird nicht mehr geteilt',
    notFoundBody: 'Der Link wurde vielleicht entfernt. Finde stattdessen deinen eigenen Geschmack heraus.',
    unavailableTitle: 'Dieser Geschmack konnte nicht geladen werden',
    unavailableBody: 'Versuch es gleich noch einmal oder finde deinen eigenen Geschmack heraus.',
    pickerTitle: 'Was ist dein Geschmack?',
    pickerMetaTitle: 'Was ist dein Geschmack? Finde deinen Kochstil | TasteBuddy',
    pickerDescription: 'Tippe auf die Gerichte, die du liebst, und finde in 30 Sekunden deinen Geschmackstyp heraus. Ohne Anmeldung. TasteBuddy zeigt dir danach deinen echten Geschmack.',
    pickerIntro: (min: number) => `Tippe auf mindestens ${min} Gerichte, die du liebst.`,
    pickerButton: 'Zeig meinen Geschmack',
    resultEyebrow: 'Dein Geschmack',
    resultCta: 'Hol dir TasteBuddy und entdecke deinen echten Geschmack anhand der Rezepte, die du speicherst',
    startOver: 'Neu starten',
    appStoreAlt: 'Laden im App Store',
    googlePlayAlt: 'Jetzt bei Google Play',
  },
} as const;
