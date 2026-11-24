/**
 * Holiday roast calculator: pure data + logic, shared by the EN and DE tool pages.
 *
 * EN values follow USDA FSIS consumer guidance (timetables at the published oven temperature,
 * safe minimum internal temperatures, thawing rules). DE values follow BfR (70 °C core for
 * at least 2 minutes as the safety floor) plus common German cooking targets. All times are
 * estimates; the thermometer reading decides.
 */

export type RoastLocale = 'en' | 'de';
export type MeatId = 'turkey' | 'goose' | 'duck' | 'chicken' | 'beef' | 'pork' | 'ham';
export type OvenType = 'conventional' | 'fan';
export type WeightUnit = 'kg' | 'lb';

export const MEAT_IDS: MeatId[] = ['turkey', 'goose', 'duck', 'chicken', 'beef', 'pork', 'ham'];

export const LB_PER_KG = 2.20462;

export const kgToLb = (kg: number) => kg * LB_PER_KG;
export const lbToKg = (lb: number) => lb / LB_PER_KG;
export const fToC = (f: number) => ((f - 32) * 5) / 9;
export const cToF = (c: number) => (c * 9) / 5 + 32;

type Range = [number, number];

/** Weight brackets in the profile's native unit, times in minutes. */
interface BracketRow {
  from: number;
  to: number;
  unstuffed: Range;
  stuffed?: Range;
}

type Timing =
  | { kind: 'brackets'; unit: WeightUnit; rows: BracketRow[]; stuffedExtra?: Range }
  | {
      kind: 'perWeight';
      unit: WeightUnit;
      minutesPerUnit: Range;
      /** Different rate from this weight on (e.g. whole vs half ham). */
      heavy?: { from: number; minutesPerUnit: Range };
      stuffedExtra?: Range;
    };

export interface MeatProfile {
  id: MeatId;
  poultry: boolean;
  canStuff: boolean;
  /** Conventional (top/bottom heat) oven temperature in the profile's native scale. */
  ovenTemp: number;
  tempScale: 'F' | 'C';
  timing: Timing;
  /** Safety floor for the core temperature, native scale. */
  safeCore: number;
  /** Hold/rest time at the safe temperature, in minutes (USDA 3-minute rest, BfR 2 minutes). */
  safeHoldMinutes: number;
  /** Optional common cooking target (doneness), native scale. Not a safety value. */
  targetCore?: Range;
  rest: Range;
  /** Raw weight to buy per guest, in kg. Rule of thumb; omitted where no published figure was found. */
  buyPerGuestKg?: Range;
}

const range = (lo: number, hi: number): Range => [lo, hi];
const h = (hours: number) => Math.round(hours * 60);
/** min per lb -> min per kg */
const perKg = (minPerLb: number) => Math.round(minPerLb * LB_PER_KG);

/** USDA FSIS "Let's Talk Turkey" roasting timetable, oven at 325 °F, fresh or thawed turkey. */
export const USDA_TURKEY_ROWS: BracketRow[] = [
  { from: 4, to: 8, unstuffed: range(h(1.5), h(3.25)) },
  { from: 8, to: 12, unstuffed: range(h(2.75), h(3)), stuffed: range(h(3), h(3.5)) },
  { from: 12, to: 14, unstuffed: range(h(3), h(3.75)), stuffed: range(h(3.5), h(4)) },
  { from: 14, to: 18, unstuffed: range(h(3.75), h(4.25)), stuffed: range(h(4), h(4.25)) },
  { from: 18, to: 20, unstuffed: range(h(4.25), h(4.5)), stuffed: range(h(4.25), h(4.75)) },
  { from: 20, to: 24, unstuffed: range(h(4.5), h(5)), stuffed: range(h(4.75), h(5.25)) },
];

/** USDA/FSIS: add 15-30 minutes for stuffed birds (duck/goose and holiday-meats charts). */
const USDA_STUFFED_EXTRA = range(15, 30);

