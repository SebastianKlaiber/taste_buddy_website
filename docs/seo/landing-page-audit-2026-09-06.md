# TasteBuddy landing-page SEO audit — 6 September 2026

## Search Console evidence

Read in the signed-in Chrome session for `sc-domain:taste-buddy.app`.

Performance window: **5 June–4 September 2026**, Web search, all pages:

| Metric | Value |
| --- | ---: |
| Clicks | 97 |
| Impressions | 4,061 |
| CTR | 2.4% |
| Average position | 12.1 |

Visible query examples (clicks / impressions): `taste buddy` 19 / 584; `tastebuddy` 11 / 252; `tiktok rezepte speichern` 0 / 57; `best app for collecting recipes` 0 / 40; `best app to collect recipes` 0 / 35. These are query examples, not a complete attribution of all clicks or proof of keyword volume.

Indexing report, last updated **28 August 2026**: 43 indexed, 52 excluded. Exclusions: 20 redirects, 17 not found, 6 alternate canonicals, 2 server errors, 1 robots exclusion, 6 crawled but not indexed. Redirects and alternate canonical URLs are not automatically defects. Core Web Vitals has insufficient field data; no performance score is claimed.

## Findings and changes

| Priority | Evidence / issue | Action |
| --- | --- | --- |
| High | The only submitted sitemap was `/sitemap.xml`, reported inaccessible; live HTTP check returned 404. | Submitted the existing `/sitemap-index.xml` in Search Console. Google subsequently displayed **“Sitemap-Index wurde ohne Fehler verarbeitet”** (processed without errors), last read 6 September. The child sitemap is valid XML containing 78 URLs. A local 301 rule restores the old sitemap address. |
| High | Both homepages wrapped their primary content in `hidden md:block`, replacing it on mobile with a short download flow. The mobile intro had no visible H1. | Both locales now render the responsive landing content, navigation, headings, internal links, and FAQs on mobile. Retained tracked downloads and the existing sticky mobile store CTA. |
| Medium | Search queries indicate recipe collection and saving TikTok recipes are relevant discovery topics. | Clarified recipe-app titles and H1s; added contextual links to existing import, organization, and meal-planning content. This is an evidence-informed targeting choice, not a ranking forecast. |
| Medium | German homepage lacked the English homepage's FAQ and application metadata. English FAQ markup duplicated separately maintained copy. | Added shared localized FAQ data rendered as both visible content and JSON-LD; localized software metadata; corrected German spelling; expanded the German explanation of importing, collecting, and planning recipes. |
| Medium | Search Console reported historical language/path variants as 404s. | Added exact 301 mappings for 12 reported URLs with identifiable replacements, including `/en/`, misplaced German articles, and old about/contact/guide links. No blanket redirect of missing pages to the homepage. |
| Low | The shared Main component nested a second main landmark inside Layout's main. | Changed the inner wrapper to a div. |

The two historical 5xx URLs (`/en/recipes/chili-sin-carne`, `/best-all-recipe-app`) currently return 200, directly or following a canonical slash redirect. Their reported last crawls were 10 and 7 March 2026. `/terms` also currently resolves to 200.

The three retired topic URLs (`/solutions/food-waste-prevention/`, `/solutions/pantry-organization/`, `/best-food-waste-app`) have no equivalent current content, so remain 404. `/api/analytics` is an endpoint, not a search landing page. No current source references to the retired topic URLs were found.

## Validation and scope

- `npm install --legacy-peer-deps` completed; dependency files were unchanged.
- `npm run build` passed.
- `npm run validate` passed: routes, sitemap, metadata, structure, internal links/assets, registries, and critical files.
- Checked all 14 added permanent redirect rules against destination files and confirmed the generated redirect artifact contains the sitemap rule.
- Chrome checks at 390px: visible H1 and FAQs in both languages, no horizontal overflow, correct canonical URLs, and FAQ JSON-LD matching visible answers. English page has one main landmark after the shared wrapper fix.
- `npm run preview` is unsupported by this repository's Netlify adapter. Served built `dist` assets locally for browser checks instead. This does not execute Netlify redirects or SSR endpoints; production redirect readback remains a deployment check.
- Existing canonical/hreflang pairs already correctly map `/` and `/de/`; preserved them.
- Application markup describes the product. No ratings, reviews, or unverified pricing were invented. It does not currently satisfy all Google software rich-result requirements, and rich-result eligibility is not claimed.
- Preserved pre-existing unrelated worktree changes. **SEO landing pages and redirects were published on 6 September 2026 at 10:42 UTC. Source changes remain uncommitted.**

## Next verification after publishing

1. Verify `/`, `/de/`, `/en/`, `/sitemap.xml`, and the exact legacy redirects against the deployed site.
2. Inspect `/` and `/de/` in Search Console and request reindexing after their changed content is live.
3. Recheck sitemap discovery and the six crawled-but-not-indexed URLs after Google recrawls. Submission success is not proof that every URL is indexed.
4. Compare equivalent 28-day periods, tracking non-brand clicks and impressions separately from branded searches; inspect query/page pairs for recipe collection and TikTok imports. Do not interpret the site-wide average position as the homepage's rank.

References: [Google mobile-first indexing guidance](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing), [software application structured-data requirements](https://developers.google.com/search/docs/appearance/structured-data/software-app), [canonicalization guidance](https://developers.google.com/search/docs/crawling-indexing/canonicalization).

## Deployment verification — 6 September 2026

Published deploy: `6a9d432167b31f5f189f6430` on `recipe-tastebuddy` (`https://taste-buddy.app`). Previous deploy retained for rollback: `6a7a014b9677b5fddd8fe007`.

Prepared the two landing pages from an isolated HEAD snapshot with only the SEO source changes. Created a Netlify draft from the existing production file manifest, overlaying the two landing pages, redirects, and compiled assets; verified the draft, then published it. No Flutter build ran and no Flutter or SSR function replacement was uploaded.

Production checks passed for both landing pages and all 14 new permanent redirect rules. An independent production manifest comparison confirmed that the only changed existing files were `/index.html` and `/de/index.html`. All 131 `/app/` file hashes were unchanged, as was the SSR function digest and streaming routing configuration. Existing non-landing pages and unrelated workspace changes were preserved. The shared main-wrapper correction is live in the two rebuilt landing pages; other existing pages were not rebuilt for this scoped deployment.

Google's sitemap submission was already processed successfully in the preceding audit. Requesting individual page recrawls remains an optional Search Console follow-up; publishing does not establish that Google has indexed the changed copy.
