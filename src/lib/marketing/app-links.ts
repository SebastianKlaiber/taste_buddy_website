import type { Locale } from './types';

export const SITE_URL = 'https://taste-buddy.app';
export const WEB_APP_URL = '/app/';
export const APPLE_URL = 'https://apps.apple.com/app/apple-store/id6554007741?pt=127208178&ct=Website&mt=8';
export const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=app.tastebuddy';

export function getWebAppHref(path = '') {
  const normalizedPath = path.replace(/^\/+/, '');
  return `${WEB_APP_URL}${normalizedPath}`;
}

export function getGoHref(slug: string, platform?: 'ios' | 'android') {
  const normalizedSlug = slug.replace(/_/g, '-');
  if (!platform) {
    return `/go/${normalizedSlug}/`;
  }
  return `/go/${normalizedSlug}/?platform=${platform}`;
}

export function getLocalizedPath(locale: Locale, path: string) {
  if (locale === 'en') {
    return path;
  }
  if (path === '/') {
    return '/de/';
  }
  return `/de${path}`;
}

export function buildAlternates(path: string) {
  const normalized = path.endsWith('/') ? path : `${path}/`;
  const enPath = normalized.startsWith('/de/') ? normalized.replace(/^\/de\//, '/') : normalized;
  const dePath = normalized.startsWith('/de/') ? normalized : normalized === '/' ? '/de/' : `/de${normalized}`;

  return {
    en: `${SITE_URL}${enPath}`,
    de: `${SITE_URL}${dePath}`,
    'x-default': `${SITE_URL}${enPath}`,
  };
}
