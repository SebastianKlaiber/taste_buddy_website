// Pure parsing and scaling logic for the recipe scaler tool (EN + DE).
// No DOM access here so it can be verified with a plain node/tsx script.

export type ScalerLocale = 'en' | 'de';

/** How a scaled amount should be written back. */
export type UnitStyle = 'fraction' | 'metric' | 'count';

interface UnitDef {
  id: string;
  style: UnitStyle;
  /** Lower-case spellings matched after the quantity. */
  aliases: string[];
  /** Case-sensitive spellings (e.g. EL/TL, T/t are ambiguous in lower case). */
  exact?: string[];
}

const UNITS: UnitDef[] = [
  // US volume / weight -> fractions
  { id: 'cup', style: 'fraction', aliases: ['cups', 'cup', 'c.', 'tassen', 'tasse'] },
  { id: 'tbsp', style: 'fraction', aliases: ['tablespoons', 'tablespoon', 'tbsps', 'tbsp.', 'tbsp', 'tbs.', 'tbs', 'tbl'], exact: ['T', 'Tbsp', 'TBSP'] },
  { id: 'tsp', style: 'fraction', aliases: ['teaspoons', 'teaspoon', 'tsps', 'tsp.', 'tsp'], exact: ['t'] },
  { id: 'el', style: 'fraction', aliases: ['esslöffel', 'essloeffel', 'el.', 'el'] },
  { id: 'tl', style: 'fraction', aliases: ['teelöffel', 'teeloeffel', 'tl.', 'tl'] },
  { id: 'oz', style: 'fraction', aliases: ['ounces', 'ounce', 'oz.', 'oz'] },
  { id: 'floz', style: 'fraction', aliases: ['fl. oz.', 'fl oz', 'fl.oz.', 'fl.oz', 'floz'] },
  { id: 'lb', style: 'fraction', aliases: ['pounds', 'pound', 'lbs.', 'lbs', 'lb.', 'lb'] },
  { id: 'pint', style: 'fraction', aliases: ['pints', 'pint', 'pt.', 'pt'] },
  { id: 'quart', style: 'fraction', aliases: ['quarts', 'quart', 'qt.', 'qt'] },
  // Metric -> rounded decimals
  { id: 'kg', style: 'metric', aliases: ['kilogramm', 'kilograms', 'kilogram', 'kg.', 'kg'] },
  { id: 'g', style: 'metric', aliases: ['gramm', 'grams', 'gram', 'gr.', 'gr', 'g.', 'g'] },
  { id: 'mg', style: 'metric', aliases: ['mg'] },
  { id: 'ml', style: 'metric', aliases: ['milliliter', 'millilitres', 'milliliters', 'ml.', 'ml'] },
  { id: 'cl', style: 'metric', aliases: ['cl'] },
  { id: 'dl', style: 'metric', aliases: ['dl'] },
  { id: 'l', style: 'metric', aliases: ['liter', 'litres', 'liters', 'litre', 'l.', 'l'] },
  // Countable things -> simple fractions (½, ¼) or whole numbers
  { id: 'pinch', style: 'count', aliases: ['pinches', 'pinch', 'prisen', 'prise', 'msp.', 'msp', 'messerspitze', 'messerspitzen'] },
  { id: 'piece', style: 'count', aliases: ['stück', 'stueck', 'stk.', 'stk', 'pieces', 'piece', 'pcs', 'pc'] },
  { id: 'packet', style: 'count', aliases: ['päckchen', 'paeckchen', 'pck.', 'pck', 'pkg.', 'pkg', 'packets', 'packet', 'packages', 'package', 'pkt.', 'pkt'] },
  { id: 'tub', style: 'count', aliases: ['becher'] },
  { id: 'can', style: 'count', aliases: ['dosen', 'dose', 'cans', 'can', 'tins', 'tin'] },
  { id: 'clove', style: 'count', aliases: ['zehen', 'zehe', 'cloves', 'clove'] },
  { id: 'bunch', style: 'count', aliases: ['bund', 'bunches', 'bunch'] },
  { id: 'slice', style: 'count', aliases: ['scheiben', 'scheibe', 'slices', 'slice'] },
  { id: 'stick', style: 'count', aliases: ['sticks', 'stick'] },
  { id: 'handful', style: 'count', aliases: ['handvoll', 'handfuls', 'handful'] },
];

// Longest alias first so "tbsp" wins over "t", "kg" over "g", etc.
const ALIAS_TABLE: { alias: string; unit: UnitDef; caseSensitive: boolean }[] = UNITS.flatMap((unit) => [
  ...unit.aliases.map((alias) => ({ alias, unit, caseSensitive: false })),
  ...(unit.exact ?? []).map((alias) => ({ alias, unit, caseSensitive: true })),
]).sort((a, b) => b.alias.length - a.alias.length);

