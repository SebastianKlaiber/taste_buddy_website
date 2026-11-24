/**
 * Yeast & leavening converter — pure logic shared by the EN and DE tool pages.
 *
 * All yeast amounts are normalised to grams of *instant* yeast. Ratios are the
 * common baking rules of thumb (not lab constants):
 *   fresh yeast  ≈ 3    × instant yeast (by weight)
 *   active dry   ≈ 1.25 × instant yeast (by weight)
 * 1 US packet = ¼ oz = 7 g = 2¼ tsp; 1 German cube (Würfel) of fresh yeast = 42 g;
 * 1 German packet (Päckchen) of Trockenhefe = 7 g (instant), meant for 500 g flour.
 */

export type YeastType = 'fresh' | 'active' | 'instant';
export type YeastUnit = 'g' | 'oz' | 'tsp' | 'packet' | 'cube';
export type FlourUnit = 'g' | 'kg' | 'cup';

export const YEAST_TYPES: YeastType[] = ['fresh', 'instant', 'active'];

/** Grams of each yeast type equivalent to 1 g of instant yeast. */
export const YEAST_FACTORS: Record<YeastType, number> = {
  instant: 1,
  active: 1.25,
  fresh: 3,
};

export const GRAMS_PER_OZ = 28.349523125;
export const GRAMS_PER_PACKET = 7;
export const GRAMS_PER_CUBE = 42;
/** 1 packet (7 g) = 2¼ tsp → ≈ 3.1 g per tsp for both instant and active dry. */
export const DRY_YEAST_GRAMS_PER_TSP = GRAMS_PER_PACKET / 2.25;
/** US cup of all-purpose flour, spooned and levelled (approximation). */
export const GRAMS_PER_CUP_FLOUR = 125;

/**
 * Package dosage for a standard yeast dough (1–2 h rise at room temperature):
 * 1 packet (7 g) instant per 500 g flour = 1.4 % of flour weight.
 */
export const INSTANT_YEAST_PER_FLOUR = GRAMS_PER_PACKET / 500;

export const SOURDOUGH_DEFAULT_STARTER_PERCENT = 20;
export const SOURDOUGH_DEFAULT_STARTER_HYDRATION = 100;

/** German Backpulver packet: ≈ 15 g for 500 g flour (≈ 3 % of flour weight). */
export const GRAMS_PER_BAKING_POWDER_PACKET = 15;
export const BAKING_POWDER_PER_FLOUR = GRAMS_PER_BAKING_POWDER_PACKET / 500;
/** Approximate weights of 1 level teaspoon. */
export const BAKING_POWDER_GRAMS_PER_TSP = 4;
export const BAKING_SODA_GRAMS_PER_TSP = 6;
/** By volume: 1 tsp baking powder ≈ ¼ tsp baking soda + ½ tsp cream of tartar. */
export const SODA_TSP_PER_BAKING_POWDER_TSP = 0.25;
export const CREAM_OF_TARTAR_TSP_PER_BAKING_POWDER_TSP = 0.5;

export function unitsFor(type: YeastType): YeastUnit[] {
  return type === 'fresh' ? ['g', 'oz', 'cube'] : ['g', 'oz', 'tsp', 'packet'];
}

/**
 * Parses user input such as "1,5", "1.5", "2 1/4", "3/4", "½", "1.000" (de thousands).
 * Returns null for empty or invalid input.
 */