/** Rules of thumb for raw weight per person (Grillfürst portion planner), in kg. */
const PORTION = {
  turkey: range(0.45, 0.5),
  goose: range(0.5, 0.7), // Grillfürst 500-600 g, REWE 600-700 g incl. bone
  duck: range(0.5, 0.5),
  beefBoneIn: range(0.35, 0.4),
  beefBoneless: range(0.2, 0.25),
  pork: range(0.25, 0.3),
  ham: range(0.2, 0.25),
};

const EN_PROFILES: Record<MeatId, MeatProfile> = {
  turkey: {
    id: 'turkey',
    poultry: true,
    canStuff: true,
    ovenTemp: 325,
    tempScale: 'F',
    timing: { kind: 'brackets', unit: 'lb', rows: USDA_TURKEY_ROWS },
    safeCore: 165,
    safeHoldMinutes: 0,
    rest: range(20, 30),
    // USDA: allow 1 lb of turkey per person.
    buyPerGuestKg: range(lbToKg(1), lbToKg(1)),
  },
  chicken: {
    id: 'chicken',
    poultry: true,
    canStuff: true,
    ovenTemp: 350,
    tempScale: 'F',
    // USDA FSIS "Chicken from Farm to Table", 350 °F: broiler-fryer 3-4 lb 1¼-1½ h; roasting hen 5-7 lb 2-2¼ h.
    timing: {
      kind: 'brackets',
      unit: 'lb',
      rows: [
        { from: 3, to: 4, unstuffed: range(h(1.25), h(1.5)) },
        { from: 5, to: 7, unstuffed: range(h(2), h(2.25)) },
      ],
      stuffedExtra: USDA_STUFFED_EXTRA,
    },
    safeCore: 165,
    safeHoldMinutes: 0,
    rest: range(10, 15),
  },
  duck: {
    id: 'duck',
    poultry: true,
    canStuff: false,
    ovenTemp: 350,
    tempScale: 'F',
    // USDA FSIS "Duck and Goose from Farm to Table": whole duckling 4-6 lb, 30-35 min/lb at 350 °F, do not stuff.
    timing: { kind: 'perWeight', unit: 'lb', minutesPerUnit: range(30, 35) },
    safeCore: 165,
    safeHoldMinutes: 0,
    rest: range(15, 20),
    // USDA: about 1 to 1½ lb raw weight per person for duck and goose.
    buyPerGuestKg: range(lbToKg(1), lbToKg(1.5)),
  },
  goose: {
    id: 'goose',
    poultry: true,
    canStuff: true,
    ovenTemp: 325,
    tempScale: 'F',
    // USDA FSIS "Duck and Goose from Farm to Table" / FoodSafety.gov: whole young goose 8-12 lb, 2½-3 h at 325 °F.
    timing: {
      kind: 'brackets',
      unit: 'lb',
      rows: [{ from: 8, to: 12, unstuffed: range(h(2.5), h(3)) }],
      stuffedExtra: USDA_STUFFED_EXTRA,
    },
    safeCore: 165,
    safeHoldMinutes: 0,
    rest: range(15, 20),
    buyPerGuestKg: range(lbToKg(1), lbToKg(1.5)),
  },
  beef: {
    id: 'beef',
    poultry: false,
    canStuff: false,
    ovenTemp: 325,
    tempScale: 'F',
    // USDA FSIS "Roasting Those 'Other' Holiday Meats": beef rib roast, bone-in, 4-8 lb, 325 °F, 23-30 min/lb.
    timing: { kind: 'perWeight', unit: 'lb', minutesPerUnit: range(23, 30) },
    safeCore: 145,
    safeHoldMinutes: 3,
    rest: range(15, 20),
    buyPerGuestKg: PORTION.beefBoneIn,
  },
  pork: {
    id: 'pork',
    poultry: false,
    canStuff: false,
    ovenTemp: 325,
    tempScale: 'F',
    // USDA FSIS "Roasting Those 'Other' Holiday Meats": pork loin roast, bone-in, 3-5 lb, 325 °F, 20-25 min/lb.
    timing: { kind: 'perWeight', unit: 'lb', minutesPerUnit: range(20, 25) },
    safeCore: 145,
    safeHoldMinutes: 3,
    rest: range(10, 20),
    buyPerGuestKg: PORTION.pork,
  },
  ham: {
    id: 'ham',
    poultry: false,
    canStuff: false,
    ovenTemp: 325,
    tempScale: 'F',
    // USDA FSIS "Roasting Those 'Other' Holiday Meats": fully cooked bone-in ham, half (7-8 lb) 18-25 min/lb,
    // whole (14-16 lb) 15-18 min/lb, 325 °F.
    timing: {
      kind: 'perWeight',
      unit: 'lb',
      minutesPerUnit: range(18, 25),
      heavy: { from: 10, minutesPerUnit: range(15, 18) },
    },
    safeCore: 140,
    safeHoldMinutes: 0,
    rest: range(10, 15),
    buyPerGuestKg: PORTION.ham,
  },
};

