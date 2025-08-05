# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TasteBuddy is a recipe management app website built with Astro, focusing on programmatic SEO and internationalization. The site serves as a marketing platform to drive app downloads through content marketing and SEO optimization.

## Key Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev   # or npm start - both start at localhost:4321

# Build for production
npm run build   # Runs astro check && astro build

# Preview production build
npm run preview

# Deploy to Netlify
npm run deploy   # Builds and deploys to production

# Astro CLI commands
npm run astro -- [command]
```

## Architecture Overview

### Tech Stack
- **Framework**: Astro (static site generator)
- **Styling**: Tailwind CSS with typography plugin
- **Database**: Supabase (for shared recipes functionality)
- **Deployment**: Netlify (static hosting)
- **Node Version**: 18.x (specified in engines)

### Project Structure

```
/src
├── components/       # Reusable Astro components
├── layouts/         # Page layouts (Layout.astro, BlogPost.astro)
├── lib/            # JavaScript utilities (Supabase client)
├── pages/          # File-based routing
│   ├── [lang]/     # Dynamic language routing (future use)
│   ├── de/         # German content
│   ├── en/         # English content
│   └── ...         # SEO-focused pages
└── translations/   # Translation files for i18n

/public
├── images/         # Static images and assets
├── _redirects      # Netlify redirect rules
└── sitemap.xml     # SEO sitemap
```

### Programmatic SEO Architecture

The site implements programmatic SEO through dynamic page templates:

1. **Comparison Pages** (`/comparisons/[comparison].astro`)
   - Dynamically generates app comparison pages
   - Targets keywords like "tastebuddy vs [competitor]"

2. **Keyword-Targeted Pages** (`/best-[keyword]-app.astro`)
   - Captures high-volume searches like "best recipe app"
   - Uses data-driven content generation

3. **Solution Pages** (`/solutions/[problem].astro`)
   - Addresses specific user problems
   - Example: "how-to-organize-recipes"

4. **Guide Pages** (`/guides/[guide].astro`)
   - Educational content for long-tail keywords
   - Step-by-step tutorials

### Internationalization Strategy

- Currently supports English (`/en`) and German (`/de`) content
- Recipe pages exist in both languages
- Blog posts are language-specific
- Future expansion possible through `[lang]` dynamic routing

### Key Features

1. **Recipe Sharing**
   - Dynamic recipe pages via `/share_recipe/[id].astro`
   - Fetches data from Supabase using recipe IDs
   - Handles both `share_recipe` and `recipes` tables

2. **SEO Optimization**
   - Structured data (JSON-LD) for recipes and software
   - Meta tags optimization
   - XML sitemap generation
   - Canonical URLs

3. **Content Marketing**
   - Blog system with markdown support
   - Recipe collection pages
   - Feature-specific landing pages

### Environment Variables

Required for Supabase integration:
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

### Build Considerations

- Uses Astro's static output mode
- Directory-based URLs (no .html extensions)
- Special Netlify build command handles legacy peer dependencies
- Rollup configuration skips Node.js modules for edge compatibility

### Testing Strategy

Currently no automated tests are configured. Consider adding:
- Component testing for Astro components
- Integration tests for Supabase queries
- SEO validation tests