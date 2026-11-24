/**
 * Party & portion planner: pure estimation logic shared by the EN and DE tool pages.
 *
 * All amounts are rules of thumb per ADULT at normal appetite for a sit-down dinner where the
 * item is the only choice in its group. Event type, appetite, kids and the number of choices in a
 * group scale those reference values. No DOM access here so the module can be tested in Node.
 */

export type Locale = 'en' | 'de';
export type Appetite = 'light' | 'normal' | 'hearty';
export type EventType = 'dinner' | 'buffet' | 'bbq' | 'brunch' | 'christmas' | 'dessert-table';
export type Unit = 'g' | 'ml' | 'pcs' | 'cups';

/** Items in the same group share one portion: two starches means a bit less of each. */
export type ItemGroup =
  | 'starch'
  | 'protein'
  | 'veg'
  | 'salad'
  | 'bread'
  | 'sauce'
  | 'dessert'
  | 'cookies'
  | 'water'
  | 'soft'
  | 'alcohol'
  | 'coffee';

export type ItemId =
  | 'pasta'
  | 'rice'
  | 'potatoes'
  | 'meat-boneless'
  | 'meat-bone-in'
  | 'fish'
  | 'vegetables'
  | 'salad'
  | 'bread'
  | 'sauce'
  | 'dessert'
  | 'cookies'
  | 'water'
  | 'soft-drinks'
  | 'wine'
  | 'beer'
  | 'mulled-wine'
  | 'coffee';

export interface ItemDefinition {
  id: ItemId;
  group: ItemGroup;
  unit: Unit;
  /** Reference amount per adult (normal appetite, dinner, only item in its group). */
  perAdult: number;
  /** Share of the adult amount a child (about 3–12) eats or drinks. 0 = not for kids. */
  kidFactor: number;
  /** Drinks are not scaled by appetite. */
  isDrink: boolean;
  /** Optional pack size used for a buying hint, in the item's unit. */
  pack?: number;
}

export const ITEMS: readonly ItemDefinition[] = [
  { id: 'pasta', group: 'starch', unit: 'g', perAdult: 100, kidFactor: 0.5, isDrink: false, pack: 500 },
  { id: 'rice', group: 'starch', unit: 'g', perAdult: 75, kidFactor: 0.5, isDrink: false, pack: 1000 },
  { id: 'potatoes', group: 'starch', unit: 'g', perAdult: 250, kidFactor: 0.5, isDrink: false },
  { id: 'meat-boneless', group: 'protein', unit: 'g', perAdult: 180, kidFactor: 0.5, isDrink: false },
  { id: 'meat-bone-in', group: 'protein', unit: 'g', perAdult: 300, kidFactor: 0.5, isDrink: false },
  { id: 'fish', group: 'protein', unit: 'g', perAdult: 160, kidFactor: 0.5, isDrink: false },
  { id: 'vegetables', group: 'veg', unit: 'g', perAdult: 150, kidFactor: 0.5, isDrink: false },
  { id: 'salad', group: 'salad', unit: 'g', perAdult: 100, kidFactor: 0.5, isDrink: false },
  { id: 'bread', group: 'bread', unit: 'g', perAdult: 75, kidFactor: 0.5, isDrink: false },
  { id: 'sauce', group: 'sauce', unit: 'ml', perAdult: 75, kidFactor: 0.5, isDrink: false },
  { id: 'dessert', group: 'dessert', unit: 'g', perAdult: 125, kidFactor: 0.75, isDrink: false },
  { id: 'cookies', group: 'cookies', unit: 'pcs', perAdult: 3, kidFactor: 0.75, isDrink: false },
  { id: 'water', group: 'water', unit: 'ml', perAdult: 750, kidFactor: 0.75, isDrink: true, pack: 1500 },
  { id: 'soft-drinks', group: 'soft', unit: 'ml', perAdult: 500, kidFactor: 1, isDrink: true, pack: 1500 },
  { id: 'wine', group: 'alcohol', unit: 'ml', perAdult: 375, kidFactor: 0, isDrink: true, pack: 750 },
  { id: 'beer', group: 'alcohol', unit: 'ml', perAdult: 1000, kidFactor: 0, isDrink: true, pack: 500 },
  { id: 'mulled-wine', group: 'alcohol', unit: 'ml', perAdult: 400, kidFactor: 0, isDrink: true, pack: 1000 },
  { id: 'coffee', group: 'coffee', unit: 'cups', perAdult: 1, kidFactor: 0, isDrink: true },
] as const;