const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 1 / 2, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 1 / 4, '¾': 3 / 4,
  '⅕': 1 / 5, '⅖': 2 / 5, '⅗': 3 / 5, '⅘': 4 / 5, '⅙': 1 / 6, '⅚': 5 / 6,
  '⅛': 1 / 8, '⅜': 3 / 8, '⅝': 5 / 8, '⅞': 7 / 8,
};
const UF = Object.keys(UNICODE_FRACTIONS).join('');

// One number: "1 1/2", "1½", "1 ½", "½", "1/4", "1.5", "1,5", "2".
const NUM = `(?:\\d+\\s+\\d+\\s*[/⁄]\\s*\\d+|\\d+\\s*[${UF}]|[${UF}]|\\d+\\s*[/⁄]\\s*\\d+|\\d+(?:[.,]\\d+)?|[.,]\\d+)`;
const RANGE_SEP = `(?:\\s*[-–—]\\s*|\\s+(?:to|or|bis|oder)\\s+)`;
const LEADING = new RegExp(`^(\\s*(?:[-*•·]\\s+)?)(${NUM})(?:(${RANGE_SEP})(${NUM}))?`, 'i');

/** Parses one number token. Returns null if it is not a number. */
export function parseNumber(raw: string): number | null {
  const text = raw.trim().replace(/[×x*]/gi, '').trim().replace('⁄', '/');
  if (!text) return null;

  let match = text.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (match) {
    const den = Number(match[3]);
    return den ? Number(match[1]) + Number(match[2]) / den : null;
  }
  match = text.match(new RegExp(`^(\\d+)?\\s*([${UF}])$`));
  if (match) {
    return Number(match[1] ?? 0) + UNICODE_FRACTIONS[match[2]];
  }
  match = text.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (match) {
    const den = Number(match[2]);
    return den ? Number(match[1]) / den : null;
  }
  match = text.match(/^(\d*)[.,](\d+)$/);
  if (match) {
    return Number(`${match[1] || '0'}.${match[2]}`);
  }
  if (/^\d+$/.test(text)) return Number(text);
  return null;
}

export interface ParsedLine {
  original: string;
  /** Text before the number (indentation, bullet). */
  prefix: string;
  /** null when the line has no leading quantity. */
  quantity: { min: number; max: number | null; rangeSeparator: string } | null;
  unit: { id: string; style: UnitStyle; text: string } | null;
  /** Everything after the quantity (unit included), unchanged. */
  rest: string;
  isEgg: boolean;
}

const EGG_RE = /(?<!\p{L})(eggs?|egg yolks?|egg whites?|eier|ei|eigelbe?|eidotter|eiweiße?|eiweisse?|eiklar)(?!\p{L})/iu;

function matchUnit(rest: string): ParsedLine['unit'] {
  const trimmed = rest.replace(/^\s+/, '');
  for (const entry of ALIAS_TABLE) {
    const head = trimmed.slice(0, entry.alias.length);
    const matches = entry.caseSensitive ? head === entry.alias : head.toLowerCase() === entry.alias;
    if (!matches) continue;
    const next = trimmed.charAt(entry.alias.length);
    // Unit must end at a word boundary ("g" must not match "garlic").
    if (next && /[\p{L}\d]/u.test(next)) continue;
    return { id: entry.unit.id, style: entry.unit.style, text: head };
  }
  return null;
}

export function parseLine(line: string): ParsedLine {
  const isEgg = EGG_RE.test(line);
  const match = line.match(LEADING);
  if (!match) {
    return { original: line, prefix: '', quantity: null, unit: null, rest: line, isEgg };
  }
  const [whole, prefix, first, sep, second] = match;
  const rest = line.slice(whole.length);
  const unit = matchUnit(rest);
  // "1.000 g" / "1,500 ml": a separator followed by exactly three digits is a thousands
  // separator for small metric units (nobody writes 1.5 g as "1.500 g").
  const thousands = (token: string | undefined) =>
    token && unit && ['g', 'mg', 'ml'].includes(unit.id) && /^\d{1,3}(?:[.,]\d{3})+$/.test(token.trim())
      ? Number(token.trim().replace(/[.,]/g, ''))
      : null;
  const min = thousands(first) ?? parseNumber(first);
  const max = second ? thousands(second) ?? parseNumber(second) : null;
  // "7-Up", "3D" style tokens: number glued to letters that are not a unit.
  // Without a unit the number must be followed by a space, "(" or the line end ("7-Up", "3D" stay as they are).
  if (min === null || (!unit && rest !== '' && !/^[\s(,]/.test(rest))) {
    return { original: line, prefix: '', quantity: null, unit: null, rest: line, isEgg };
  }
  return {
    original: line,
    prefix,
    quantity: { min, max, rangeSeparator: sep ?? '' },
    unit,
    rest,
    isEgg,
  };
}

const NICE_FRACTIONS: [number, string][] = [
  [1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [3 / 8, '⅜'], [1 / 2, '½'],
  [5 / 8, '⅝'], [2 / 3, '⅔'], [3 / 4, '¾'], [7 / 8, '⅞'],
];
const COUNT_FRACTIONS = NICE_FRACTIONS.filter(([value]) => [1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4].includes(value));

function formatDecimal(value: number, maxDigits: number, locale: ScalerLocale) {
  return new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
    maximumFractionDigits: maxDigits,
    useGrouping: false,
  }).format(value);
}

