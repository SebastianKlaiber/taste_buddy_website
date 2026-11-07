#!/usr/bin/env node
// Generates SEO ingredient guides ("Warenkunde") as draft Markdown files.
//
//   node scripts/generate-ingredient-guide.js --topic chestnuts
//   node scripts/generate-ingredient-guide.js --auto --count 2
//   node scripts/generate-ingredient-guide.js --topic kale --locales de --dry-run
//
// Facts that must be exact (nutrition, season) come from data, not from the model:
// nutrition from USDA FoodData Central, season from content/ingredient_topics.json.
// Output lands in content/ingredients/<locale>/<slug>.md with publish_status "draft".
// A human reviews it, adds a photo and flips it to "approved" before it ships.

import fs from 'fs';
import path from 'path';
import { parseArgs } from 'util';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import {
  LIMITS,
  LOCALES,
  collectLinkTargets,
  guideFile,
  guidePath,
  loadTopics,
  serializeFrontmatter,
  validateGuide,
} from './lib/ingredient-guides.js';

const MODEL = 'claude-opus-5-5';
const FDC_API_KEY = process.env.FDC_API_KEY || 'DEMO_KEY';

const { values: args } = parseArgs({
  options: {
    topic: { type: 'string', multiple: true },
    auto: { type: 'boolean', default: false },
    count: { type: 'string', default: '1' },
    locales: { type: 'string', default: LOCALES.join(',') },
    month: { type: 'string' },
    force: { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
  },
});

const locales = args.locales.split(',').map((value) => value.trim()).filter((value) => LOCALES.includes(value));
const today = new Date().toISOString().slice(0, 10);

// --- Topic selection -------------------------------------------------------

function guideExists(topic, locale) {
  return fs.existsSync(guideFile(locale, topic[locale].slug));
}

function pickTopics(topics) {
  if (args.topic?.length) {
    return args.topic.map((id) => {
      const topic = topics.find((entry) => entry.id === id);
      if (!topic) throw new Error(`Unknown topic "${id}". See content/ingredient_topics.json.`);
      return topic;
    });
  }

  if (!args.auto) {
    throw new Error('Pass --topic <id> or --auto.');
  }

  // Publish slightly ahead of the season so pages are indexed when searches peak.
  const month = Number(args.month ?? new Date().getMonth() + 1);
  const nextMonth = (month % 12) + 1;
  return topics
    .filter((topic) => topic.season_months.includes(month) || topic.season_months.includes(nextMonth))
    .filter((topic) => locales.some((locale) => !guideExists(topic, locale)))
    .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0))
    .slice(0, Number(args.count));
}

// --- Nutrition (USDA FoodData Central) ------------------------------------

const NUTRIENTS = [
  { key: 'energy_kcal', number: '208', unit: 'kcal' },
  { key: 'protein_g', number: '203', unit: 'g' },
  { key: 'fat_g', number: '204', unit: 'g' },
  { key: 'carbs_g', number: '205', unit: 'g' },
  { key: 'sugars_g', number: '269', unit: 'g' },
  { key: 'fiber_g', number: '291', unit: 'g' },
  { key: 'potassium_mg', number: '306', unit: 'mg' },
  { key: 'magnesium_mg', number: '304', unit: 'mg' },
  { key: 'vitamin_c_mg', number: '401', unit: 'mg' },
];

async function fdcGet(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FoodData Central ${response.status}: ${(await response.text()).slice(0, 200)}`);
  }
  return response.json();
}

async function fetchNutrition(topic) {
  if (!topic.fdc_id && !topic.fdc_query) {
    return null;
  }

  let fdcId = topic.fdc_id;
  if (!fdcId) {
    const search = await fdcGet(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${FDC_API_KEY}&dataType=SR%20Legacy,Foundation&pageSize=1&query=${encodeURIComponent(topic.fdc_query)}`,
    );
    fdcId = search.foods?.[0]?.fdcId;
    if (!fdcId) {
      console.warn(`  ! no FoodData Central match for "${topic.fdc_query}", skipping nutrition`);
      return null;
    }
  }

  const food = await fdcGet(`https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${FDC_API_KEY}`);
  const per100g = {};
  for (const nutrient of NUTRIENTS) {
    const entry = food.foodNutrients?.find((item) => item.nutrient?.number === nutrient.number);
    if (typeof entry?.amount === 'number') {
      per100g[nutrient.key] = Math.round(entry.amount * 10) / 10;
    }
  }

  return {
    source: 'USDA FoodData Central',
    fdc_id: fdcId,
    fdc_description: food.description,
    source_url: `https://fdc.nal.usda.gov/food-details/${fdcId}/nutrients`,
    per_100g: per100g,
  };
}

// --- Generation -----------------------------------------------------------