const DE_PROFILES: Record<MeatId, MeatProfile> = {
  turkey: {
    id: 'turkey',
    poultry: true,
    canStuff: true,
    // USDA-Tabelle gilt für 325 °F (≈ 163 °C).
    ovenTemp: 165,
    tempScale: 'C',
    timing: { kind: 'brackets', unit: 'lb', rows: USDA_TURKEY_ROWS },
    safeCore: 70,
    safeHoldMinutes: 2,
    rest: range(20, 30),
    buyPerGuestKg: PORTION.turkey,
  },
  goose: {
    id: 'goose',
    poultry: true,
    canStuff: true,
    ovenTemp: 160,
    tempScale: 'C',
    // Faustregel "etwa 1 Stunde pro kg" bei 150-160 °C (Lidl, Stuttgarter Zeitung, REWE); +15-30 Min. gefüllt.
    timing: { kind: 'perWeight', unit: 'kg', minutesPerUnit: range(50, 60), stuffedExtra: USDA_STUFFED_EXTRA },
    safeCore: 70,
    safeHoldMinutes: 2,
    // Lidl: 80-85 °C; REWE / Stuttgarter Zeitung: ca. 80 °C.
    targetCore: range(80, 85),
    rest: range(15, 20),
    buyPerGuestKg: PORTION.goose,
  },
  duck: {
    id: 'duck',
    poultry: true,
    canStuff: true,
    ovenTemp: 160,
    tempScale: 'C',
    // Grillfürst-Tabelle bei 160 °C: 1,8 kg 1:45 h … 3 kg 2:45 h (≈ 55-60 Min./kg).
    timing: { kind: 'perWeight', unit: 'kg', minutesPerUnit: range(50, 60), stuffedExtra: USDA_STUFFED_EXTRA },
    safeCore: 70,
    safeHoldMinutes: 2,
    targetCore: range(80, 80),
    rest: range(15, 20),
    buyPerGuestKg: PORTION.duck,
  },
  chicken: {
    id: 'chicken',
    poultry: true,
    canStuff: true,
    ovenTemp: 180,
    tempScale: 'C',
    // Grillfürst bei 180-200 °C: 1 kg 50-60 Min., 1,5 kg 1:15-1:30 h, 2 kg 1:30-1:45 h.
    timing: { kind: 'perWeight', unit: 'kg', minutesPerUnit: range(45, 60), stuffedExtra: USDA_STUFFED_EXTRA },
    safeCore: 70,
    safeHoldMinutes: 2,
    targetCore: range(80, 85),
    rest: range(10, 15),
  },
  beef: {
    id: 'beef',
    poultry: false,
    canStuff: false,
    ovenTemp: 160,
    tempScale: 'C',
    // Rinderschmorbraten: 150-160 °C, etwa 2 Stunden pro kg, Kern 80-90 °C (Grillfürst).
    timing: { kind: 'perWeight', unit: 'kg', minutesPerUnit: range(100, 120) },
    safeCore: 70,
    safeHoldMinutes: 2,
    targetCore: range(80, 90),
    rest: range(10, 15),
    buyPerGuestKg: PORTION.beefBoneless,
  },
  pork: {
    id: 'pork',
    poultry: false,
    canStuff: false,
    ovenTemp: 160,
    tempScale: 'C',
    // Grillfürst: bei 160 °C 60-70 Min. je kg, Kern 70-75 °C (durch); BZfE: ab 70 °C sicher.
    timing: { kind: 'perWeight', unit: 'kg', minutesPerUnit: range(60, 70) },
    safeCore: 70,
    safeHoldMinutes: 2,
    targetCore: range(70, 75),
    rest: range(10, 20),
    buyPerGuestKg: PORTION.pork,
  },
  ham: {
    id: 'ham',
    poultry: false,
    canStuff: false,
    // USDA-Werte für vorgegarten Schinken mit Knochen bei 325 °F (≈ 165 °C), umgerechnet auf kg.
    ovenTemp: 165,
    tempScale: 'C',
    timing: {
      kind: 'perWeight',
      unit: 'kg',
      minutesPerUnit: range(perKg(18), perKg(25)),
      heavy: { from: 4.5, minutesPerUnit: range(perKg(15), perKg(18)) },
    },
    safeCore: 70,
    safeHoldMinutes: 2,
    rest: range(10, 15),
    buyPerGuestKg: PORTION.ham,
  },
};

