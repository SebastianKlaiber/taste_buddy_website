import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// https://astro.build/config
export default defineConfig({
  site: 'https://taste-buddy.app',
  integrations: [
    tailwind(),
    sitemap(),
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
