import type { APIRoute } from "astro";

export const prerender = false;

const DEMO_RESPONSES: Record<string, InvitePayload> = {
  "valid-demo": {
    status: "valid",
    inviterName: "Sebastian Klaiber",
    inviterAvatarUrl: "https://i.pravatar.cc/300?img=12",
    cookbookTitle: "Sunday Brunch",
    permission: "edit",
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  "expired-demo": {
    status: "expired",
    inviterName: "Maya Chen",
    inviterAvatarUrl: null,
    cookbookTitle: "Meal Prep Club",
    permission: "view",
    expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  "accepted-demo": {
    status: "accepted",
    inviterName: "Noah Patel",
    inviterAvatarUrl: null,
    cookbookTitle: "Family Favorites",
    permission: "comment",
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
  }
};

const RATE_LIMIT_HEADERS = {
  "Cache-Control": "private, max-age=60",
  "Content-Type": "application/json; charset=utf-8"
};

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return response({ status: "invalid", error: "missing_or_malformed_token" }, 400);
  }

  // Temporary demo responses so the landing page can be developed without the real Edge Function.
  if (token in DEMO_RESPONSES) {
    return response(DEMO_RESPONSES[token], 200);
  }

  // Until the real preview endpoint is wired up, treat every other token as valid demo data.
  return response(
    {
      status: "valid",
      inviterName: "TasteBuddy Cook",
      inviterAvatarUrl: null,
      cookbookTitle: "Shared Recipes",
      permission: "view",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    200
  );
};

type InviteStatus = "valid" | "expired" | "accepted";
type InvitePermission = "view" | "comment" | "edit";

type InvitePayload =
  | {
      status: InviteStatus;
      inviterName: string;
      inviterAvatarUrl: string | null;
      cookbookTitle: string;
      permission: InvitePermission;
      expiresAt: string | null;
    }
  | {
      status: "invalid";
      error: string;
    };

function response(body: InvitePayload, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: RATE_LIMIT_HEADERS
  });
}
