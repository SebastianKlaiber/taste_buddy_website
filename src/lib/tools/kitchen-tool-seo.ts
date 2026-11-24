import { SITE_URL } from '../marketing/app-links';

export type ToolLocale = 'en' | 'de';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface KitchenToolPair {
  en: string;
  de: string;
}

/** EN and DE paths of the kitchen tools, used for hreflang and cross-links. */
export const KITCHEN_TOOL_PATHS = {
  recipeScaler: { en: '/tools/recipe-scaler/', de: '/de/tools/rezept-umrechner/' },
  panConverter: { en: '/tools/baking-pan-size-converter/', de: '/de/tools/backform-umrechner/' },
} satisfies Record<string, KitchenToolPair>;

export function kitchenToolAlternates(paths: KitchenToolPair) {
  return {
    en: `${SITE_URL}${paths.en}`,
    de: `${SITE_URL}${paths.de}`,
    'x-default': `${SITE_URL}${paths.en}`,
  };
}

interface ToolStructuredDataInput {
  locale: ToolLocale;
  path: string;
  name: string;
  description: string;
  faq: FaqItem[];
  breadcrumbHome: string;
}

export function kitchenToolStructuredData({ locale, path, name, description, faq, breadcrumbHome }: ToolStructuredDataInput) {
  const url = `${SITE_URL}${path}`;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name,
      description,
      url,
      inLanguage: locale,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any (web browser)',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: locale === 'de' ? 'EUR' : 'USD' },
      publisher: { '@type': 'Organization', name: 'TasteBuddy', url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: locale,
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: breadcrumbHome, item: `${SITE_URL}${locale === 'de' ? '/de/' : '/'}` },
        { '@type': 'ListItem', position: 2, name, item: url },
      ],
    },
  ];
}
