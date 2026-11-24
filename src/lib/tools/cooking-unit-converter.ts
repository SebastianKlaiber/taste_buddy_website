/**
 * Pure conversion logic and reference data for the cooking unit converter tool
 * (/tools/cooking-unit-converter/ and /de/tools/kuechen-umrechner/).
 *
 * Everything here is framework-free so it can run in the Astro build (static
 * reference tables) and in the browser (live converter).
 */

export type ConverterLocale = 'en' | 'de';
export type Dimension = 'volume' | 'weight';

export type VolumeUnitId = 'tsp' | 'tbsp' | 'floz' | 'cup' | 'pint' | 'quart' | 'gallon' | 'ml' | 'l';
export type WeightUnitId = 'oz' | 'lb' | 'g' | 'kg';
export type UnitId = VolumeUnitId | WeightUnitId;

export interface UnitDefinition {
  id: UnitId;
  dimension: Dimension;
  /** Millilitres for volume units, grams for weight units. */
  base: number;
  label: Record<ConverterLocale, string>;
  /** Short symbol used next to numbers. */
  symbol: Record<ConverterLocale, string>;
}

/** US customary volume units (US cup = 236.588 ml) plus metric. */
export const UNITS: readonly UnitDefinition[] = [
  { id: 'tsp', dimension: 'volume', base: 4.92892, label: { en: 'Teaspoon (tsp)', de: 'Teelöffel (TL)' }, symbol: { en: 'tsp', de: 'TL' } },
  { id: 'tbsp', dimension: 'volume', base: 14.7868, label: { en: 'Tablespoon (tbsp)', de: 'Esslöffel (EL)' }, symbol: { en: 'tbsp', de: 'EL' } },
  { id: 'floz', dimension: 'volume', base: 29.5735, label: { en: 'Fluid ounce (fl oz)', de: 'Flüssigunze (fl oz)' }, symbol: { en: 'fl oz', de: 'fl oz' } },
  { id: 'cup', dimension: 'volume', base: 236.588, label: { en: 'Cup (US)', de: 'Cup (US-Tasse)' }, symbol: { en: 'cup', de: 'Cup' } },
  { id: 'pint', dimension: 'volume', base: 473.176, label: { en: 'Pint (US)', de: 'Pint (US)' }, symbol: { en: 'pt', de: 'pt' } },
  { id: 'quart', dimension: 'volume', base: 946.353, label: { en: 'Quart (US)', de: 'Quart (US)' }, symbol: { en: 'qt', de: 'qt' } },
  { id: 'gallon', dimension: 'volume', base: 3785.41, label: { en: 'Gallon (US)', de: 'Gallone (US)' }, symbol: { en: 'gal', de: 'gal' } },
  { id: 'ml', dimension: 'volume', base: 1, label: { en: 'Millilitre (ml)', de: 'Milliliter (ml)' }, symbol: { en: 'ml', de: 'ml' } },
  { id: 'l', dimension: 'volume', base: 1000, label: { en: 'Litre (l)', de: 'Liter (l)' }, symbol: { en: 'l', de: 'l' } },
  { id: 'oz', dimension: 'weight', base: 28.3495, label: { en: 'Ounce (oz)', de: 'Unze (oz)' }, symbol: { en: 'oz', de: 'oz' } },
  { id: 'lb', dimension: 'weight', base: 453.592, label: { en: 'Pound (lb)', de: 'Pfund (lb, US)' }, symbol: { en: 'lb', de: 'lb' } },
  { id: 'g', dimension: 'weight', base: 1, label: { en: 'Gram (g)', de: 'Gramm (g)' }, symbol: { en: 'g', de: 'g' } },
  { id: 'kg', dimension: 'weight', base: 1000, label: { en: 'Kilogram (kg)', de: 'Kilogramm (kg)' }, symbol: { en: 'kg', de: 'kg' } },
];