export function getProfiles(locale: RoastLocale): Record<MeatId, MeatProfile> {
  return locale === 'de' ? DE_PROFILES : EN_PROFILES;
}

/** USDA FSIS "Let's Talk Turkey" thawing table (refrigerator days, cold-water hours). */
export const USDA_THAW_ROWS: { from: number; to: number; fridgeDays: Range; waterHours: Range }[] = [
  { from: 4, to: 12, fridgeDays: [1, 3], waterHours: [2, 6] },
  { from: 12, to: 16, fridgeDays: [3, 4], waterHours: [6, 8] },
  { from: 16, to: 20, fridgeDays: [4, 5], waterHours: [8, 10] },
  { from: 20, to: 24, fridgeDays: [5, 6], waterHours: [10, 12] },
];

/** USDA FSIS refrigerator thawing: about 24 hours per 4-5 lb (≈ 1 day per 2 kg). */
export function fridgeThawDays(weightKg: number): Range {
  const lb = kgToLb(weightKg);
  return [Math.max(1, Math.ceil(lb / 5)), Math.max(1, Math.ceil(lb / 4))];
}

/** USDA FSIS cold-water thawing: about 30 minutes per lb, water changed every 30 minutes. */
export function coldWaterThawHours(weightKg: number): number {
  return Math.round(kgToLb(weightKg) * 0.5 * 2) / 2;
}

/**
 * Fan / convection. German practice: Umluft about 20 °C lower than Ober-/Unterhitze.
 * USDA publishes no convection rule and says not to roast below 325 °F, so EN keeps the temperature
 * and only schedules an earlier thermometer check.
 */
export const FAN_REDUCTION = { F: 0, C: 20 } as const;
/** Convection can finish faster; start checking about this share earlier than the low estimate. */
export const FAN_CHECK_FACTOR = 0.75;

export interface RoastInput {
  locale: RoastLocale;
  meat: MeatId;
  weightKg: number;
  stuffed: boolean;
  frozen: boolean;
  oven: OvenType;
  guests: number | null;
  /** "HH:MM", 24h clock. */
  serveAt: string;
}

