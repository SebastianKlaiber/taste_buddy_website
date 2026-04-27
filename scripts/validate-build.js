#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

const contentDir = path.join(process.cwd(), 'content');
const distDir = path.join(process.cwd(), 'dist');

const registryConfigs = [
  {
    file: 'keywords.json',
    required: ['slug', 'locale', 'title', 'description', 'primary_keyword', 'search_intent', 'page_type', 'source_of_truth', 'claims', 'cta_variant', 'last_reviewed_at'],
  },
  {
    file: 'comparisons.json',
    required: ['slug', 'locale', 'title', 'description', 'competitor', 'use_case', 'strengths', 'weaknesses', 'migration_notes', 'proof_points', 'review_status'],
  },
  {
    file: 'solutions.json',
    required: ['slug', 'locale', 'title', 'description', 'problem', 'outcomes', 'steps'],
  },
  {
    file: 'import_sources.json',
    required: ['slug', 'locale', 'title', 'description', 'source_name', 'supported_workflows', 'limitations', 'faq', 'proof_points'],
  },
  {
    file: 'feed_sites.json',
    required: ['domain', 'country', 'language', 'has_rss', 'feed_count', 'category_tags', 'recommended_reason', 'name', 'website_url', 'feed_url'],
  },
  {
    file: 'redirects.json',
    required: ['slug', 'source', 'medium', 'campaign', 'content', 'ios_url', 'android_url', 'fallback_url'],
  },
];

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function readJson(relativeFile) {
  const fullPath = path.join(contentDir, relativeFile);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

function validateRegistryData() {
  log('blue', '🗂️  Validating marketing registries...');

  const errors = [];
  const seenSlugLocale = new Set();
  const seenRedirects = new Set();

  for (const config of registryConfigs) {
    const fullPath = path.join(contentDir, config.file);
    if (!checkFileExists(fullPath)) {
      errors.push(`Missing registry file: ${config.file}`);
      continue;
    }

    const entries = readJson(config.file);
    const list = Array.isArray(entries) ? entries : [entries];

    list.forEach((entry, index) => {
      for (const field of config.required) {
        if (!(field in entry)) {
          errors.push(`${config.file}[${index}] missing field "${field}"`);
        }
      }

      if ('slug' in entry && 'locale' in entry && config.file !== 'redirects.json') {
        const key = `${entry.locale}:${entry.slug}:${config.file}`;
        if (seenSlugLocale.has(key)) {
          errors.push(`Duplicate locale/slug in ${config.file}: ${entry.locale}:${entry.slug}`);
        }
        seenSlugLocale.add(key);
      }

      if (config.file === 'redirects.json' && 'slug' in entry) {
        if (seenRedirects.has(entry.slug)) {
          errors.push(`Duplicate redirect slug: ${entry.slug}`);
        }
        seenRedirects.add(entry.slug);
      }
    });
  }

  return {
    passed: errors.length === 0,
    errors,
  };
}

function routeToFile(routePath) {
  const cleanPath = routePath.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!cleanPath) {
    return path.join(distDir, 'index.html');
  }
  return path.join(distDir, cleanPath, 'index.html');
}

function parseArticleFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return {};
  }

  const frontmatter = {};
  let currentKey = null;

  for (const line of match[1].split('\n')) {
    const keyValueMatch = line.match(/^([a-z_]+):\s*(.*)$/);
    if (keyValueMatch) {
      currentKey = keyValueMatch[1];
      const rawValue = keyValueMatch[2].trim();
      if (rawValue === '') {
        frontmatter[currentKey] = [];
      } else {
        frontmatter[currentKey] = rawValue.replace(/^"|"$/g, '');
      }
      continue;
    }

    const listItemMatch = line.match(/^\s*-\s*(.*)$/);
    if (listItemMatch && currentKey && Array.isArray(frontmatter[currentKey])) {
      frontmatter[currentKey].push(listItemMatch[1].replace(/^"|"$/g, ''));
    }
  }

  return frontmatter;
}

function collectExpectedRoutes() {
  const comparisons = readJson('comparisons.json');
  const solutions = readJson('solutions.json');
  const imports = readJson('import_sources.json');
  const keywords = readJson('keywords.json');
  const articleFiles = fs
    .readdirSync(path.join(contentDir, 'articles', 'en'))
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/, ''));
  const articleFilesDe = fs
    .readdirSync(path.join(contentDir, 'articles', 'de'))
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/, ''));

  const routes = [];

  comparisons.forEach((record) => {
    routes.push(record.locale === 'de' ? `/de/comparisons/${record.slug}/` : `/comparisons/${record.slug}/`);
  });

  solutions.forEach((record) => {
    routes.push(record.locale === 'de' ? `/de/solutions/${record.slug}/` : `/solutions/${record.slug}/`);
  });

  imports.forEach((record) => {
    routes.push(record.locale === 'de' ? `/de/import/${record.slug}/` : `/import/${record.slug}/`);
  });

  keywords.forEach((record) => {
    routes.push(`/best-${record.slug}-app/`);
  });

  routes.push('/feeds/recipe-websites-with-rss/');
  routes.push('/feeds/best-german-food-blogs-with-rss/');
  routes.push('/de/feeds/recipe-websites-with-rss/');
  routes.push('/de/feeds/best-german-food-blogs-with-rss/');
  articleFiles.forEach((slug) => routes.push(`/en/blog/articles/${slug}/`));
  articleFilesDe.forEach((slug) => routes.push(`/de/blog/articles/${slug}/`));

  return routes;
}