const GuideSchema = z.object({
  title: z.string().describe('On-page H1. Natural, includes the ingredient name.'),
  seo_title: z.string().describe(`HTML <title>, max ${LIMITS.seoTitleMax} characters, primary keyword first. No brand suffix.`),
  description: z.string().describe(`Meta description, ${LIMITS.descriptionMin}-${LIMITS.descriptionMax} characters, answers the search intent and invites the click.`),
  quick_answer: z.string().describe('2-3 sentence summary shown at the top of the page, written to win a featured snippet.'),
  facts: z.object({
    shelf_life: z.string().describe('How long it keeps and where, one short line.'),
    storage: z.string().describe('Best storage method, one short line.'),
    buying: z.string().describe('What to look for when buying, one short line.'),
    freezing: z.string().describe('Whether and how it can be frozen, one short line.'),
  }),
  sections: z
    .array(
      z.object({
        heading: z.string().describe('H2 heading phrased like a real search query or a clear subtopic.'),
        markdown: z.string().describe('Section body in Markdown. Paragraphs, lists and H3 allowed. No H1/H2, no HTML, no images.'),
      }),
    )
    .describe('5-7 sections, together at least 900 words.'),
  faq: z
    .array(z.object({ question: z.string(), answer: z.string().describe('2-4 sentences, self-contained.') }))
    .describe('5-7 questions people actually search for that the sections do not answer word-for-word.'),
  recipe_ideas: z
    .array(z.object({ name: z.string(), description: z.string().describe('One sentence.') }))
    .describe('4-6 dish ideas that use the ingredient.'),
});

const SYSTEM_PROMPT = `You write ingredient guides for TasteBuddy, a recipe manager app that saves recipes from any website, video or photo, plans meals and builds shopping lists.

The guides compete in Google for informational searches about one ingredient (in German this genre is called "Warenkunde"). A guide is useful when a home cook can answer their question in seconds and then keep reading because every section teaches something concrete.

How to write:
- Write natively in the requested language. German guides use correct umlauts and ß, address the reader with "du", and use the terms German cooks search for.
- Lead every section with the answer, then the detail. Short paragraphs. Use lists where a reader would scan: varieties, steps, storage times.
- Be concrete: temperatures, times, quantities, how something looks or smells when it is ready.
- Cover the questions in the keyword list, plus the common confusions and mistakes around this ingredient.
- Nutrition: use only the numbers in the provided nutrition data and say they are per 100 g. If no data is provided, describe nutrition qualitatively without numbers. Do not make health claims beyond what is well established; no disease claims.
- Season: use the provided season months, which describe Central Europe.
- Safety: when an ingredient has a toxic look-alike or a raw-consumption risk, say so plainly.
- Internal links: add 2-4 Markdown links inside the sections, only to URLs from the provided list, where they genuinely help the reader. Never invent URLs and never link to external sites.
- Mention TasteBuddy at most once in the sections, only where it fits (for example saving the recipes you try with this ingredient). The page already has its own call to action.
- No filler intros like "In this article", no "Fazit"/"Conclusion" section, no keyword stuffing, no emojis.`;

function buildUserPrompt(topic, locale, nutrition, linkTargets) {
  const entry = topic[locale];
  const language = locale === 'de' ? 'German' : 'English';
  return [
    `Write the ${language} ingredient guide for: ${entry.name}`,
    `Primary keyword: ${entry.keywords[0]}`,
    `Keyword variants to cover: ${entry.keywords.slice(1).join(', ')}`,
    `Season months in Central Europe (1 = January): ${topic.season_months.join(', ')}`,
    nutrition
      ? `Nutrition per 100 g (${nutrition.source}, "${nutrition.fdc_description}"): ${JSON.stringify(nutrition.per_100g)}`
      : 'Nutrition data: none available. Do not state nutrient amounts.',
    `Page URL: ${guidePath(locale, entry.slug)}`,
    `Allowed internal links:\n${linkTargets.map((target) => `- ${target.href} (${target.label})`).join('\n')}`,
  ].join('\n\n');
}

function stripHtml(markdown) {
  return markdown.replace(/<\/?[a-z][^>]*>/gi, '');
}

function toMarkdownBody(guide) {
  return guide.sections
    .map((section) => `## ${section.heading.trim()}\n\n${stripHtml(section.markdown).trim()}`)
    .join('\n\n')
    .concat('\n');
}

