import type { Locale } from './types';
import { SITE_URL } from './app-links';

export interface IngredientFaq {
  question: string;
  answer: string;
}

export interface IngredientNutrition {
  source: string;
  fdc_id: number;
  fdc_description: string;
  source_url: string;
  per_100g: Partial<Record<
    'energy_kcal' | 'protein_g' | 'fat_g' | 'carbs_g' | 'sugars_g' | 'fiber_g' | 'potassium_mg' | 'magnesium_mg' | 'vitamin_c_mg',
    number
  >>;
}

export interface IngredientGuideFrontmatter {
  title: string;
  // Short ingredient name ("Maronen") for chips, cards and link lists.
  name?: string;
  seo_title: string;
  description: string;
  quick_answer: string;
  slug: string;
  locale: Locale;
  topic_id: string;
  primary_keyword: string;
  keywords: string[];
  date: string;
  updated: string;
  author: string;
  season_months: number[];
  facts: { shelf_life: string; storage: string; buying: string; freezing: string };
  nutrition: IngredientNutrition | null;
  faq: IngredientFaq[];
  recipe_ideas: { name: string; description: string }[];
  hero_image: string | null;
  hero_alt: string | null;
  publish_status: 'draft' | 'approved';
}

interface GuideModule {
  Content: any;
  frontmatter: IngredientGuideFrontmatter;
}

const guideModules = import.meta.glob<GuideModule>('../../../content/ingredients/**/*.md', { eager: true });

// Drafts render in `astro dev`, in Netlify deploy previews (so reviewers can check a
// generated PR), and when SHOW_DRAFT_GUIDES=true. Production builds only ship approved guides.
function showDrafts() {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
  return import.meta.env.DEV || env.CONTEXT === 'deploy-preview' || env.SHOW_DRAFT_GUIDES === 'true';
}

export function guidePath(locale: Locale, slug: string) {
  return locale === 'de' ? `/de/warenkunde/${slug}/` : `/ingredients/${slug}/`;
}

export function guideHubPath(locale: Locale) {
  return locale === 'de' ? '/de/warenkunde/' : '/ingredients/';
}

export function listIngredientGuides(locale: Locale) {
  const includeDrafts = showDrafts();
  return Object.entries(guideModules)
    .filter(([file]) => file.includes(`/content/ingredients/${locale}/`))
    .map(([, module]) => module)
    .filter((module) => includeDrafts || module.frontmatter.publish_status === 'approved')
    .sort((left, right) => left.frontmatter.title.localeCompare(right.frontmatter.title, locale));
}

export function getGuideAlternates(locale: Locale, topicId: string) {
  const alternates: Partial<Record<'en' | 'de' | 'x-default', string>> = {};
  for (const candidate of ['en', 'de'] as const) {
    const match = listIngredientGuides(candidate).find((guide) => guide.frontmatter.topic_id === topicId);
    if (match) {
      alternates[candidate] = `${SITE_URL}${guidePath(candidate, match.frontmatter.slug)}`;
    }
  }
  if (alternates.en) {
    alternates['x-default'] = alternates.en;
  }
  // hreflang only makes sense once both language versions are live.
  return alternates.en && alternates.de ? alternates : null;
}

export function isInSeason(months: number[], date = new Date()) {
  return months.includes(date.getMonth() + 1);
}

const MONTHS = {
  de: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

export function monthLabels(locale: Locale) {
  return MONTHS[locale];
}

// "Okt–Dez" style range. Handles seasons that wrap around the new year (Nov–Feb).
export function seasonLabel(locale: Locale, months: number[]) {
  const labels = MONTHS[locale];
  if (months.length === 0) return '';
  if (months.length >= 12) return locale === 'de' ? 'ganzjährig' : 'all year';
  const set = new Set(months);
  const start = months.find((month) => !set.has(month === 1 ? 12 : month - 1)) ?? months[0];
  let end = start;
  while (set.has((end % 12) + 1)) end = (end % 12) + 1;
  return `${labels[start - 1]}–${labels[end - 1]}`;
}
