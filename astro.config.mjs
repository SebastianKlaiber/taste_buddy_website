import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind(),
  ],
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