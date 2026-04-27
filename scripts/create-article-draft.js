#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { parseArgs } from 'util';

const validLocales = new Set(['en', 'de']);
const validTemplates = new Set([
  'consumer_how_to',
  'comparison_migration',
  'data_story',
  'technical_authority',
]);

const templateSections = {
  consumer_how_to: [
    '## The workflow to fix',
    '## Why saved recipes become unusable',
    '## Step-by-step setup in TasteBuddy',
    '## Common edge cases',
    '## Next step',
  ],
  comparison_migration: [
    '## Where the old workflow breaks',
    '## What changes in TasteBuddy',
    '## Migration checklist',
    '## Who should switch now',
    '## Next step',
  ],
  data_story: [
    '## What the product data says',
    '## What this means for recipe collectors',
    '## How TasteBuddy responds to the pattern',
    '## Limits of the dataset',
    '## Next step',
  ],
  technical_authority: [
    '## The technical problem',
    '## Why naive implementations fail',
    '## The approach behind TasteBuddy',
    '## Tradeoffs and edge cases',
    '## Next step',
  ],
};

function toTitleCase(value) {
  return value
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function escapeYamlString(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function ensureArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function buildDescription(query, locale) {
  if (locale === 'de') {
    return `Ein Entwurf fuer den Suchbegriff "${query}", gestuetzt auf TasteBuddy Produktdaten und reale Workflows.`;
  }

  return `A draft for the query "${query}", grounded in TasteBuddy product data and real recipe workflows.`;
}

function buildCanonicalUrl(locale, slug) {
  return locale === 'de'
    ? `https://taste-buddy.app/de/blog/articles/${slug}/`
    : `https://taste-buddy.app/en/blog/articles/${slug}/`;
}

function buildFrontmatter({
  title,
  description,
  date,
  slug,
  templateType,
  query,
  sourceRefs,
  canonicalUrl,
}) {
  const refs = sourceRefs.map((ref) => `  - "${escapeYamlString(ref)}"`).join('\n');

  return `---
title: "${escapeYamlString(title)}"
description: "${escapeYamlString(description)}"
date: "${escapeYamlString(date)}"
author: "TasteBuddy"
slug: "${escapeYamlString(slug)}"
template_type: "${escapeYamlString(templateType)}"
target_query: "${escapeYamlString(query)}"
source_refs:
${refs || '  - "/Users/sebastianklaiber/Dev/taste_buddy_website/content/stats.json"'}
publish_status: "draft"
canonical_url: "${escapeYamlString(canonicalUrl)}"
---
`;
}

function buildBody(locale, templateType, query, sourceRefs) {
  const intro =
    locale === 'de'
      ? `Dieser Entwurf ist fuer den Keyword-Cluster "${query}" gedacht. Er sollte nur Aussagen enthalten, die sich aus den unten genannten Quellen oder aus echten TasteBuddy Workflows belegen lassen.\n`
      : `This draft is for the keyword cluster "${query}". Keep every claim tied to the sources below or to real TasteBuddy workflows.\n`;

  const sourcingLine =
    locale === 'de'
      ? `**Quellenbasis:** ${sourceRefs.length > 0 ? sourceRefs.join(', ') : 'TasteBuddy Produktdaten und bestehende technische Notizen.'}`
      : `**Source base:** ${sourceRefs.length > 0 ? sourceRefs.join(', ') : 'TasteBuddy product data and existing technical notes.'}`;

  const sections = templateSections[templateType].join('\n\n');

  return `${intro}\n${sourcingLine}\n\n${sections}\n`;
}

const { values } = parseArgs({
  options: {
    locale: { type: 'string' },
    slug: { type: 'string' },
    template: { type: 'string' },
    query: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    'source-ref': { type: 'string', multiple: true },
  },
});

const locale = values.locale;
const slug = values.slug;
const templateType = values.template;
const query = values.query;

if (!locale || !validLocales.has(locale)) {
  console.error('Missing or invalid --locale. Use "en" or "de".');
  process.exit(1);
}

if (!slug) {
  console.error('Missing required --slug.');
  process.exit(1);
}

if (!templateType || !validTemplates.has(templateType)) {
  console.error(`Missing or invalid --template. Use one of: ${[...validTemplates].join(', ')}`);
  process.exit(1);
}

if (!query) {
  console.error('Missing required --query.');
  process.exit(1);
}

const title = values.title ?? toTitleCase(slug.replace(/-/g, ' '));
const description = values.description ?? buildDescription(query, locale);
const date = new Date().toISOString().slice(0, 10);
const sourceRefs = ensureArray(values['source-ref']);
const canonicalUrl = buildCanonicalUrl(locale, slug);

const frontmatter = buildFrontmatter({
  title,
  description,
  date,
  slug,
  templateType,
  query,
  sourceRefs,
  canonicalUrl,
});

const body = buildBody(locale, templateType, query, sourceRefs);
const outputDir = path.join(process.cwd(), 'content', 'articles', locale);
const outputPath = path.join(outputDir, `${slug}.mdx`);

if (fs.existsSync(outputPath)) {
  console.error(`Draft already exists: ${outputPath}`);
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${frontmatter}\n${body}`);

console.log(`Created article draft: ${outputPath}`);