export function getUnit(id: string): UnitDefinition | undefined {
  return UNITS.find((unit) => unit.id === id);
}

export function unitsForDimension(dimension: Dimension): UnitDefinition[] {
  return UNITS.filter((unit) => unit.dimension === dimension);
}

const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 1 / 2,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 1 / 4,
  '¾': 3 / 4,
  '⅛': 1 / 8,
  '⅜': 3 / 8,
  '⅝': 5 / 8,
  '⅞': 7 / 8,
};

/**
 * Parses kitchen-style amounts: "2", "1.5", "0,5" (German comma), "1/2",
 * "1 1/2", "1-1/2", "½", "1½". Returns null for anything else.
 */
export function parseAmount(raw: string): number | null {
  let input = raw.trim().replace(/\s+/g, ' ');
  if (!input) return null;

  // Unicode vulgar fractions, optionally after a whole number ("1½", "1 ½").
  const fractionChar = Object.keys(UNICODE_FRACTIONS).find((char) => input.endsWith(char));
  if (fractionChar) {
    const whole = input.slice(0, -1).trim();
    if (whole === '') return UNICODE_FRACTIONS[fractionChar];
    if (!/^\d+$/.test(whole)) return null;
    return Number(whole) + UNICODE_FRACTIONS[fractionChar];
  }

  input = input.replace(/(\d)\s*-\s*(\d+\s*\/)/, '$1 $2');

  const mixed = input.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const denominator = Number(mixed[3]);
    if (denominator === 0) return null;
    return Number(mixed[1]) + Number(mixed[2]) / denominator;
  }

  const fraction = input.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fraction) {
    const denominator = Number(fraction[2]);
    if (denominator === 0) return null;
    return Number(fraction[1]) / denominator;
  }

  return parseDecimal(input);
}

