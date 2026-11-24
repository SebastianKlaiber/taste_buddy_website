// Pure math and reference data for the baking pan size converter (EN + DE).

export type PanShape = 'round' | 'square' | 'rectangle' | 'loaf';
export type LengthUnit = 'in' | 'cm';
export type PanLocale = 'en' | 'de';

export const CM_PER_INCH = 2.54;

export interface PanInput {
  shape: PanShape;
  unit: LengthUnit;
  /** Diameter (round), side (square) or width (rectangle, loaf). */
  a: number;
  /** Length (rectangle, loaf). Ignored for round and square. */
  b?: number;
}

export function toCm(value: number, unit: LengthUnit) {
  return unit === 'in' ? value * CM_PER_INCH : value;
}

/** Base area in cm², or null when the input is incomplete. */
export function panAreaCm2(pan: PanInput): number | null {
  const a = toCm(pan.a, pan.unit);
  if (!(a > 0)) return null;
  switch (pan.shape) {
    case 'round':
      return Math.PI * (a / 2) ** 2;
    case 'square':
      return a * a;
    case 'rectangle':
    case 'loaf': {
      const b = toCm(pan.b ?? 0, pan.unit);
      return b > 0 ? a * b : null;
    }
  }
}

export interface PanConversion {
  fromArea: number;
  toArea: number;
  /** New area ÷ original area = ingredient multiplier at the same batter depth. */
  factor: number;
  /** Batter depth change if the original amount goes into the new pan (1 = same). */
  depthRatioSameAmount: number;
  timeHint: 'same' | 'shallower' | 'deeper' | 'much-deeper';
}

export function convertPan(from: PanInput, to: PanInput): PanConversion | null {
  const fromArea = panAreaCm2(from);
  const toArea = panAreaCm2(to);
  if (!fromArea || !toArea) return null;
  const factor = toArea / fromArea;
  const depthRatioSameAmount = fromArea / toArea;
  let timeHint: PanConversion['timeHint'] = 'same';
  if (depthRatioSameAmount > 1.4) timeHint = 'much-deeper';
  else if (depthRatioSameAmount > 1.08) timeHint = 'deeper';
  else if (depthRatioSameAmount < 0.92) timeHint = 'shallower';
  return { fromArea, toArea, factor, depthRatioSameAmount, timeHint };
}

/** Rounds a multiplier to an easy number (0.1 steps below 2, quarters up to 4, halves above). */
export function practicalFactor(factor: number) {
  const step = factor < 2 ? 0.1 : factor < 4 ? 0.25 : 0.5;
  return Math.max(step, Math.round((Math.round(factor / step) * step) * 100) / 100);
}

export interface PanPreset {
  id: string;
  /** Region the size is typical for (helps sort the table per locale). */
  region: 'us' | 'de';
  shape: PanShape;
  unit: LengthUnit;
  a: number;
  b?: number;
  label: { en: string; de: string };
}