export function parseAmount(raw: string, locale: 'en' | 'de' = 'en'): number | null {
  if (typeof raw !== 'string') return null;
  let input = raw.trim().replace(/\s+/g, ' ');
  if (!input) return null;

  const unicodeFractions: Record<string, string> = {
    '¼': '1/4',
    '½': '1/2',
    '¾': '3/4',
    '⅓': '1/3',
    '⅔': '2/3',
    '⅛': '1/8',
  };
  input = input.replace(/(\d)?\s*([¼½¾⅓⅔⅛])/g, (_m, whole: string | undefined, frac: string) =>
    whole ? `${whole} ${unicodeFractions[frac]}` : unicodeFractions[frac],
  );

  const mixed = input.match(/^(\d+) (\d+)\/(\d+)$/);
  if (mixed) {
    const den = Number(mixed[3]);
    if (!den) return null;
    return Number(mixed[1]) + Number(mixed[2]) / den;
  }
  const fraction = input.match(/^(\d+)\/(\d+)$/);
  if (fraction) {
    const den = Number(fraction[2]);
    if (!den) return null;
    return Number(fraction[1]) / den;
  }

  let normalized = input.replace(/ /g, '');
  const hasComma = normalized.includes(',');
  const hasDot = normalized.includes('.');
  if (hasComma && hasDot) {
    // The last separator is the decimal one: "1.000,5" (de) or "1,000.5" (en).
    const decimalSep = normalized.lastIndexOf(',') > normalized.lastIndexOf('.') ? ',' : '.';
    const thousandsSep = decimalSep === ',' ? '.' : ',';
    normalized = normalized.split(thousandsSep).join('').replace(decimalSep, '.');
  } else if (hasComma) {
    normalized =
      locale === 'en' && /^\d{1,3}(,\d{3})+$/.test(normalized)
        ? normalized.replace(/,/g, '')
        : normalized.replace(',', '.');
  } else if (hasDot && locale === 'de' && /^\d{1,3}(\.\d{3})+$/.test(normalized)) {
    normalized = normalized.replace(/\./g, '');
  }

  if (!/^\d*\.?\d+$|^\d+\.$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** Converts an amount of the given yeast type to grams of that same yeast type. */
export function yeastToGrams(amount: number, unit: YeastUnit, type: YeastType): number | null {
  if (!Number.isFinite(amount) || amount < 0) return null;
  switch (unit) {
    case 'g':
      return amount;
    case 'oz':
      return amount * GRAMS_PER_OZ;
    case 'tsp':
      return type === 'fresh' ? null : amount * DRY_YEAST_GRAMS_PER_TSP;
    case 'packet':
      return type === 'fresh' ? null : amount * GRAMS_PER_PACKET;
    case 'cube':
      return type === 'fresh' ? amount * GRAMS_PER_CUBE : null;
    default:
      return null;
  }
}

export type YeastGrams = Record<YeastType, number>;

/** Equivalent grams of every yeast type for a given amount of one type. */
export function convertYeastGrams(grams: number, from: YeastType): YeastGrams {
  const instant = grams / YEAST_FACTORS[from];
  return {
    fresh: instant * YEAST_FACTORS.fresh,
    active: instant * YEAST_FACTORS.active,
    instant,
  };
}

export function convertYeast(amount: number, unit: YeastUnit, from: YeastType): YeastGrams | null {
  const grams = yeastToGrams(amount, unit, from);
  return grams === null ? null : convertYeastGrams(grams, from);
}

export function flourToGrams(amount: number, unit: FlourUnit): number | null {
  if (!Number.isFinite(amount) || amount < 0) return null;
  if (unit === 'kg') return amount * 1000;
  if (unit === 'cup') return amount * GRAMS_PER_CUP_FLOUR;
  return amount;
}

/** Typical package dosage of each yeast type for a standard dough with this much flour. */
export function yeastForFlour(flourGrams: number): YeastGrams {
  return convertYeastGrams(flourGrams * INSTANT_YEAST_PER_FLOUR, 'instant');
}

export interface SourdoughSwapInput {
  flourGrams: number;
  waterGrams?: number | null;
  starterPercent?: number;
  starterHydration?: number;
}

export interface SourdoughSwapResult {
  starterGrams: number;
  starterFlourGrams: number;
  starterWaterGrams: number;
  flourToAddGrams: number;
  waterToAddGrams: number | null;
  /** Commercial yeast this replaces at standard package dosage. */
  replacesYeast: YeastGrams;
}

/**
 * Rule of thumb: use active starter worth ~20 % of the recipe's flour weight and
 * take the flour and water it contains out of the dough so totals stay the same.
 */
export function sourdoughSwap({
  flourGrams,
  waterGrams = null,
  starterPercent = SOURDOUGH_DEFAULT_STARTER_PERCENT,
  starterHydration = SOURDOUGH_DEFAULT_STARTER_HYDRATION,
}: SourdoughSwapInput): SourdoughSwapResult {
  const starterGrams = (flourGrams * starterPercent) / 100;
  const hydration = starterHydration / 100;
  const starterFlourGrams = starterGrams / (1 + hydration);
  const starterWaterGrams = starterGrams - starterFlourGrams;
  return {
    starterGrams,
    starterFlourGrams,
    starterWaterGrams,
    flourToAddGrams: Math.max(0, flourGrams - starterFlourGrams),
    waterToAddGrams:
      waterGrams === null || waterGrams === undefined ? null : Math.max(0, waterGrams - starterWaterGrams),
    replacesYeast: yeastForFlour(flourGrams),
  };
}

export interface LeaveningForFlour {
  bakingPowderGrams: number;
  bakingPowderTsp: number;
  bakingPowderPackets: number;
  /** Baking soda (plus an acid) that replaces that much baking powder, by volume rule. */
  bakingSodaTsp: number;
  bakingSodaGrams: number;
  creamOfTartarTsp: number;
}

/** Typical baking powder for cakes/muffins with this much flour (≈ 3 % of flour weight). */
export function leaveningForFlour(flourGrams: number): LeaveningForFlour {
  const bakingPowderGrams = flourGrams * BAKING_POWDER_PER_FLOUR;
  const bakingPowderTsp = bakingPowderGrams / BAKING_POWDER_GRAMS_PER_TSP;
  const bakingSodaTsp = bakingPowderTsp * SODA_TSP_PER_BAKING_POWDER_TSP;
  return {
    bakingPowderGrams,
    bakingPowderTsp,
    bakingPowderPackets: bakingPowderGrams / GRAMS_PER_BAKING_POWDER_PACKET,
    bakingSodaTsp,
    bakingSodaGrams: bakingSodaTsp * BAKING_SODA_GRAMS_PER_TSP,
    creamOfTartarTsp: bakingPowderTsp * CREAM_OF_TARTAR_TSP_PER_BAKING_POWDER_TSP,
  };
}

/* ---------- Formatting ---------- */

export function formatNumber(value: number, locale: 'en' | 'de', maxDigits = 1): string {
  const digits = value !== 0 && Math.abs(value) < 1 ? Math.max(maxDigits, 2) : maxDigits;
  return new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
    maximumFractionDigits: digits,
  }).format(value);
}

const EIGHTHS: Record<number, string> = { 1: '⅛', 2: '¼', 3: '⅜', 4: '½', 5: '⅝', 6: '¾', 7: '⅞' };

/** Rounds teaspoons to the nearest ⅛ and renders kitchen fractions, e.g. 2.25 → "2¼". */
export function formatSpoons(value: number): string {
  const eighths = Math.round(value * 8);
  if (eighths === 0) return value > 0 ? '<⅛' : '0';
  const whole = Math.floor(eighths / 8);
  const rest = eighths % 8;
  if (!rest) return String(whole);
  return `${whole || ''}${EIGHTHS[rest]}`;
}

/* ---------- Static reference rows ---------- */

export const FRESH_REFERENCE_GRAMS = [5, 7, 10, 14, 17, 21, 25, 30, 42, 84];
export const PACKET_REFERENCE_COUNTS = [0.5, 1, 1.5, 2, 3];
export const FLOUR_REFERENCE_GRAMS = [250, 500, 750, 1000];