function buildGuide(topic, locale, generated, nutrition, existing) {
  const entry = topic[locale];
  const frontmatter = {
    title: generated.title,
    name: entry.name,
    seo_title: generated.seo_title,
    description: generated.description,
    quick_answer: generated.quick_answer,
    slug: entry.slug,
    locale,
    topic_id: topic.id,
    primary_keyword: entry.keywords[0],
    keywords: entry.keywords,
    date: existing?.date ?? today,
    updated: today,
    author: 'TasteBuddy Team',
    season_months: topic.season_months,
    facts: generated.facts,
    nutrition,
    faq: generated.faq,
    recipe_ideas: generated.recipe_ideas,
    hero_image: existing?.hero_image ?? null,
    hero_alt: existing?.hero_alt ?? null,
    publish_status: 'draft',
    generated_by: MODEL,
  };
  return { frontmatter, body: toMarkdownBody(generated) };
}

async function generateGuide(client, topic, locale, nutrition) {
  const linkTargets = collectLinkTargets(locale);
  const allowedHrefs = new Set(linkTargets.map((target) => target.href));
  const userPrompt = buildUserPrompt(topic, locale, nutrition, linkTargets);

  if (args['dry-run']) {
    console.log(`\n--- ${topic.id} (${locale}) prompt ---\n${userPrompt}\n`);
    return null;
  }

  const messages = [{ role: 'user', content: userPrompt }];

  // One generation plus at most one repair turn when validation fails.
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'high', format: betaZodOutputFormat(GuideSchema) },
      system: SYSTEM_PROMPT,
      messages,
    });

    if (response.stop_reason === 'refusal') {
      throw new Error(`${topic.id} (${locale}): request declined (${response.stop_details?.category ?? 'unknown'})`);
    }
    if (response.stop_reason === 'max_tokens' || !response.parsed_output) {
      throw new Error(`${topic.id} (${locale}): no complete structured output (stop_reason ${response.stop_reason})`);
    }

    const guide = buildGuide(topic, locale, response.parsed_output, nutrition, null);
    const result = validateGuide(guide, allowedHrefs);
    console.log(`  ${locale}: attempt ${attempt}, ${result.words} words, ${result.errors.length} errors`);

    if (result.errors.length === 0 || attempt === 2) {
      return { guide, result };
    }

    messages.push({ role: 'assistant', content: response.content });
    messages.push({
      role: 'user',
      content: `The guide failed these checks. Return the full corrected guide:\n${result.errors.map((error) => `- ${error}`).join('\n')}`,
    });
  }

  return null;
}

async function main() {
  const topics = pickTopics(loadTopics());
  if (topics.length === 0) {
    console.log('No topics to generate: every in-season topic already has a guide.');
    return;
  }

  const client = args['dry-run'] ? null : new Anthropic();
  const summary = [];
  let failed = false;

  for (const topic of topics) {
    console.log(`\n${topic.id}`);
    let nutrition = null;
    try {
      nutrition = await fetchNutrition(topic);
    } catch (error) {
      if (!args['dry-run']) {
        throw new Error(`${error.message}\nSet FDC_API_KEY (free at https://fdc.nal.usda.gov/api-key-signup) - DEMO_KEY is heavily rate limited.`);
      }
      console.warn(`  ! nutrition lookup failed in dry run: ${error.message.split('\n')[0]}`);
    }

    for (const locale of locales) {
      const outputPath = guideFile(locale, topic[locale].slug);
      if (fs.existsSync(outputPath) && !args.force) {
        console.log(`  ${locale}: exists, skipping (use --force to regenerate)`);
        continue;
      }

      const output = await generateGuide(client, topic, locale, nutrition);
      if (!output) continue;

      const { guide, result } = output;
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, `${serializeFrontmatter(guide.frontmatter)}\n${guide.body}`);
      console.log(`  ${locale}: wrote ${path.relative(process.cwd(), outputPath)}`);

      if (result.errors.length > 0) failed = true;
      summary.push({
        topic: topic.id,
        locale,
        file: path.relative(process.cwd(), outputPath),
        url: guidePath(locale, topic[locale].slug),
        words: result.words,
        errors: result.errors,
        warnings: result.warnings,
      });
    }
  }

  // Read by the GitHub workflow to write the pull request body.
  if (process.env.GUIDE_SUMMARY_FILE && summary.length > 0) {
    fs.writeFileSync(process.env.GUIDE_SUMMARY_FILE, JSON.stringify(summary, null, 2));
  }

  if (failed) {
    console.error('\nSome guides still fail validation. They were written as drafts; fix them before approving.');
    process.exitCode = 1;
  }
}

main().catch((error) => {
  if (error instanceof Anthropic.AuthenticationError) {
    console.error('Anthropic authentication failed. Set ANTHROPIC_API_KEY or run `ant auth login`.');
  } else if (error instanceof Anthropic.RateLimitError) {
    console.error('Anthropic rate limit hit. Retry later.');
  } else if (error instanceof Anthropic.APIError) {
    console.error(`Anthropic API error ${error.status}: ${error.message}`);
  } else {
    console.error(error.message ?? error);
  }
  process.exit(1);
});
