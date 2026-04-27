import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    console.info('browser_analytics', {
      event: body.event,
      payload: body.payload ?? {},
      page_path: body.page_path,
      page_title: body.page_title,
      happened_at: body.happened_at,
    });
  } catch (error) {
    console.error('browser_analytics_error', error);
  }

  return new Response(null, {
    status: 204,
  });
};