export const APPETITE_FACTORS: Record<Appetite, number> = {
  light: 0.8,
  normal: 1,
  hearty: 1.25,
};

/** Grams of ground coffee per cup (about 150 ml). */
export const COFFEE_GRAMS_PER_CUP = 7;

/** Total portion when a group has several choices: guests take some of each, so the total rises a bit. */
export const VARIETY_TOTAL = 1.25;

interface EventProfile {
  defaults: ItemId[];
  factors: Partial<Record<ItemGroup, number>>;
}

export const EVENT_PROFILES: Record<EventType, EventProfile> = {
  dinner: {
    defaults: ['potatoes', 'meat-boneless', 'vegetables', 'salad', 'bread', 'sauce', 'dessert', 'water', 'soft-drinks', 'wine', 'coffee'],
    factors: {},
  },
  // Buffets need a buffer: guests try everything and the last guest should still find food.
  buffet: {
    defaults: ['pasta', 'rice', 'meat-boneless', 'fish', 'vegetables', 'salad', 'bread', 'sauce', 'dessert', 'water', 'soft-drinks', 'wine', 'beer'],
    factors: { starch: 1.1, protein: 1.1, veg: 1.1, salad: 1.2, bread: 1.1, sauce: 1.1, dessert: 1.1 },
  },
  // At a barbecue meat is the star and salads replace most starches.
  bbq: {
    defaults: ['meat-boneless', 'meat-bone-in', 'potatoes', 'salad', 'bread', 'sauce', 'water', 'soft-drinks', 'beer'],
    factors: { protein: 1.4, starch: 0.8, salad: 1.5, bread: 1.3, sauce: 1.2, dessert: 0.8, water: 1.3, soft: 1.2, coffee: 0.5 },
  },
  brunch: {
    defaults: ['bread', 'vegetables', 'sauce', 'dessert', 'water', 'soft-drinks', 'coffee'],
    factors: { starch: 0.6, protein: 0.5, veg: 0.8, salad: 0.8, bread: 1.6, sauce: 0.6, dessert: 0.8, water: 0.7, alcohol: 0.4, coffee: 2 },
  },
  christmas: {
    defaults: ['potatoes', 'meat-bone-in', 'vegetables', 'salad', 'bread', 'sauce', 'dessert', 'cookies', 'water', 'soft-drinks', 'wine', 'coffee'],
    factors: { protein: 1.1, sauce: 1.2, cookies: 1.5 },
  },
  'dessert-table': {
    defaults: ['dessert', 'cookies', 'water', 'soft-drinks', 'mulled-wine', 'coffee'],
    factors: { starch: 0.5, protein: 0.5, veg: 0.5, salad: 0.5, bread: 0.5, sauce: 0.5, dessert: 1.4, cookies: 2, water: 0.7, alcohol: 0.6, coffee: 1.5 },
  },
};

export const EVENT_TYPES = Object.keys(EVENT_PROFILES) as EventType[];
export const APPETITES = Object.keys(APPETITE_FACTORS) as Appetite[];

export interface PartyInput {
  adults: number;
  kids: number;
  appetite: Appetite;
  eventType: EventType;
  items: ItemId[];
}

export interface ItemResult {
  id: ItemId;
  unit: Unit;
  /** Raw estimate before rounding, in the item's unit. */
  exact: number;
  /** Rounded up to a sensible buying amount, in the item's unit. */
  amount: number;
  /** Amount per adult guest after all factors, in the item's unit. */
  perAdult: number;
  /** Number of packs/bottles when the item has a pack size. */
  packs?: number;
  pack?: number;
  /** Ground coffee in grams (coffee only). */
  coffeeGrams?: number;
}

