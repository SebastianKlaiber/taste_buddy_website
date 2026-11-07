#!/usr/bin/env node
// Validates every ingredient guide in content/ingredients/. Exits non-zero on errors.

import path from 'path';
import {
  LOCALES,
  collectLinkTargets,
  guidePath,
  listGuideFiles,
  loadTopics,
  parseGuideFile,
  validateGuide,
} from './lib/ingredient-guides.js';

const topicIds = new Set(loadTopics().map((topic) => topic.id));
let errorCount = 0;
let guideCount = 0;

for (const locale of LOCALES) {
  // Approved guides may only link to published pages. Drafts may also link to other
  // drafts, since a batch is reviewed together.
  const publishedHrefs = new Set(collectLinkTargets(locale).map((target) => target.href));
  const draftHrefs = new Set(publishedHrefs);
  for (const file of listGuideFiles(locale)) {
    draftHrefs.add(guidePath(locale, path.basename(file, '.md')));
  }

  const seenSlugs = new Set();
  for (const file of listGuideFiles(locale)) {
    guideCount += 1;
    const relative = path.relative(process.cwd(), file);
    let guide;
    try {
      guide = parseGuideFile(file);
    } catch (error) {
      console.log(`✗ ${relative}\n    error: ${error.message}`);
      errorCount += 1;
      continue;
    }

    const { frontmatter } = guide;
    const allowedHrefs = frontmatter.publish_status === 'approved' ? publishedHrefs : draftHrefs;
    const result = validateGuide(guide, allowedHrefs);

    if (frontmatter.slug !== path.basename(file, '.md')) {
      result.errors.push(`slug "${frontmatter.slug}" does not match the file name`);
    }
    if (frontmatter.locale !== locale) {
      result.errors.push(`locale "${frontmatter.locale}" does not match folder "${locale}"`);
    }
    if (!topicIds.has(frontmatter.topic_id)) {
      result.errors.push(`topic_id "${frontmatter.topic_id}" is not in content/ingredient_topics.json`);
    }
    if (seenSlugs.has(frontmatter.slug)) {
      result.errors.push(`duplicate slug "${frontmatter.slug}"`);
    }
    seenSlugs.add(frontmatter.slug);

    errorCount += result.errors.length;
    console.log(`${result.errors.length ? '✗' : '✓'} ${relative} (${frontmatter.publish_status}, ${result.words} words)`);
    for (const error of result.errors) console.log(`    error: ${error}`);
    for (const warning of result.warnings) console.log(`    warn:  ${warning}`);
  }
}

console.log(`\n${guideCount} guides checked, ${errorCount} errors`);
if (errorCount > 0) process.exit(1);