/** Writes a value as a whole number plus the closest kitchen fraction (⅛ steps, thirds). */
export function formatFraction(value: number, locale: ScalerLocale, fractions = NICE_FRACTIONS): string {
  if (value <= 0) return '0';
  let whole = Math.floor(value);
  const remainder = value - whole;
  let best: [number, string] = [0, ''];
  let bestDiff = remainder;
  for (const candidate of fractions) {
    const diff = Math.abs(remainder - candidate[0]);
    if (diff < bestDiff) {
      best = candidate;
      bestDiff = diff;
    }
  }
  if (Math.abs(1 - remainder) < bestDiff) {
    whole += 1;
    best = [0, ''];
  }
  // Very small amounts (< 1/16) would collapse to 0: keep a short decimal instead.
  if (whole === 0 && !best[1]) {
    return formatDecimal(value, 2, locale);
  }
  if (!best[1]) return String(whole);
  return whole ? `${whole} ${best[1]}` : best[1];
}

/** Rounds metric amounts the way recipes write them. */
export function formatMetric(value: number, unitId: string | null, locale: ScalerLocale): string {
  if (unitId === 'kg' || unitId === 'l') {
    return formatDecimal(Math.round(value * 100) / 100, 2, locale);
  }
  if (value >= 100) return formatDecimal(Math.round(value / 5) * 5, 0, locale);
  if (value >= 10) return formatDecimal(Math.round(value), 0, locale);
  return formatDecimal(Math.round(value * 10) / 10, 1, locale);
}

function formatAmount(value: number, line: ParsedLine, locale: ScalerLocale): string {
  const style = line.unit?.style;
  if (style === 'metric') return formatMetric(value, line.unit?.id ?? null, locale);
  if (style === 'count') return formatFraction(value, locale, COUNT_FRACTIONS);
  if (style === 'fraction') return formatFraction(value, locale);
  // No unit ("2 onions", "3 eggs"): whole numbers stay whole-ish, halves and quarters allowed.
  return formatFraction(value, locale, COUNT_FRACTIONS);
}

export interface ScaledLine {
  original: string;
  text: string;
  changed: boolean;
  /** Eggs that do not come out as a whole number. */
  eggWarning: boolean;
}

function isWhole(value: number) {
  return Math.abs(value - Math.round(value)) < 0.05;
}

export function scaleLine(line: string, factor: number, locale: ScalerLocale): ScaledLine {
  const parsed = parseLine(line);
  if (!parsed.quantity || !Number.isFinite(factor) || factor <= 0) {
    return { original: line, text: line, changed: false, eggWarning: false };
  }
  const { min, max, rangeSeparator } = parsed.quantity;
  const scaledMin = min * factor;
  const scaledMax = max === null ? null : max * factor;
  let amount = formatAmount(scaledMin, parsed, locale);
  if (scaledMax !== null) {
    amount += rangeSeparator + formatAmount(scaledMax, parsed, locale);
  }
  // Keep a space between a fraction like "1 ½" and a following unit that was glued ("1½cups").
  const rest = parsed.rest;
  const needsSpace = /[⅛¼⅓⅜½⅝⅔¾⅞]$/.test(amount) && rest && !/^\s/.test(rest) && /^[\p{L}]/u.test(rest);
  const text = `${parsed.prefix}${amount}${needsSpace ? ' ' : ''}${rest}`;
  const eggWarning =
    parsed.isEgg &&
    (!parsed.unit || parsed.unit.style === 'count') &&
    (!isWhole(scaledMin) || (scaledMax !== null && !isWhole(scaledMax)));
  return { original: line, text, changed: text !== line, eggWarning };
}

export interface ScaleResult {
  lines: ScaledLine[];
  text: string;
  scaledCount: number;
  eggWarning: boolean;
}

export function scaleRecipe(input: string, factor: number, locale: ScalerLocale): ScaleResult {
  const lines = input.split(/\r?\n/).map((line) => scaleLine(line, factor, locale));
  return {
    lines,
    text: lines.map((line) => line.text).join('\n'),
    scaledCount: lines.filter((line) => line.changed).length,
    eggWarning: lines.some((line) => line.eggWarning),
  };
}

/** Parses "×2", "x0.5", "1/2", "0,5", "2". */
export function parseFactor(raw: string): number | null {
  const value = parseNumber(raw);
  return value !== null && value > 0 && Number.isFinite(value) ? value : null;
}

export function factorFromServings(original: number, target: number): number | null {
  if (!(original > 0) || !(target > 0)) return null;
  return target / original;
}