export interface PartyResult {
  input: PartyInput;
  items: ItemResult[];
  totalFoodGrams: number;
  totalDrinksMl: number;
  guests: number;
}

const ITEM_BY_ID = new Map(ITEMS.map((item) => [item.id, item]));

export function getItem(id: ItemId): ItemDefinition {
  const item = ITEM_BY_ID.get(id);
  if (!item) throw new Error(`Unknown item ${id}`);
  return item;
}

export function isItemId(value: string): value is ItemId {
  return ITEM_BY_ID.has(value as ItemId);
}

export function defaultItemsFor(eventType: EventType): ItemId[] {
  return [...EVENT_PROFILES[eventType].defaults];
}

function clampCount(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(Math.floor(value), 500);
}

/** Round up to a step that matches how the item is bought. */
export function roundUp(value: number, unit: Unit): number {
  if (value <= 0) return 0;
  let step: number;
  if (unit === 'pcs' || unit === 'cups') step = 1;
  else if (value < 500) step = 25;
  else if (value < 2000) step = 50;
  else step = 100;
  // Avoid 100.0000001 rounding up a whole step.
  return Math.ceil(value / step - 1e-6) * step;
}

export function groupShare(count: number): number {
  if (count <= 1) return 1;
  return VARIETY_TOTAL / count;
}

export function calculateParty(raw: PartyInput): PartyResult {
  const input: PartyInput = {
    adults: clampCount(raw.adults),
    kids: clampCount(raw.kids),
    appetite: raw.appetite in APPETITE_FACTORS ? raw.appetite : 'normal',
    eventType: raw.eventType in EVENT_PROFILES ? raw.eventType : 'dinner',
    items: ITEMS.map((item) => item.id).filter((id) => raw.items.includes(id)),
  };

  const profile = EVENT_PROFILES[input.eventType];
  const appetite = APPETITE_FACTORS[input.appetite];

  const groupCounts = new Map<ItemGroup, number>();
  for (const id of input.items) {
    const group = getItem(id).group;
    groupCounts.set(group, (groupCounts.get(group) ?? 0) + 1);
  }

  let totalFoodGrams = 0;
  let totalDrinksMl = 0;

  const items: ItemResult[] = input.items.map((id) => {
    const def = getItem(id);
    const share = groupShare(groupCounts.get(def.group) ?? 1);
    const eventFactor = profile.factors[def.group] ?? 1;
    const appetiteFactor = def.isDrink ? 1 : appetite;
    const perAdult = def.perAdult * share * eventFactor * appetiteFactor;
    const exact = perAdult * (input.adults + input.kids * def.kidFactor);
    const amount = roundUp(exact, def.unit);

    const result: ItemResult = { id, unit: def.unit, exact, amount, perAdult };
    if (def.pack && amount > 0) {
      result.pack = def.pack;
      result.packs = Math.ceil(amount / def.pack - 1e-9);
    }
    if (id === 'coffee') {
      result.coffeeGrams = roundUp(amount * COFFEE_GRAMS_PER_CUP, 'g');
    }

    if (def.unit === 'g') totalFoodGrams += amount;
    if (def.unit === 'ml' && def.isDrink) totalDrinksMl += amount;
    if (id === 'coffee') totalDrinksMl += amount * 150;

    return result;
  });

  return {
    input,
    items,
    totalFoodGrams,
    totalDrinksMl,
    guests: input.adults + input.kids,
  };
}

/* ------------------------------------------------------------------------------------------ */
/* Localized labels and formatting                                                             */
/* ------------------------------------------------------------------------------------------ */