function parseDecimal(input: string): number | null {
  if (!/^\d*[.,]?\d+$|^\d+[.,]$/.test(input)) return null;
  const value = Number(input.replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

/** Converts between two units of the same dimension. Returns null on dimension mismatch. */
export function convertUnits(amount: number, fromId: UnitId, toId: UnitId): number | null {
  const from = getUnit(fromId);
  const to = getUnit(toId);
  if (!from || !to || from.dimension !== to.dimension) return null;
  return (amount * from.base) / to.base;
}

/* ------------------------------------------------------------------------ */
/* Ingredients: cups/spoons <-> grams                                        */
/* ------------------------------------------------------------------------ */

export interface Ingredient {
  id: string;
  name: Record<ConverterLocale, string>;
  /** Grams in one level US cup (236.588 ml). */
  gramsPerCup: number;
  /** Where the number comes from. */
  basis: 'king-arthur' | 'density';
}

const CUP_ML = 236.588;
const fromDensity = (gramsPerMl: number) => Math.round(gramsPerMl * CUP_ML * 10) / 10;

/**
 * Dry ingredients: King Arthur Baking ingredient weight chart (spooned and
 * levelled, not packed – except brown sugar, which is packed).
 * Liquids: typical density × 236.588 ml.
 */
export const INGREDIENTS: readonly Ingredient[] = [
  { id: 'ap-flour', name: { en: 'All-purpose flour', de: 'Weizenmehl (Type 405/550)' }, gramsPerCup: 120, basis: 'king-arthur' },
  { id: 'ww-flour', name: { en: 'Whole wheat flour', de: 'Vollkornmehl' }, gramsPerCup: 113, basis: 'king-arthur' },
  { id: 'sugar', name: { en: 'Granulated sugar', de: 'Zucker (Kristallzucker)' }, gramsPerCup: 198, basis: 'king-arthur' },
  { id: 'brown-sugar', name: { en: 'Brown sugar (packed)', de: 'Brauner Zucker (gepresst)' }, gramsPerCup: 213, basis: 'king-arthur' },
  { id: 'powdered-sugar', name: { en: 'Powdered sugar', de: 'Puderzucker' }, gramsPerCup: 113, basis: 'king-arthur' },
  { id: 'butter', name: { en: 'Butter', de: 'Butter' }, gramsPerCup: 227, basis: 'king-arthur' },
  { id: 'cocoa', name: { en: 'Cocoa powder', de: 'Kakaopulver' }, gramsPerCup: 84, basis: 'king-arthur' },
  { id: 'oats', name: { en: 'Rolled oats', de: 'Haferflocken' }, gramsPerCup: 89, basis: 'king-arthur' },
  { id: 'rice', name: { en: 'Rice (uncooked)', de: 'Reis (ungekocht)' }, gramsPerCup: 198, basis: 'king-arthur' },
  { id: 'chocolate-chips', name: { en: 'Chocolate chips', de: 'Schokotropfen' }, gramsPerCup: 170, basis: 'king-arthur' },
  { id: 'ground-almonds', name: { en: 'Ground almonds (almond flour)', de: 'Gemahlene Mandeln' }, gramsPerCup: 96, basis: 'king-arthur' },
  { id: 'water', name: { en: 'Water', de: 'Wasser' }, gramsPerCup: fromDensity(1.0), basis: 'density' },
  { id: 'milk', name: { en: 'Milk', de: 'Milch' }, gramsPerCup: fromDensity(1.03), basis: 'density' },
  { id: 'oil', name: { en: 'Vegetable oil', de: 'Öl (Pflanzenöl)' }, gramsPerCup: fromDensity(0.92), basis: 'density' },
  { id: 'honey', name: { en: 'Honey', de: 'Honig' }, gramsPerCup: fromDensity(1.42), basis: 'density' },
  { id: 'heavy-cream', name: { en: 'Heavy cream', de: 'Sahne (Schlagsahne)' }, gramsPerCup: fromDensity(1.0), basis: 'density' },
];

export function getIngredient(id: string): Ingredient | undefined {
  return INGREDIENTS.find((ingredient) => ingredient.id === id);
}

export interface IngredientResult {
  grams: number;
  millilitres: number;
}

/**
 * Converts an amount of an ingredient given in any volume or weight unit into
 * grams and millilitres. Callers then express it in whichever unit they need.
 */
export function convertIngredient(amount: number, unitId: UnitId, ingredientId: string): IngredientResult | null {
  const unit = getUnit(unitId);
  const ingredient = getIngredient(ingredientId);
  if (!unit || !ingredient) return null;
  const gramsPerMl = ingredient.gramsPerCup / CUP_ML;
  if (unit.dimension === 'volume') {
    const millilitres = amount * unit.base;
    return { millilitres, grams: millilitres * gramsPerMl };
  }
  const grams = amount * unit.base;
  return { grams, millilitres: grams / gramsPerMl };
}

/* ------------------------------------------------------------------------ */
/* Butter                                                                    */
/* ------------------------------------------------------------------------ */

/** One US stick of butter = 4 oz = 113.4 g = 8 tbsp = ½ cup. */
export const BUTTER_STICK_GRAMS = 113.398;

export type ButterUnitId = 'stick' | 'g' | 'tbsp' | 'cup' | 'oz';

/** Grams per one of each butter unit (US measures, by weight). */
export const BUTTER_UNITS: Record<ButterUnitId, number> = {
  stick: BUTTER_STICK_GRAMS,
  g: 1,
  tbsp: BUTTER_STICK_GRAMS / 8,
  cup: BUTTER_STICK_GRAMS * 2,
  oz: 28.3495,
};

export function convertButter(amount: number, unitId: ButterUnitId): Record<ButterUnitId, number> {
  const grams = amount * BUTTER_UNITS[unitId];
  return {
    stick: grams / BUTTER_UNITS.stick,
    g: grams,
    tbsp: grams / BUTTER_UNITS.tbsp,
    cup: grams / BUTTER_UNITS.cup,
    oz: grams / BUTTER_UNITS.oz,
  };
}

/* ------------------------------------------------------------------------ */
/* Oven temperature                                                          */
/* ------------------------------------------------------------------------ */

export type TempUnit = 'F' | 'C';
export type OvenMode = 'conventional' | 'fan';

export const FAN_OFFSET_C = 20;
export const FAN_OFFSET_F = 25;

export const fahrenheitToCelsius = (f: number) => ((f - 32) * 5) / 9;
export const celsiusToFahrenheit = (c: number) => (c * 9) / 5 + 32;

export interface GasMark {
  mark: string;
  fahrenheit: number;
  celsius: number;
}

/** Common UK gas mark equivalents (conventional oven). */
export const GAS_MARKS: readonly GasMark[] = [
  { mark: '¼', fahrenheit: 225, celsius: 110 },
  { mark: '½', fahrenheit: 250, celsius: 120 },
  { mark: '1', fahrenheit: 275, celsius: 140 },
  { mark: '2', fahrenheit: 300, celsius: 150 },
  { mark: '3', fahrenheit: 325, celsius: 160 },
  { mark: '4', fahrenheit: 350, celsius: 180 },
  { mark: '5', fahrenheit: 375, celsius: 190 },
  { mark: '6', fahrenheit: 400, celsius: 200 },
  { mark: '7', fahrenheit: 425, celsius: 220 },
  { mark: '8', fahrenheit: 450, celsius: 230 },
  { mark: '9', fahrenheit: 475, celsius: 240 },
];

export interface OvenResult {
  conventionalC: number;
  conventionalF: number;
  fanC: number;
  fanF: number;
  gasMark: string | null;
}

/**
 * Converts an oven temperature. `mode` says whether the input is for a
 * conventional (top/bottom heat) or a fan/convection oven.
 */
export function convertOven(value: number, unit: TempUnit, mode: OvenMode): OvenResult {
  // Normalise to a conventional temperature in the input unit, then convert.
  let conventionalC: number;
  let conventionalF: number;
  if (unit === 'C') {
    conventionalC = mode === 'fan' ? value + FAN_OFFSET_C : value;
    conventionalF = celsiusToFahrenheit(conventionalC);
  } else {
    conventionalF = mode === 'fan' ? value + FAN_OFFSET_F : value;
    conventionalC = fahrenheitToCelsius(conventionalF);
  }
  return {
    conventionalC,
    conventionalF,
    fanC: conventionalC - FAN_OFFSET_C,
    fanF: conventionalF - FAN_OFFSET_F,
    gasMark: nearestGasMark(conventionalF),
  };
}

/** Nearest gas mark within ±12.5 °F, or null if outside the gas mark range. */
export function nearestGasMark(fahrenheit: number): string | null {
  let best: GasMark | null = null;
  for (const gas of GAS_MARKS) {
    if (!best || Math.abs(gas.fahrenheit - fahrenheit) < Math.abs(best.fahrenheit - fahrenheit)) best = gas;
  }
  return best && Math.abs(best.fahrenheit - fahrenheit) <= 12.5 ? best.mark : null;
}

/* ------------------------------------------------------------------------ */
/* Formatting                                                                */
/* ------------------------------------------------------------------------ */

/** Rounds sensibly for the kitchen: more decimals for small numbers. */
export function formatNumber(value: number, locale: ConverterLocale, maxDecimals?: number): string {
  const abs = Math.abs(value);
  const decimals = maxDecimals ?? (abs === 0 ? 0 : abs < 0.1 ? 3 : abs < 10 ? 2 : abs < 1000 ? 1 : 0);
  return new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(value);
}

const KITCHEN_FRACTIONS: ReadonlyArray<[number, string]> = [
  [0, ''],
  [1 / 8, '⅛'],
  [1 / 4, '¼'],
  [1 / 3, '⅓'],
  [3 / 8, '⅜'],
  [1 / 2, '½'],
  [5 / 8, '⅝'],
  [2 / 3, '⅔'],
  [3 / 4, '¾'],
  [7 / 8, '⅞'],
  [1, ''],
];

/**
 * Expresses a value as a measuring-cup style fraction ("1 ½") when it is within
 * 3 % of one (values below 20 only); returns null otherwise.
 */
export function toKitchenFraction(value: number): string | null {
  if (!(value > 0) || value >= 20) return null;
  const whole = Math.floor(value);
  const rest = value - whole;
  let best: [number, string] = KITCHEN_FRACTIONS[0];
  for (const candidate of KITCHEN_FRACTIONS) {
    if (Math.abs(candidate[0] - rest) < Math.abs(best[0] - rest)) best = candidate;
  }
  const approx = whole + best[0];
  if (approx === 0 || Math.abs(approx - value) / value > 0.03) return null;
  const wholePart = best[0] === 1 ? whole + 1 : whole;
  if (!best[1]) return String(wholePart);
  return wholePart === 0 ? best[1] : `${wholePart} ${best[1]}`;
}

/* ------------------------------------------------------------------------ */
/* Localized result text (shared by the static first render and the script) */
/* ------------------------------------------------------------------------ */

export interface ResultText {
  main: string;
  details: string[];
}

const fmt = formatNumber;

/** Unit symbol with an English plural for cups ("2 cups"). */
export function unitSymbol(id: UnitId, amount: number, locale: ConverterLocale): string {
  const unit = getUnit(id);
  if (!unit) return id;
  if (id === 'cup' && locale === 'en' && Math.abs(amount - 1) > 1e-9) return 'cups';
  return unit.symbol[locale];
}

function withFraction(value: number, id: UnitId, locale: ConverterLocale): string {
  const base = `${fmt(value, locale)} ${unitSymbol(id, value, locale)}`;
  if (id !== 'cup' && id !== 'tbsp' && id !== 'tsp') return base;
  const fraction = toKitchenFraction(value);
  if (!fraction || fraction === fmt(value, locale)) return base;
  return `${base} (${locale === 'de' ? 'ca.' : '≈'} ${fraction})`;
}

export function describeGeneral(amount: number, fromId: UnitId, toId: UnitId, locale: ConverterLocale): ResultText | null {
  const result = convertUnits(amount, fromId, toId);
  const from = getUnit(fromId);
  if (result === null || !from) return null;
  const details = unitsForDimension(from.dimension)
    .filter((unit) => unit.id !== fromId && unit.id !== toId)
    .map((unit) => withFraction(convertUnits(amount, fromId, unit.id) ?? 0, unit.id, locale));
  return {
    main: `${fmt(amount, locale)} ${unitSymbol(fromId, amount, locale)} = ${withFraction(result, toId, locale)}`,
    details,
  };
}

export const INGREDIENT_UNIT_IDS: readonly UnitId[] = ['cup', 'tbsp', 'tsp', 'ml', 'g', 'oz'];

export function describeIngredient(amount: number, unitId: UnitId, ingredientId: string, locale: ConverterLocale): ResultText | null {
  const result = convertIngredient(amount, unitId, ingredientId);
  const ingredient = getIngredient(ingredientId);
  const unit = getUnit(unitId);
  if (!result || !ingredient || !unit) return null;
  const approx = locale === 'de' ? 'ca.' : '≈';
  const name = locale === 'en' ? ingredient.name.en.toLowerCase() : ingredient.name.de;
  const input = `${fmt(amount, locale)} ${unitSymbol(unitId, amount, locale)} ${name}`;
  if (unit.dimension === 'volume') {
    return {
      main: `${input} ${approx} ${fmt(result.grams, locale)} g`,
      details: [`${approx} ${fmt(result.grams / 28.3495, locale)} oz`, `${approx} ${fmt(result.millilitres, locale)} ml`],
    };
  }
  const cups = result.millilitres / 236.588;
  return {
    main: `${input} ${approx} ${withFraction(cups, 'cup', locale)}`,
    details: [
      `${approx} ${withFraction(result.millilitres / 14.7868, 'tbsp', locale)}`,
      `${approx} ${fmt(result.millilitres, locale)} ml`,
    ],
  };
}

export const BUTTER_UNIT_ORDER: readonly ButterUnitId[] = ['stick', 'g', 'tbsp', 'cup', 'oz'];

const BUTTER_LABELS: Record<ButterUnitId, Record<ConverterLocale, [string, string]>> = {
  stick: { en: ['stick', 'sticks'], de: ['Stick', 'Sticks'] },
  g: { en: ['g', 'g'], de: ['g', 'g'] },
  tbsp: { en: ['tbsp', 'tbsp'], de: ['EL', 'EL'] },
  cup: { en: ['cup', 'cups'], de: ['Cup', 'Cups'] },
  oz: { en: ['oz', 'oz'], de: ['oz', 'oz'] },
};

export function butterLabel(id: ButterUnitId, amount: number, locale: ConverterLocale): string {
  const [singular, plural] = BUTTER_LABELS[id][locale];
  return Math.abs(amount - 1) < 1e-9 ? singular : plural;
}

function formatButter(value: number, id: ButterUnitId, locale: ConverterLocale): string {
  const base = `${fmt(value, locale, id === 'g' && value < 1000 ? 1 : undefined)} ${butterLabel(id, value, locale)}`;
  if (id === 'g' || id === 'oz') return base;
  const fraction = toKitchenFraction(value);
  if (!fraction || fraction === fmt(value, locale)) return base;
  return `${base} (${locale === 'de' ? 'ca.' : '≈'} ${fraction})`;
}

export function describeButter(amount: number, unitId: ButterUnitId, locale: ConverterLocale): ResultText {
  const all = convertButter(amount, unitId);
  const butter = locale === 'de' ? 'Butter' : 'butter';
  const mainTarget: ButterUnitId = unitId === 'g' ? 'stick' : 'g';
  return {
    main: `${fmt(amount, locale)} ${butterLabel(unitId, amount, locale)} ${butter} = ${formatButter(all[mainTarget], mainTarget, locale)}`,
    details: BUTTER_UNIT_ORDER.filter((id) => id !== unitId && id !== mainTarget).map((id) => formatButter(all[id], id, locale)),
  };
}

export function describeOven(value: number, unit: TempUnit, mode: OvenMode, locale: ConverterLocale): ResultText {
  const r = convertOven(value, unit, mode);
  const round = (n: number) => fmt(Math.round(n), locale, 0);
  const inputLabel = `${round(value)} °${unit}`;
  const otherUnit = unit === 'C' ? 'F' : 'C';
  const otherValue = mode === 'fan' ? (otherUnit === 'C' ? r.fanC : r.fanF) : otherUnit === 'C' ? r.conventionalC : r.conventionalF;
  const labels =
    locale === 'de'
      ? { conventional: 'Ober-/Unterhitze', fan: 'Umluft', gas: 'Gasherd: Stufe', noGas: 'Gasherd: außerhalb der Stufen-Skala' }
      : { conventional: 'Conventional', fan: 'Fan / convection', gas: 'Gas mark', noGas: 'Gas mark: outside the gas mark range' };
  return {
    main: `${inputLabel} ${mode === 'fan' ? `(${labels.fan}) ` : ''}= ${round(otherValue)} °${otherUnit}`,
    details: [
      `${labels.conventional}: ${round(r.conventionalC)} °C / ${round(r.conventionalF)} °F`,
      `${labels.fan}: ${round(r.fanC)} °C / ${round(r.fanF)} °F`,
      r.gasMark ? `${labels.gas} ${r.gasMark}` : labels.noGas,
    ],
  };
}
