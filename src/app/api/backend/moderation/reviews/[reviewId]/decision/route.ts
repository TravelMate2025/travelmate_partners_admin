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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ reviewId: string }> },
) {
  const session = await getStoredAdminSession();
  if (!session) {
    return NextResponse.json(
      { message: "Admin session is not available.", error: { message: "Admin session is not available." } },
      { status: 401 },
    );
  }

  const { reviewId } = await context.params;
  const body = await request.text();
  const parsed = body ? (JSON.parse(body) as { action?: string; reason?: string }) : {};
  const action = parsed.action === "reject" ? "reject" : "publish";

  const baseUrl = getAdminApiBaseUrl();
  const upstreamOrigin = new URL(baseUrl).origin;
  const upstreamReferer = `${upstreamOrigin}/`;
  const upstream = new URL(`${baseUrl}/admin/reviews/${reviewId}/${action}`);

  const csrfProbe = await fetch(`${baseUrl}/admin/reviews?status=pending_moderation&page=1&pageSize=1`, {
    method: "GET",
    headers: {
      Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
      Origin: upstreamOrigin,
      Referer: upstreamReferer,
    },
    cache: "no-store",
  });
  const csrfCookie = readCookieFromSetCookie(csrfProbe.headers.get("set-cookie"), "csrftoken");
  const csrfToken = csrfProbe.headers.get("X-CSRFToken") ?? csrfCookie;

  const cookieParts = [`${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`];
  if (csrfCookie || csrfToken) {
    cookieParts.push(`csrftoken=${csrfCookie ?? csrfToken}`);
  }

  const upstreamBody = action === "reject" ? JSON.stringify({ reason: parsed.reason ?? "" }) : "{}";

  const response = await fetch(upstream.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
      Origin: upstreamOrigin,
      Referer: upstreamReferer,
      Cookie: cookieParts.join("; "),
    },
    body: upstreamBody,
    cache: "no-store",
  });

  const raw = await response.text();
  let payload: Record<string, unknown>;
  try {
    payload = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    const fallbackMessage = raw.trim() || response.statusText || "Unable to apply review decision.";
    payload = { message: fallbackMessage, error: { message: fallbackMessage } };
  }

  if (!response.ok) {
    const message =
      (payload.message as string | undefined) ??
      ((payload.error as { message?: string } | undefined)?.message) ??
      `Unable to apply review decision (status ${response.status}).`;
    payload = { ...payload, message, error: { message } };
  }

  return NextResponse.json(payload, { status: response.status });
}
