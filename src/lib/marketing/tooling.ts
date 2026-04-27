import { getFeedSiteByDomain, listFeedSites } from './content';

const KNOWN_LINK_IN_BIO_DOMAINS = new Set([
  'linktr.ee',
  'linktree.com',
  'beacons.ai',
  'bio.link',
  'campsite.bio',
  'tap.bio',
  'lnk.bio',
  'about.me',
  'carrd.co',
  'stan.store',
]);

const DIRECT_IMPORT_SOURCES = new Map([
  ['www.tiktok.com', 'TikTok'],
  ['tiktok.com', 'TikTok'],
  ['vm.tiktok.com', 'TikTok'],
  ['www.instagram.com', 'Instagram'],
  ['instagram.com', 'Instagram'],
  ['www.pinterest.com', 'Pinterest'],
  ['pinterest.com', 'Pinterest'],
  ['www.youtube.com', 'YouTube'],
  ['youtube.com', 'YouTube'],
  ['youtu.be', 'YouTube'],
]);

function normalizeUrl(rawUrl: string) {
  const withProtocol = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  return new URL(withProtocol);
}

export async function detectRssFeeds(rawUrl: string) {
  const url = normalizeUrl(rawUrl);
  const knownFeed = getFeedSiteByDomain(url.hostname.replace(/^www\./, ''));
  if (knownFeed) {
    return {
      ok: true,
      checkedUrl: url.toString(),
      detectedFeeds: [
        {
          title: knownFeed.name,
          url: knownFeed.feed_url,
          source: 'predefined',
        },
      ],
      note: knownFeed.recommended_reason,
    };
  }

  const response = await fetch(url, {
    headers: {
      'user-agent': 'TasteBuddyWebsiteBot/1.0 (+https://taste-buddy.app)',
      accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    return {
      ok: false,
      checkedUrl: url.toString(),
      detectedFeeds: [],
      note: `The website returned HTTP ${response.status}.`,
    };
  }

  const html = await response.text();
  const matches = [...html.matchAll(/<link[^>]+type=["']application\/(?:rss|atom)\+xml["'][^>]+href=["']([^"']+)["']/gi)];
  const detectedFeeds = matches.map((match, index) => ({
    title: `Feed ${index + 1}`,
    url: new URL(match[1], url).toString(),
    source: 'html',
  }));

  return {
    ok: detectedFeeds.length > 0,
    checkedUrl: url.toString(),
    detectedFeeds,
    note:
      detectedFeeds.length > 0
        ? 'Feed links were detected in the page metadata.'
        : 'No RSS or Atom feed links were detected in the page metadata.',
  };
}

export function detectImportSupport(rawUrl: string) {
  const url = normalizeUrl(rawUrl);
  const host = url.hostname.toLowerCase();
  const directSource = DIRECT_IMPORT_SOURCES.get(host);

  if (directSource) {
    return {
      status: 'supported',
      source: directSource,
      checkedUrl: url.toString(),
      nextStep: `Share or paste this ${directSource} link into TasteBuddy.`,
    };
  }

  if (KNOWN_LINK_IN_BIO_DOMAINS.has(host)) {
    return {
      status: 'needs_resolution',
      source: 'Link in bio',
      checkedUrl: url.toString(),
      nextStep: 'Open the linked destination first, then save the actual recipe page into TasteBuddy.',
    };
  }

  return {
    status: 'website',
    source: 'Website',
    checkedUrl: url.toString(),
    nextStep: 'Paste the recipe URL into TasteBuddy. If the page blocks structured import, use the AI builder fallback.',
  };
}

export function resolveLinkInBio(rawUrl: string) {
  const url = normalizeUrl(rawUrl);
  const host = url.hostname.toLowerCase();

  return {
    checkedUrl: url.toString(),
    isKnownLinkInBio: KNOWN_LINK_IN_BIO_DOMAINS.has(host),
    host,
    recommendation: KNOWN_LINK_IN_BIO_DOMAINS.has(host)
      ? 'This looks like a link-in-bio hub. Open the final recipe page and import that URL instead.'
      : 'This is not a known link-in-bio domain in TasteBuddy’s fallback rules.',
    knownSources: listFeedSites().length,
  };
}
