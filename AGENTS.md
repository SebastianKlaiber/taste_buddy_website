# Repository Guidelines

## Project Structure & Module Organization
The Astro app lives in `src/`, with UI primitives in `src/components`, shared layouts in `src/layouts`, utilities and data helpers in `src/lib`, and localized content under `src/pages/en`, `src/pages/de`, and topic-specific folders like `src/pages/best-[keyword]-app.astro`. Global translations (labels, copy fragments) sit in `src/translations`. Static assets belong in `public/`, while deployment helpers live in `scripts/` and `docs/` collects longer-form specs. Generated output should stay confined to `dist/`.

## Build, Test, and Development Commands
- `npm install` — install dependencies; required before any other command.
- `npm run dev` — start the Astro dev server with hot reload at `http://localhost:4321`.
- `npm run build` — run `astro check` for type/content validation, then produce the optimized site in `dist/`.
- `npm run preview` — serve the production build locally for smoke testing.
- `npm run validate` — execute `scripts/validate-build.js` to ensure redirects and structured data are intact.
- `npm run netlify-build` / `npm run deploy` — build with Netlify-friendly artifacts and optionally push via `netlify deploy --prod`.

## Coding Style & Naming Conventions
Use TypeScript and `.astro` single-file components with two-space indentation. Favor named exports from `src/lib` modules and default exports only for page components. Keep Tailwind classes ordered by layout → spacing → color for readability. Shared constants and reusable copy should reside in `src/lib` or `src/translations` instead of duplicating strings inline. Run `npm run build` before pushing to catch Astro checker warnings.

## Testing Guidelines
There is no dedicated unit test suite yet. Treat `npm run validate` as the regression gate, and always inspect structured data blocks (`@context`, `@type`) when editing SEO pages. For UX changes, open both `/en/` and `/de/` routes during `npm run preview` to confirm localized routing and assets resolve correctly.

## Commit & Pull Request Guidelines
Align commit messages with the existing Conventional Commit style (`feat:`, `fix:`, `chore:`). Group related changes into single commits; avoid bundling content updates with infrastructure tweaks. Pull requests should describe the intent, reference any tracking issue, list build/test commands executed, and include before/after screenshots for visible UI differences (especially hero sections and store badges).

## Content & Localization Tips
When creating new programmatic SEO pages (e.g., `best-[solution]-app.astro`), mirror the existing file naming pattern and supply localized variants where relevant. Keep structured data objects (`mobileAppStructuredData`, FAQ schemas) in sync across locales and ensure outbound links include `rel="noopener noreferrer"` for security.
