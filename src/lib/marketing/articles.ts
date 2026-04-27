import type { ArticleRecord, Locale } from './types';

interface ArticleModule {
  file: string;
  url: string;
  Content: unknown;
  frontmatter: ArticleRecord;
}

const articleModules = import.meta.glob<ArticleModule>('../../../content/articles/**/*.mdx', {
  eager: true,
});

function normalizeLocale(locale: string): Locale {
  return locale === 'de' ? 'de' : 'en';
}

export function listArticles(locale: Locale) {
  return Object.entries(articleModules)
    .map(([file, module]) => {
      const match = file.match(/content\/articles\/(en|de)\/([^/]+)\.mdx$/);
      const articleLocale = normalizeLocale(match?.[1] ?? 'en');
      const slug = match?.[2] ?? module.frontmatter.slug;
      return {
        ...module,
        file,
        slug,
        locale: articleLocale,
      };
    })
    .filter((module) => module.locale === locale)
    .sort((left, right) => new Date(right.frontmatter.date).getTime() - new Date(left.frontmatter.date).getTime());
}

export function getArticle(locale: Locale, slug: string) {
  const article = listArticles(locale).find((entry) => entry.slug === slug);
  if (!article) {
    throw new Error(`Missing article for ${locale}:${slug}`);
  }
  return article;
}