export interface TimelineStep {
  key: 'fridge' | 'preheat' | 'ovenIn' | 'check' | 'ovenOut' | 'carve';
  /** Minutes before serving time. */
  minutesBefore: number;
  /** Clock time "HH:MM" (may roll back past midnight, see dayOffset). */
  clock: string;
  /** 0 = serving day, -1 = the day before. */
  dayOffset: number;
}

export interface RoastResult {
  profile: MeatProfile;
  ovenTempC: number;
  ovenTempF: number;
  cookMinutes: Range;
  /** True when the weight is outside the published table and the time was extrapolated. */
  extrapolated: boolean;
  stuffedApplied: boolean;
  rest: Range;
  safeCoreC: number;
  safeCoreF: number;
  targetCoreC?: Range;
  thaw: { fridgeDays: Range; coldWaterHours: number } | null;
  buy: { totalKg: Range; guests: number } | null;
  timeline: TimelineStep[];
}

function toNative(weightKg: number, unit: WeightUnit) {
  return unit === 'lb' ? kgToLb(weightKg) : weightKg;
}

function cookRange(profile: MeatProfile, weightKg: number, stuffed: boolean): { minutes: Range; extrapolated: boolean } {
  const timing = profile.timing;
  const weight = toNative(weightKg, timing.unit);
  const extra = stuffed && timing.stuffedExtra ? timing.stuffedExtra : ([0, 0] as Range);
  const plus = ([lo, hi]: Range): Range => [Math.round(lo + extra[0]), Math.round(hi + extra[1])];

  if (timing.kind === 'perWeight') {
    const rate = timing.heavy && weight >= timing.heavy.from ? timing.heavy.minutesPerUnit : timing.minutesPerUnit;
    return { minutes: plus([weight * rate[0], weight * rate[1]]), extrapolated: false };
  }

  const rows = timing.rows;
  const pick = (row: BracketRow): Range => (stuffed && row.stuffed ? row.stuffed : plus(row.unstuffed));
  const first = rows[0];
  const last = rows[rows.length - 1];

  if (weight < first.from) {
    // Below the table: scale the smallest bracket proportionally.
    const factor = weight / first.from;
    const [lo, hi] = pick(first);
    return { minutes: [Math.round(lo * factor), Math.round(hi * factor)], extrapolated: true };
  }
  if (weight > last.to) {
    // Above the table: scale the largest bracket proportionally.
    const factor = weight / last.to;
    const [lo, hi] = pick(last);
    return { minutes: [Math.round(lo * factor), Math.round(hi * factor)], extrapolated: true };
  }

  // Boundary weights (e.g. exactly 12 lb) belong to the heavier bracket.
  const row = rows.find((r) => weight >= r.from && weight < r.to) ?? rows.find((r) => weight === r.to);
  if (row) return { minutes: pick(row), extrapolated: false };

  // Gap between two published brackets: interpolate linearly.
  const lower = [...rows].reverse().find((r) => r.to <= weight)!;
  const upper = rows.find((r) => r.from >= weight)!;
  const t = (weight - lower.to) / (upper.from - lower.to || 1);
  const [llo, lhi] = pick(lower);
  const [ulo, uhi] = pick(upper);
  return {
    minutes: [Math.round(llo + (ulo - llo) * t), Math.round(lhi + (uhi - lhi) * t)],
    extrapolated: true,
  };
}

function clockFrom(serveAt: string, minutesBefore: number): { clock: string; dayOffset: number } {
  const [hh, mm] = serveAt.split(':').map((part) => Number.parseInt(part, 10));
  const serveMinutes = (Number.isFinite(hh) ? hh : 18) * 60 + (Number.isFinite(mm) ? mm : 0);
  const total = serveMinutes - minutesBefore;
  const dayOffset = Math.floor(total / 1440);
  const inDay = ((total % 1440) + 1440) % 1440;
  const clock = `${String(Math.floor(inDay / 60)).padStart(2, '0')}:${String(inDay % 60).padStart(2, '0')}`;
  return { clock, dayOffset };
}

