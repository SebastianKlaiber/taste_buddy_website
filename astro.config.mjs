import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import { createRequire } from 'module';
import netlify from '@astrojs/netlify';

const require = createRequire(import.meta.url);

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind(),
  ],
  // Add the Netlify adapter for server-side rendering support
  output: 'hybrid',
  outDir: './dist',
  adapter: netlify({
    // Create a single function that handles all routes
    functionPerRoute: false,
    // Use the correct builder
    edgeMiddleware: false
  }),
  // Optimize for better static/dynamic content handling
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