export const ITEM_LABELS: Record<Locale, Record<ItemId, string>> = {
  en: {
    pasta: 'Pasta (dry)',
    rice: 'Rice (dry)',
    potatoes: 'Potatoes (raw)',
    'meat-boneless': 'Meat, boneless',
    'meat-bone-in': 'Meat, bone-in',
    fish: 'Fish fillet',
    vegetables: 'Vegetables / sides',
    salad: 'Salad (prepared)',
    bread: 'Bread / rolls',
    sauce: 'Sauce / gravy / dip',
    dessert: 'Dessert / cake',
    cookies: 'Cookies',
    water: 'Water',
    'soft-drinks': 'Soft drinks / juice',
    wine: 'Wine',
    beer: 'Beer',
    'mulled-wine': 'Mulled wine',
    coffee: 'Coffee',
  },
  de: {
    pasta: 'Nudeln (trocken)',
    rice: 'Reis (trocken)',
    potatoes: 'Kartoffeln (roh)',
    'meat-boneless': 'Fleisch ohne Knochen',
    'meat-bone-in': 'Fleisch mit Knochen',
    fish: 'Fischfilet',
    vegetables: 'Gemüse / Beilagen',
    salad: 'Salat (fertig angemacht)',
    bread: 'Brot / Brötchen',
    sauce: 'Soße / Dip',
    dessert: 'Dessert / Kuchen',
    cookies: 'Plätzchen / Kekse',
    water: 'Wasser',
    'soft-drinks': 'Softdrinks / Saft',
    wine: 'Wein',
    beer: 'Bier',
    'mulled-wine': 'Glühwein',
    coffee: 'Kaffee',
  },
};

export const EVENT_LABELS: Record<Locale, Record<EventType, string>> = {
  en: {
    dinner: 'Sit-down dinner',
    buffet: 'Buffet',
    bbq: 'BBQ / cookout',
    brunch: 'Brunch',
    christmas: 'Christmas dinner',
    'dessert-table': 'Cookie / dessert table',
  },
  de: {
    dinner: 'Abendessen (gesetzt)',
    buffet: 'Buffet',
    bbq: 'Grillfest',
    brunch: 'Brunch',
    christmas: 'Weihnachtsessen',
    'dessert-table': 'Plätzchen- / Kuchenbuffet',
  },
};

export const APPETITE_LABELS: Record<Locale, Record<Appetite, string>> = {
  en: { light: 'Light', normal: 'Normal', hearty: 'Hearty' },
  de: { light: 'Wenig', normal: 'Normal', hearty: 'Viel' },
};

export const GROUP_LABELS: Record<Locale, { food: string; drinks: string }> = {
  en: { food: 'Food', drinks: 'Drinks' },
  de: { food: 'Essen', drinks: 'Getränke' },
};

const intl = (locale: Locale, maxFraction: number) =>
  new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', { maximumFractionDigits: maxFraction });

/** Format an amount in its unit: grams switch to kg and millilitres to litres from 1000. */
export function formatAmount(value: number, unit: Unit, locale: Locale): string {
  if (unit === 'g') {
    return value >= 1000 ? `${intl(locale, 2).format(value / 1000)} kg` : `${intl(locale, 0).format(value)} g`;
  }
  if (unit === 'ml') {
    return value >= 1000 ? `${intl(locale, 2).format(value / 1000)} l` : `${intl(locale, 0).format(value)} ml`;
  }
  if (unit === 'pcs') {
    return locale === 'de' ? `${intl(locale, 0).format(value)} Stück` : `${intl(locale, 0).format(value)} pcs`;
  }
  const cups = intl(locale, 0).format(value);
  if (locale === 'de') return `${cups} ${value === 1 ? 'Tasse' : 'Tassen'}`;
  return `${cups} ${value === 1 ? 'cup' : 'cups'}`;
}

/** Per-person amount, rounded gently for display (not for buying). */
export function formatPerPerson(value: number, unit: Unit, locale: Locale): string {
  if (unit === 'pcs' || unit === 'cups') {
    const rounded = Math.round(value * 2) / 2;
    const number = intl(locale, 1).format(rounded);
    if (unit === 'pcs') return locale === 'de' ? `${number} Stück` : `${number} pcs`;
    if (locale === 'de') return `${number} ${rounded === 1 ? 'Tasse' : 'Tassen'}`;
    return `${number} ${rounded === 1 ? 'cup' : 'cups'}`;
  }
  const step = value < 1000 ? 5 : 50;
  return formatAmount(Math.round(value / step) * step, unit, locale);
}

