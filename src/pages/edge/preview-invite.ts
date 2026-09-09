import type { APIRoute } from "astro";

export const prerender = false;

const TOKEN_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8"
};

export const GET: APIRoute = async ({ request }) => {
  const token = new URL(request.url).searchParams.get("token");

  if (!token) {
    return response({ status: "invalid", error: "missing_or_malformed_token" }, 400);
  }
  if (!TOKEN_PATTERN.test(token)) {
    return response({ status: "invalid", error: "missing_or_malformed_token" }, 200);
  }

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Cookbook invite preview is missing Supabase configuration");
    return response({ status: "invalid", error: "preview_service_unavailable" }, 503);
  }

  try {
    const functionUrl = new URL(
      "/functions/v1/preview-cookbook-invite",
      supabaseUrl
    );
    functionUrl.searchParams.set("token", token);
    const functionResponse = await fetch(functionUrl, {
      headers: {
        Accept: "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`
      }
    });
    const payload = (await functionResponse.json().catch(() => null)) as
      | FunctionInvitePayload
      | null;

    if (!functionResponse.ok || !payload?.status) {
      console.error(
        "Cookbook invite preview function failed",
        functionResponse.status
      );
      return response({ status: "invalid", error: "preview_service_unavailable" }, 502);
    }

    if (payload.status === "invalid" || payload.status === "rejected") {
      return response({ status: "invalid", error: "invalid_or_unavailable_token" }, 200);
    }
    if (
      payload.status !== "valid" &&
      payload.status !== "expired" &&
      payload.status !== "accepted"
    ) {
      return response({ status: "invalid", error: "preview_service_unavailable" }, 502);
    }

    return response(
      {
        status: payload.status,
        inviterName: payload.inviterName,
        inviterAvatarUrl: payload.inviterAvatarUrl,
        cookbookTitle: payload.cookbookTitle,
        permission: toPermission(payload.permissions),
        expiresAt: payload.expiresAt
      },
      200
    );
  } catch (error) {
    console.error(
      "Cookbook invite preview request failed",
      error instanceof Error ? error.message : error
    );
    return response({ status: "invalid", error: "preview_service_unavailable" }, 502);
  }
};

type InviteStatus = "valid" | "expired" | "accepted";
type FunctionInviteStatus = InviteStatus | "rejected" | "invalid";
type InvitePermission = "view" | "comment" | "edit";

type FunctionInvitePayload = {
  status: FunctionInviteStatus;
  inviterName: string | null;
  inviterAvatarUrl: string | null;
  cookbookTitle: string | null;
  permissions: string | null;
  expiresAt: string | null;
};

type InvitePayload =
  | {
      status: InviteStatus;
      inviterName: string | null;
      inviterAvatarUrl: string | null;
      cookbookTitle: string | null;
      permission: InvitePermission;
      expiresAt: string | null;
    }
  | {
      status: "invalid";
      error: string;
    };

function toPermission(value: string | null): InvitePermission {
  return value === "comment" || value === "edit" ? value : "view";
}

function response(body: InvitePayload, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: RESPONSE_HEADERS
  });
}