export function calculateRoast(input: RoastInput): RoastResult {
  const profile = getProfiles(input.locale)[input.meat];
  const weightKg = Math.max(0.2, input.weightKg);
  const stuffedApplied = profile.canStuff && input.stuffed;
  const { minutes: baseMinutes, extrapolated } = cookRange(profile, weightKg, stuffedApplied);

  const isF = profile.tempScale === 'F';
  const reduction = input.oven === 'fan' ? FAN_REDUCTION[profile.tempScale] : 0;
  const ovenNative = profile.ovenTemp - reduction;
  const ovenTempF = isF ? ovenNative : Math.round(cToF(ovenNative) / 5) * 5;
  const ovenTempC = isF ? Math.round(fToC(ovenNative) / 5) * 5 : ovenNative;

  // Round outward to 5 minutes: these are estimates, not stopwatch values.
  const cookMinutes: Range = [Math.floor(baseMinutes[0] / 5) * 5, Math.ceil(baseMinutes[1] / 5) * 5];
  const safeCoreF = isF ? profile.safeCore : Math.round(cToF(profile.safeCore));
  const safeCoreC = isF ? Math.round(fToC(profile.safeCore)) : profile.safeCore;
  const targetCoreC = profile.targetCore
    ? ((isF ? profile.targetCore.map((v) => Math.round(fToC(v))) : profile.targetCore) as Range)
    : undefined;

  const thaw = profile.poultry && input.frozen
    ? { fridgeDays: fridgeThawDays(weightKg), coldWaterHours: coldWaterThawHours(weightKg) }
    : null;

  const guests = input.guests && input.guests > 0 ? Math.round(input.guests) : null;
  const buy = guests && profile.buyPerGuestKg
    ? {
        guests,
        totalKg: [
          Math.round(profile.buyPerGuestKg[0] * guests * 10) / 10,
          Math.round(profile.buyPerGuestKg[1] * guests * 10) / 10,
        ] as Range,
      }
    : null;

  const rest = profile.rest;
  const restUpper = rest[1];
  const ovenOutBefore = restUpper;
  const ovenInBefore = ovenOutBefore + cookMinutes[1];
  const checkAfter = input.oven === 'fan' ? Math.round(cookMinutes[0] * FAN_CHECK_FACTOR) : cookMinutes[0] - 15;
  const checkBefore = ovenInBefore - Math.max(30, checkAfter);
  const preheatBefore = ovenInBefore + 20;
  const fridgeBefore = ovenInBefore + 30;

  const step = (key: TimelineStep['key'], minutesBefore: number): TimelineStep => ({
    key,
    minutesBefore,
    ...clockFrom(input.serveAt, minutesBefore),
  });

  const timeline: TimelineStep[] = [
    step('fridge', fridgeBefore),
    step('preheat', preheatBefore),
    step('ovenIn', ovenInBefore),
    step('check', checkBefore),
    step('ovenOut', ovenOutBefore),
    step('carve', 0),
  ];

  return {
    profile,
    ovenTempC,
    ovenTempF,
    cookMinutes,
    extrapolated,
    stuffedApplied,
    rest,
    safeCoreC,
    safeCoreF,
    targetCoreC,
    thaw,
    buy,
    timeline,
  };
}

/** "3 h 45 min" / "3 Std. 45 Min." */
export function formatDuration(minutes: number, locale: RoastLocale): string {
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  const hLabel = locale === 'de' ? 'Std.' : 'h';
  const mLabel = locale === 'de' ? 'Min.' : 'min';
  if (hours === 0) return `${rest} ${mLabel}`;
  if (rest === 0) return `${hours} ${hLabel}`;
  return `${hours} ${hLabel} ${rest} ${mLabel}`;
}

export function formatDurationRange([lo, hi]: Range, locale: RoastLocale): string {
  if (lo === hi) return formatDuration(lo, locale);
  return `${formatDuration(lo, locale)} – ${formatDuration(hi, locale)}`;
}
