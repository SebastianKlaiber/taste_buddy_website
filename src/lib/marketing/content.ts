import comparisons from '../../../content/comparisons.json';
import feedSites from '../../../content/feed_sites.json';
import importSources from '../../../content/import_sources.json';
import keywords from '../../../content/keywords.json';
import redirects from '../../../content/redirects.json';
import solutions from '../../../content/solutions.json';
import stats from '../../../content/stats.json';
import type {
  ComparisonRecord,
  FeedSiteRecord,
  ImportSourceRecord,
  KeywordRecord,
  Locale,
  RedirectRecord,
  SolutionRecord,
  StatsRecord,
} from './types';

const comparisonRecords = comparisons as ComparisonRecord[];
const solutionRecords = solutions as SolutionRecord[];
const keywordRecords = keywords as KeywordRecord[];
const importSourceRecords = importSources as ImportSourceRecord[];
const feedSiteRecords = feedSites as FeedSiteRecord[];
const redirectRecords = redirects as RedirectRecord[];
const statsRecord = stats as StatsRecord;

function byLocale<T extends { locale: Locale; slug: string }>(records: T[], locale: Locale, slug: string): T {
  const record = records.find((entry) => entry.locale === locale && entry.slug === slug);
  if (!record) {
    throw new Error(`Missing marketing record for ${locale}:${slug}`);
  }
  return record;
}

export function getComparison(locale: Locale, slug: string): ComparisonRecord {
  return byLocale(comparisonRecords, locale, slug);
}

export function listComparisons(locale: Locale): ComparisonRecord[] {
  return comparisonRecords.filter((record) => record.locale === locale);
}

export function getSolution(locale: Locale, slug: string): SolutionRecord {
  return byLocale(solutionRecords, locale, slug);
}

export function listSolutions(locale: Locale): SolutionRecord[] {
  return solutionRecords.filter((record) => record.locale === locale);
}

export function getKeyword(slug: string): KeywordRecord {
  return byLocale(keywordRecords, 'en', slug);
}

export function listKeywords(): KeywordRecord[] {
  return [...keywordRecords];
}

export function getImportSource(locale: Locale, slug: string): ImportSourceRecord {
  return byLocale(importSourceRecords, locale, slug);
}

export function listImportSources(locale: Locale): ImportSourceRecord[] {
  return importSourceRecords.filter((record) => record.locale === locale);
}

export function listFeedSites(country?: string): FeedSiteRecord[] {
  if (!country) {
    return [...feedSiteRecords];
  }
  return feedSiteRecords.filter((record) => record.country === country);
}

export function getFeedSiteByDomain(domain: string): FeedSiteRecord | undefined {
  return feedSiteRecords.find((record) => record.domain === domain);
}

export function getRedirectRecord(slug: string): RedirectRecord {
  const record = redirectRecords.find((entry) => entry.slug === slug);
  if (!record) {
    throw new Error(`Missing redirect record for ${slug}`);
  }
  return record;
}

export function listRedirects(): RedirectRecord[] {
  return [...redirectRecords];
}

export function getStats(): StatsRecord {
  return statsRecord;
}

export function getFeedDirectoryPage(locale: Locale, slug: string) {
  const localized = {
    en: {
      'recipe-websites-with-rss': {
        title: 'Recipe Websites With RSS Feeds',
        description:
          'A curated list of recipe websites with working RSS feeds so you can automatically follow new recipes inside TasteBuddy.',
        primary_keyword: 'recipe websites with rss feeds',
      },
      'best-german-food-blogs-with-rss': {
        title: 'Best German Food Blogs With RSS Feeds',
        description:
          'German-speaking recipe sites and food blogs with RSS feeds that fit TasteBuddy recipe subscriptions.',
        primary_keyword: 'best german food blogs with rss',
      },
    },
    de: {
      'recipe-websites-with-rss': {
        title: 'Rezept-Websites mit RSS-Feeds',
        description:
          'Eine kuratierte Liste von Rezept-Websites mit RSS-Feeds, die Sie in TasteBuddy abonnieren koennen.',
        primary_keyword: 'rezept websites mit rss',
      },
      'best-german-food-blogs-with-rss': {
        title: 'Die besten deutschsprachigen Food-Blogs mit RSS',
        description:
          'Deutschsprachige Food-Blogs und Rezeptseiten mit RSS-Feeds, die gut zu TasteBuddy Rezept-Abos passen.',
        primary_keyword: 'deutsche food blogs mit rss',
      },
    },
  } as const;

  const entry = localized[locale][slug as keyof (typeof localized)[typeof locale]];
  if (!entry) {
    throw new Error(`Missing feed directory page for ${locale}:${slug}`);
  }

  return {
    slug,
    locale,
    search_intent: 'informational' as const,
    page_type: 'feed_directory' as const,
    source_of_truth: [
      '/Users/sebastianklaiber/conductor/workspaces/taste_buddy/istanbul-v1/taste_buddy_flutter/lib/src/features/onboarding/domain/predefined_rss_feeds.dart',
    ],
    claims: ['TasteBuddy includes RSS-based recipe subscriptions for supported websites.'],
    cta_variant: 'rss-tool',
    last_reviewed_at: '2026-04-10',
    ...entry,
  };
}
