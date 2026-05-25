import { type NextRequest, NextResponse } from "next/server";

import {
  ADMIN_API_SESSION_COOKIE,
  getAdminApiBaseUrl,
  getStoredAdminSession,
} from "@/modules/auth/session";

function readCookieFromSetCookie(headerValue: string | null, name: string) {
  if (!headerValue) {
    return null;
  }
  const match = headerValue.match(new RegExp(`${name}=([^;]+)`));
  return match?.[1] ?? null;
}

function readResponseHeader(response: Response, headerName: string) {
  return response.headers.get(headerName);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ listingId: string }> },
) {
  const session = await getStoredAdminSession();
  if (!session) {
    return NextResponse.json(
      {
        message: "Admin session is not available.",
        error: { message: "Admin session is not available." },
      },
      { status: 401 },
    );
  }

  const { listingId } = await context.params;
  const body = await request.text();
  const baseUrl = getAdminApiBaseUrl();
  const upstream = new URL(
    `${baseUrl}/admin/moderation/listings/${listingId}/decision`,
  );

  // Prime CSRF cookie/token for session-authenticated write request.
  const csrfProbe = await fetch(`${baseUrl}/admin/moderation/listings?status=all&kind=all&page=1&pageSize=1`, {
    method: "GET",
    headers: {
      Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
    },
    cache: "no-store",
  });
  const csrfCookie = readCookieFromSetCookie(readResponseHeader(csrfProbe, "set-cookie"), "csrftoken");
  const csrfToken = readResponseHeader(csrfProbe, "X-CSRFToken") ?? csrfCookie;

  const cookieParts = [`${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`];
  if (csrfCookie || csrfToken) {
    cookieParts.push(`csrftoken=${csrfCookie ?? csrfToken}`);
  }

  const response = await fetch(upstream.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
      Cookie: cookieParts.join("; "),
    },
    body,
    cache: "no-store",
  });

  const raw = await response.text();
  let payload: Record<string, unknown>;
  try {
    payload = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    const fallbackMessage = raw.trim() || response.statusText || "Unable to apply moderation decision.";
    payload = {
      message: fallbackMessage,
      error: { message: fallbackMessage },
    };
  }

  if (!response.ok) {
    const message =
      (payload.message as string | undefined)
      ?? ((payload.error as { message?: string } | undefined)?.message)
      ?? `Unable to apply moderation decision (status ${response.status}).`;
    payload = {
      ...payload,
      message,
      error: { message },
    };
  }

  return NextResponse.json(payload, { status: response.status });
}
