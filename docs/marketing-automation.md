# TasteBuddy Marketing Automation

This site now uses a registry-driven marketing system instead of one-off SEO pages.

## Source Of Truth

- `content/keywords.json`
- `content/comparisons.json`
- `content/solutions.json`
- `content/import_sources.json`
- `content/feed_sites.json`
- `content/redirects.json`
- `content/stats.json`
- `content/articles/<locale>/*.mdx`

Every generated page should be traceable back to product capabilities, proprietary stats, or first-hand technical material.

## Implemented Automation

- Programmatic SEO routes for comparisons, solutions, import-source pages, feed directories, and keyword pages
- EN/DE article routing from `content/articles/**`
- Automatic sitemap generation via `@astrojs/sitemap`
- Hreflang handling in [`src/layouts/Layout.astro`](/Users/sebastianklaiber/Dev/taste_buddy_website/src/layouts/Layout.astro)
- Store redirect attribution via [`src/pages/go/[slug].ts`](/Users/sebastianklaiber/Dev/taste_buddy_website/src/pages/go/[slug].ts)
- Tool pages for feed detection, import checking, and link-in-bio resolution
- Build validation for registries, generated routes, schema, hreflang, and sitemap output
- Client + server analytics hooks through [`src/components/Analytics.astro`](/Users/sebastianklaiber/Dev/taste_buddy_website/src/components/Analytics.astro) and [`src/pages/api/analytics.ts`](/Users/sebastianklaiber/Dev/taste_buddy_website/src/pages/api/analytics.ts)

## Article Draft Workflow

Create a new draft from a template:

```bash
npm run article:draft -- \
  --locale=en \
  --slug=how-to-save-recipes-from-instagram \
  --template=consumer_how_to \
  --query="how to save recipes from instagram" \
  --source-ref="/Users/sebastianklaiber/Dev/taste_buddy_website/content/stats.json"
```

Supported templates:

- `consumer_how_to`
- `comparison_migration`
- `data_story`
- `technical_authority`

The command creates `content/articles/<locale>/<slug>.mdx` with frontmatter and section scaffolding. The draft stays `publish_status: "draft"` until reviewed.

## Tracking

Current tracked events:

- `marketing_cta_clicked`
- `marketing_tool_submitted`
- `marketing_tool_result_clicked`
- `redirect_hit`
- `browser_analytics`

Optional GA support:

- Set `PUBLIC_GA_MEASUREMENT_ID` to forward the same browser events to GA4.

Without GA, browser events still hit the server analytics endpoint and appear in function logs.
