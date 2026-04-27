export type Locale = 'en' | 'de';
export type SearchIntent = 'comparison' | 'problem_solution' | 'feature' | 'informational';
export type PageType =
  | 'keyword_comparison'
  | 'comparison'
  | 'solution'
  | 'import_source'
  | 'feed_directory'
  | 'article';

export interface BaseMarketingRecord {
  slug: string;
  locale: Locale;
  primary_keyword: string;
  search_intent: SearchIntent;
  page_type: PageType;
  source_of_truth: string[];
  claims: string[];
  cta_variant: string;
  last_reviewed_at: string;
  title: string;
  description: string;
}

export interface KeywordRecord extends BaseMarketingRecord {
  page_type: 'keyword_comparison';
  hero: string;
  decision_criteria: string[];
  best_for_tastebuddy: string[];
  internal_links: string[];
}

export interface ComparisonRecord extends BaseMarketingRecord {
  page_type: 'comparison';
  competitor: string;
  use_case: string;
  strengths: string[];
  weaknesses: string[];
  migration_notes: string[];
  proof_points: string[];
  review_status: 'approved' | 'draft' | 'frozen';
  best_for_tastebuddy: string;
  best_for_competitor: string;
}

export interface SolutionRecord extends BaseMarketingRecord {
  page_type: 'solution';
  problem: string;
  outcomes: string[];
  steps: string[];
}

export interface ImportSourceFaq {
  question: string;
  answer: string;
}

export interface ImportSourceRecord extends BaseMarketingRecord {
  page_type: 'import_source';
  source_name: string;
  supported_workflows: string[];
  limitations: string[];
  faq: ImportSourceFaq[];
  proof_points: string[];
}

export interface FeedSiteRecord {
  domain: string;
  country: string;
  language: string;
  has_rss: boolean;
  feed_count: number;
  category_tags: string[];
  recommended_reason: string;
  name: string;
  website_url: string;
  feed_url: string;
  content_focus: string;
  source_of_truth: string;
}

export interface RedirectRecord {
  slug: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  ios_url: string;
  android_url: string;
  fallback_url: string;
}

export interface StatsRecord {
  updated_at: string;
  source_of_truth: string[];
  metrics: {
    total_tracked_imports: number;
    url_import_share_percent: number;
    manual_entry_share_percent: number;
    social_import_share_percent: number;
    source_mix_percent: Record<string, number>;
  };
}

export interface ArticleRecord {
  slug: string;
  locale: Locale;
  template_type: 'consumer_how_to' | 'comparison_migration' | 'data_story' | 'technical_authority';
  target_query: string;
  source_refs: string[];
  publish_status: 'draft' | 'approved';
  canonical_url: string;
  title: string;
  description: string;
  date: string;
  author: string;
}
