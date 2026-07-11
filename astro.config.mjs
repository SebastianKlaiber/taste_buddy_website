import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// https://astro.build/config
export default defineConfig({
  site: 'https://taste-buddy.app',
  integrations: [
    mdx(),
    tailwind(),
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname;
        return !new Set(['/404/', '/cookbook-invite/', '/link_identity_success/', '/oauth/consent/']).has(pathname);
      },
    }),
  ],
  adapter: netlify({
    mode: 'functions',
    functionPerRoute: true
  }),
  output: 'server',
  prerender: {
    default: true
  },
  outDir: './dist',
  // Optimize for better static content handling
  build: {
    format: 'directory'
  },
  // Comment out the built-in i18n configuration as we're using astro-i18n package
  /*
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  */
});
