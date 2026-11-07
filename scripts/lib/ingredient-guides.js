// Shared helpers for the ingredient guide pipeline ("Warenkunde").
// Used by scripts/generate-ingredient-guide.js and scripts/validate-ingredient-guides.js.

import fs from 'fs';
import path from 'path';

export const ROOT = process.cwd();
export const CONTENT_DIR = path.join(ROOT, 'content');
export const GUIDES_DIR = path.join(CONTENT_DIR, 'ingredients');
export const TOPICS_FILE = path.join(CONTENT_DIR, 'ingredient_topics.json');
export const LOCALES = ['de', 'en'];

export const LIMITS = {
  seoTitleMax: 60,
  descriptionMin: 110,
  descriptionMax: 160,
  minWords: 700,
  minSections: 4,
  minFaq: 4,
};

export function guidePath(locale, slug) {
  return locale === 'de' ? `/de/warenkunde/${slug}/` : `/ingredients/${slug}/`;
}

export function guideFile(locale, slug) {
  return path.join(GUIDES_DIR, locale, `${slug}.md`);
}

export function loadTopics() {
  return JSON.parse(fs.readFileSync(TOPICS_FILE, 'utf8'));
}

// Frontmatter is written as one `key: <JSON value>` line per key. JSON is valid YAML,
// so Astro reads it natively, and the pipeline can parse it without a YAML dependency.
export function serializeFrontmatter(data) {
  const lines = Object.entries(data).map(([key, value]) => `${key}: ${JSON.stringify(value ?? null)}`);
  return `---\n${lines.join('\n')}\n---\n`;
}

export function parseGuideFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    throw new Error(`${filePath}: missing frontmatter block`);
  }
  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    if (!line.trim()) continue;
    const separator = line.indexOf(':');
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    try {
      frontmatter[key] = JSON.parse(value);
    } catch {
      throw new Error(`${filePath}: frontmatter line for "${key}" is not a JSON value. Keep one \`key: <json>\` line per key.`);
    }
  }
  return { frontmatter, body: match[2] };
}

export function listGuideFiles(locale) {
  const dir = path.join(GUIDES_DIR, locale);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => path.join(dir, file));
}