function validateExpectedRoutes() {
  log('blue', '🧭 Validating generated routes...');

  const errors = [];
  const routes = collectExpectedRoutes();

  for (const route of routes) {
    const htmlPath = routeToFile(route);
    if (!checkFileExists(htmlPath)) {
      errors.push(`Missing built route: ${route}`);
      continue;
    }

    const html = fs.readFileSync(htmlPath, 'utf8');
    if (!html.includes('rel="canonical"')) {
      errors.push(`Missing canonical tag: ${route}`);
    }
    if (!html.includes('application/ld+json')) {
      errors.push(`Missing structured data: ${route}`);
    }

    if (
      route.includes('/de/') ||
      route.startsWith('/comparisons/') ||
      route.startsWith('/solutions/') ||
      route.startsWith('/import/') ||
      route.startsWith('/feeds/') ||
      route.startsWith('/en/blog/articles/')
    ) {
      if (!html.includes('hreflang="en"') || !html.includes('hreflang="de"')) {
        errors.push(`Missing hreflang alternates: ${route}`);
      }
    }
  }

  return {
    passed: errors.length === 0,
    errors,
  };
}

function validateArticles() {
  log('blue', '📝 Validating article frontmatter...');

  const errors = [];
  const required = ['title', 'description', 'date', 'author', 'slug', 'template_type', 'target_query', 'source_refs', 'publish_status', 'canonical_url'];
  const articleDirs = [path.join(contentDir, 'articles', 'en'), path.join(contentDir, 'articles', 'de')];

  for (const directory of articleDirs) {
    for (const file of fs.readdirSync(directory).filter((entry) => entry.endsWith('.mdx'))) {
      const frontmatter = parseArticleFrontmatter(path.join(directory, file));
      for (const field of required) {
        if (!(field in frontmatter)) {
          errors.push(`Article ${file} missing frontmatter field "${field}"`);
        }
      }
    }
  }

  return {
    passed: errors.length === 0,
    errors,
  };
}

function validateSitemaps() {
  log('blue', '🗺️  Validating generated sitemap output...');

  const errors = [];
  const indexPath = path.join(distDir, 'sitemap-index.xml');
  if (!checkFileExists(indexPath)) {
    errors.push('Missing dist/sitemap-index.xml');
    return { passed: false, errors };
  }

  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const referenced = [...indexContent.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);

  if (referenced.length === 0) {
    errors.push('sitemap-index.xml does not reference any sitemap files');
  }

  for (const url of referenced) {
    const fileName = new URL(url).pathname.replace(/^\/+/, '');
    const fullPath = path.join(distDir, fileName);
    if (!checkFileExists(fullPath)) {
      errors.push(`Missing referenced sitemap file: ${fileName}`);
    }
  }

  return {
    passed: errors.length === 0,
    errors,
  };
}

function validateCriticalFiles() {
  log('blue', '📁 Validating critical build files...');

  const errors = [];
  const requiredFiles = ['index.html', '500.html', '_redirects', 'robots.txt'];
  const requiredAppFiles = ['app/index.html', 'app/flutter_bootstrap.js'];

  for (const file of requiredFiles) {
    const fullPath = path.join(distDir, file);
    if (!checkFileExists(fullPath)) {
      errors.push(`Missing critical build file: ${file}`);
    }
  }

  for (const file of requiredAppFiles) {
    const fullPath = path.join(distDir, file);
    if (!checkFileExists(fullPath)) {
      errors.push(`Missing Flutter web app file: ${file}`);
    }
  }

  const notFoundCandidates = ['404.html', 'fallback.html'];
  const hasNotFoundArtifact = notFoundCandidates.some((file) => checkFileExists(path.join(distDir, file)));

  if (!hasNotFoundArtifact) {
    errors.push(`Missing not-found artifact. Expected one of: ${notFoundCandidates.join(', ')}`);
  }

  return {
    passed: errors.length === 0,
    errors,
  };
}

function printSection(title, result) {
  if (result.passed) {
    log('green', `✅ ${title}`);
    return;
  }

  log('red', `❌ ${title}`);
  result.errors.forEach((error) => log('red', `   - ${error}`));
}

function main() {
  log('blue', '🔍 Starting TasteBuddy website validation...');

  if (!fs.existsSync(distDir)) {
    log('red', '❌ Dist directory not found. Run `npm run build` first.');
    process.exit(1);
  }

  const results = [
    ['Marketing registries', validateRegistryData()],
    ['MDX article frontmatter', validateArticles()],
    ['Generated routes', validateExpectedRoutes()],
    ['Generated sitemaps', validateSitemaps()],
    ['Critical build files', validateCriticalFiles()],
  ];

  console.log();
  results.forEach(([title, result]) => printSection(title, result));

  const hasFailures = results.some(([, result]) => !result.passed);
  console.log();

  if (hasFailures) {
    log('red', 'Validation failed.');
    process.exit(1);
  }

  log('green', 'All validations passed.');
}

main();