export const PAN_PRESETS: PanPreset[] = [
  { id: 'us-round-8', region: 'us', shape: 'round', unit: 'in', a: 8, label: { en: '8-inch round cake pan', de: 'Runde Form 8 Zoll (20 cm)' } },
  { id: 'us-round-9', region: 'us', shape: 'round', unit: 'in', a: 9, label: { en: '9-inch round cake pan', de: 'Runde Form 9 Zoll (23 cm)' } },
  { id: 'us-round-10', region: 'us', shape: 'round', unit: 'in', a: 10, label: { en: '10-inch round / springform', de: 'Runde Form 10 Zoll (25 cm)' } },
  { id: 'us-square-8', region: 'us', shape: 'square', unit: 'in', a: 8, label: { en: '8 × 8-inch square pan', de: 'Quadratische Form 8 × 8 Zoll' } },
  { id: 'us-square-9', region: 'us', shape: 'square', unit: 'in', a: 9, label: { en: '9 × 9-inch square pan', de: 'Quadratische Form 9 × 9 Zoll' } },
  { id: 'us-rect-9x13', region: 'us', shape: 'rectangle', unit: 'in', a: 9, b: 13, label: { en: '9 × 13-inch baking pan', de: 'Auflaufform 9 × 13 Zoll' } },
  { id: 'us-loaf-8', region: 'us', shape: 'loaf', unit: 'in', a: 4.5, b: 8.5, label: { en: '8½ × 4½-inch loaf pan', de: 'Kastenform 8½ × 4½ Zoll' } },
  { id: 'us-loaf-9', region: 'us', shape: 'loaf', unit: 'in', a: 5, b: 9, label: { en: '9 × 5-inch loaf pan', de: 'Kastenform 9 × 5 Zoll' } },
  { id: 'us-half-sheet', region: 'us', shape: 'rectangle', unit: 'in', a: 13, b: 18, label: { en: 'Half sheet pan (18 × 13 in)', de: 'Half Sheet Pan (46 × 33 cm)' } },
  { id: 'de-springform-18', region: 'de', shape: 'round', unit: 'cm', a: 18, label: { en: '18 cm springform', de: 'Springform 18 cm' } },
  { id: 'de-springform-20', region: 'de', shape: 'round', unit: 'cm', a: 20, label: { en: '20 cm springform', de: 'Springform 20 cm' } },
  { id: 'de-springform-22', region: 'de', shape: 'round', unit: 'cm', a: 22, label: { en: '22 cm springform', de: 'Springform 22 cm' } },
  { id: 'de-springform-24', region: 'de', shape: 'round', unit: 'cm', a: 24, label: { en: '24 cm springform', de: 'Springform 24 cm' } },
  { id: 'de-springform-26', region: 'de', shape: 'round', unit: 'cm', a: 26, label: { en: '26 cm springform (German standard)', de: 'Springform 26 cm (Standard)' } },
  { id: 'de-springform-28', region: 'de', shape: 'round', unit: 'cm', a: 28, label: { en: '28 cm springform', de: 'Springform 28 cm' } },
  { id: 'de-loaf-25', region: 'de', shape: 'loaf', unit: 'cm', a: 11, b: 25, label: { en: '25 cm loaf pan (Kastenform)', de: 'Kastenform 25 cm (25 × 11 cm)' } },
  { id: 'de-loaf-30', region: 'de', shape: 'loaf', unit: 'cm', a: 11, b: 30, label: { en: '30 cm loaf pan (Kastenform)', de: 'Kastenform 30 cm (30 × 11 cm)' } },
  { id: 'de-sheet', region: 'de', shape: 'rectangle', unit: 'cm', a: 30, b: 40, label: { en: 'German baking tray (Blech, approx. 40 × 30 cm)', de: 'Backblech (ca. 40 × 30 cm)' } },
];

export function presetToInput(preset: PanPreset): PanInput {
  return { shape: preset.shape, unit: preset.unit, a: preset.a, b: preset.b };
}

export function getPreset(id: string) {
  return PAN_PRESETS.find((preset) => preset.id === id) ?? null;
}

export interface PanTableRow {
  id: string;
  label: string;
  dimensions: string;
  areaCm2: number;
  areaIn2: number;
  /** Multiplier relative to the locale's reference pan. */
  factor: number;
}

function formatNumber(value: number, locale: PanLocale, digits = 1) {
  return new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', { maximumFractionDigits: digits }).format(value);
}

export function formatDimensions(pan: PanInput, locale: PanLocale) {
  const unit = pan.unit === 'in' ? (locale === 'de' ? ' Zoll' : ' in') : ' cm';
  const a = formatNumber(pan.a, locale);
  if (pan.shape === 'round') return `Ø ${a}${unit}`;
  if (pan.shape === 'square') return `${a} × ${a}${unit}`;
  // US recipes write the short side first (9 × 13 in), German ones the long side (40 × 30 cm).
  const sides = [pan.a, pan.b ?? 0].sort((x, y) => (locale === 'de' ? y - x : x - y));
  return `${formatNumber(sides[0], locale)} × ${formatNumber(sides[1], locale)}${unit}`;
}

/** Reference pan: 26 cm springform for German readers, 9-inch round for US readers. */
export const REFERENCE_PAN = { en: 'us-round-9', de: 'de-springform-26' } as const;

export function buildPanTable(locale: PanLocale): PanTableRow[] {
  const reference = panAreaCm2(presetToInput(getPreset(REFERENCE_PAN[locale])!))!;
  const ordered = [...PAN_PRESETS].sort((left, right) => {
    const leftHome = left.region === (locale === 'de' ? 'de' : 'us') ? 0 : 1;
    const rightHome = right.region === (locale === 'de' ? 'de' : 'us') ? 0 : 1;
    return leftHome - rightHome;
  });
  return ordered.map((preset) => {
    const input = presetToInput(preset);
    const areaCm2 = panAreaCm2(input)!;
    return {
      id: preset.id,
      label: preset.label[locale],
      dimensions: formatDimensions(input, locale),
      areaCm2,
      areaIn2: areaCm2 / CM_PER_INCH ** 2,
      factor: areaCm2 / reference,
    };
  });
}