function titleFromSlug(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function readJsonContent(file) {
  return JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8'));
}

function listPageSlugs(relativeDir) {
  const dir = path.join(ROOT, 'src', 'pages', relativeDir);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.astro') && file !== 'index.astro' && !file.startsWith('['))
    .map((file) => file.replace(/\.astro$/, ''));
}

// Every internal URL a generated guide may link to. The generator hands this list to the
// model, and the validator rejects any internal link outside it, so guides never link to 404s.
export function collectLinkTargets(locale) {
  const prefix = locale === 'de' ? '/de' : '';
  const targets = [];

  for (const slug of listPageSlugs(`${locale}/recipes`)) {
    targets.push({ href: `/${locale}/recipes/${slug}/`, label: titleFromSlug(slug), kind: 'recipe' });
  }

  for (const record of readJsonContent('solutions.json').filter((entry) => entry.locale === locale)) {
    targets.push({ href: `${prefix}/solutions/${record.slug}/`, label: record.title, kind: 'solution' });
  }

  for (const record of readJsonContent('import_sources.json').filter((entry) => entry.locale === locale)) {
    targets.push({ href: `${prefix}/import/${record.slug}/`, label: record.title, kind: 'import' });
  }

  const articleDir = path.join(CONTENT_DIR, 'articles', locale);
  if (fs.existsSync(articleDir)) {
    for (const file of fs.readdirSync(articleDir).filter((entry) => entry.endsWith('.mdx'))) {
      const raw = fs.readFileSync(path.join(articleDir, file), 'utf8');
      const title = raw.match(/^title:\s*"(.*)"\s*$/m)?.[1] ?? titleFromSlug(file.replace(/\.mdx$/, ''));
      targets.push({ href: `/${locale}/blog/articles/${file.replace(/\.mdx$/, '')}/`, label: title, kind: 'article' });
    }
  }

  for (const file of listGuideFiles(locale)) {
    const { frontmatter } = parseGuideFile(file);
    if (frontmatter.publish_status === 'approved') {
      targets.push({ href: guidePath(locale, frontmatter.slug), label: frontmatter.title, kind: 'ingredient_guide' });
    }
  }

  if (locale === 'de') {
    targets.push(
      { href: '/de/recipes/', label: 'Rezepte', kind: 'hub' },
      { href: '/de/warenkunde/', label: 'Warenkunde', kind: 'hub' },
      { href: '/de/so-funktioniert-es/', label: 'So funktioniert TasteBuddy', kind: 'product' },
      { href: '/de/ratgeber/', label: 'Ratgeber', kind: 'hub' },
    );
  } else {
    targets.push(
      { href: '/en/recipes/', label: 'Recipes', kind: 'hub' },
      { href: '/ingredients/', label: 'Ingredient guides', kind: 'hub' },
      { href: '/features/recipe-organizer/', label: 'Recipe organizer', kind: 'product' },
      { href: '/features/meal-planning/', label: 'Meal planning', kind: 'product' },
      { href: '/how-it-works/', label: 'How TasteBuddy works', kind: 'product' },
    );
  }

  return targets;
}

export function extractInternalLinks(markdown) {
  const links = [];
  for (const match of markdown.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)) {
    const href = match[2];
    if (href.startsWith('/')) {
      links.push(href);
    }
  }
  return links;
}

export function countWords(text) {
  return text
    .replace(/[#*_>`[\]()|-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

// Validates one guide. Errors block the pipeline; warnings are listed for the reviewer.
export function validateGuide({ frontmatter, body }, allowedHrefs) {
  const errors = [];
  const warnings = [];
  const required = ['title', 'seo_title', 'description', 'quick_answer', 'slug', 'locale', 'topic_id', 'date', 'updated', 'season_months', 'facts', 'faq', 'publish_status'];

  for (const key of required) {
    if (frontmatter[key] === undefined || frontmatter[key] === null || frontmatter[key] === '') {
      errors.push(`missing frontmatter field "${key}"`);
    }
  }

  if (frontmatter.seo_title && frontmatter.seo_title.length > LIMITS.seoTitleMax) {
    errors.push(`seo_title is ${frontmatter.seo_title.length} chars (max ${LIMITS.seoTitleMax})`);
  }
  if (frontmatter.description) {
    const length = frontmatter.description.length;
    if (length < LIMITS.descriptionMin || length > LIMITS.descriptionMax) {
      errors.push(`description is ${length} chars (want ${LIMITS.descriptionMin}-${LIMITS.descriptionMax})`);
    }
  }
  if (!['draft', 'approved'].includes(frontmatter.publish_status)) {
    errors.push(`publish_status must be "draft" or "approved"`);
  }

  const words = countWords(body);
  if (words < LIMITS.minWords) {
    errors.push(`body has ${words} words (min ${LIMITS.minWords})`);
  }

  const sections = (body.match(/^## /gm) ?? []).length;
  if (sections < LIMITS.minSections) {
    errors.push(`body has ${sections} H2 sections (min ${LIMITS.minSections})`);
  }
  if (/^# /m.test(body)) {
    errors.push('body contains an H1; the page template renders the only H1');
  }

  if (!Array.isArray(frontmatter.faq) || frontmatter.faq.length < LIMITS.minFaq) {
    errors.push(`faq needs at least ${LIMITS.minFaq} entries`);
  }

  for (const href of extractInternalLinks(body)) {
    if (!allowedHrefs.has(href)) {
      errors.push(`internal link ${href} is not a known page`);
    }
  }
  if (extractInternalLinks(body).length < 2) {
    warnings.push('fewer than 2 internal links in the body');
  }

  if (!frontmatter.hero_image) {
    warnings.push('no hero_image yet: add an own photo before approving');
  } else if (!frontmatter.hero_alt) {
    errors.push('hero_image is set but hero_alt is empty');
  }
  if (!frontmatter.nutrition) {
    warnings.push('no nutrition data: the nutrition table will be hidden');
  }

  return { errors, warnings, words };
}
