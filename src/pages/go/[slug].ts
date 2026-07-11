import type { APIRoute } from 'astro';
import { getRedirectRecord } from '../../lib/marketing/content';

export const prerender = false;

function detectPlatform(userAgent: string | null) {
  const ua = userAgent?.toLowerCase() ?? '';
  if (ua.includes('android')) {
    return 'android';
  }
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod') || ua.includes('mac os')) {
    return 'ios';
  }
  return 'fallback';
}

export const GET: APIRoute = async ({ params, request, redirect }) => {
  if (!params.slug) {
    return redirect('/', 302);
  }

  let record;
  try {
    record = getRedirectRecord(params.slug);
  } catch {
    return redirect('/', 302);
  }

  const requestedPlatform = new URL(request.url).searchParams.get('platform');
  const platform = requestedPlatform ?? detectPlatform(request.headers.get('user-agent'));

  console.info('redirect_hit', {
    slug: record.slug,
    platform,
    source: record.source,
    medium: record.medium,
    campaign: record.campaign,
    content: record.content,
  });

  if (platform === 'ios') {
    return redirect(record.ios_url, 302);
  }

  if (platform === 'android') {
    return redirect(record.android_url, 302);
  }

  return redirect(record.fallback_url, 302);
};