const PACK_NOUNS: Partial<Record<ItemId, Record<Locale, [string, string]>>> = {
  pasta: { en: ['pack', 'packs'], de: ['Packung', 'Packungen'] },
  rice: { en: ['bag', 'bags'], de: ['Beutel', 'Beutel'] },
  water: { en: ['bottle', 'bottles'], de: ['Flasche', 'Flaschen'] },
  'soft-drinks': { en: ['bottle', 'bottles'], de: ['Flasche', 'Flaschen'] },
  wine: { en: ['bottle', 'bottles'], de: ['Flasche', 'Flaschen'] },
  beer: { en: ['bottle', 'bottles'], de: ['Flasche', 'Flaschen'] },
  'mulled-wine': { en: ['bottle', 'bottles'], de: ['Flasche', 'Flaschen'] },
};

/** Short buying hint, e.g. "≈ 2 packs of 500 g" or "≈ 140 g ground coffee". */
export function buyingHint(item: ItemResult, locale: Locale): string {
  if (item.id === 'coffee' && item.coffeeGrams) {
    return locale === 'de'
      ? `≈ ${formatAmount(item.coffeeGrams, 'g', locale)} Kaffeepulver`
      : `≈ ${formatAmount(item.coffeeGrams, 'g', locale)} ground coffee`;
  }
  if (item.packs && item.pack) {
    const nouns = PACK_NOUNS[item.id]?.[locale];
    if (!nouns) return '';
    const noun = item.packs === 1 ? nouns[0] : nouns[1];
    const size = formatAmount(item.pack, item.unit, locale);
    return locale === 'de' ? `≈ ${item.packs} ${noun} à ${size}` : `≈ ${item.packs} ${noun} of ${size}`;
  }
  return '';
}

export function buildShoppingList(result: PartyResult, locale: Locale): string {
  const { input } = result;
  const event = EVENT_LABELS[locale][input.eventType];
  const appetite = APPETITE_LABELS[locale][input.appetite];
  const lines: string[] = [];

  if (locale === 'de') {
    lines.push(`Einkaufsliste: ${event} für ${input.adults} Erwachsene und ${input.kids} Kinder (Hunger: ${appetite})`);
  } else {
    lines.push(`Shopping list: ${event} for ${input.adults} adults and ${input.kids} kids (${appetite.toLowerCase()} appetite)`);
  }
  lines.push('');

  const sections: Array<[string, ItemResult[]]> = [
    [GROUP_LABELS[locale].food, result.items.filter((item) => !getItem(item.id).isDrink)],
    [GROUP_LABELS[locale].drinks, result.items.filter((item) => getItem(item.id).isDrink)],
  ];

  for (const [title, items] of sections) {
    const visible = items.filter((item) => item.amount > 0);
    if (visible.length === 0) continue;
    lines.push(`${title}:`);
    for (const item of visible) {
      const hint = buyingHint(item, locale);
      lines.push(`- ${ITEM_LABELS[locale][item.id]}: ${formatAmount(item.amount, item.unit, locale)}${hint ? ` (${hint})` : ''}`);
    }
    lines.push('');
  }

  lines.push(
    locale === 'de'
      ? 'Schätzwerte – bitte an deine Gäste anpassen. Erstellt mit taste-buddy.app/de/tools/portionsrechner/'
      : 'Estimates only – adjust for your guests. Made with taste-buddy.app/tools/party-food-calculator/',
  );

  return lines.join('\n');
}

/** Rows for the static reference table (per adult, normal appetite, sit-down dinner). */
export function referenceRows(locale: Locale): Array<{ id: ItemId; label: string; perAdult: string; perKid: string }> {
  return ITEMS.map((item) => ({
    id: item.id,
    label: ITEM_LABELS[locale][item.id],
    perAdult: formatAmount(item.perAdult, item.unit, locale),
    perKid: item.kidFactor === 0 ? '–' : formatPerPerson(item.perAdult * item.kidFactor, item.unit, locale),
  }));
}
