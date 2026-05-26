import { NextRequest, NextResponse } from "next/server";

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

async function probeCsrf(
  {
    url,
    sessionCookie,
    origin,
    referer,
  }: {
    url: string;
    sessionCookie: string;
    origin: string;
    referer: string;
  },
): Promise<{ csrfCookie: string | null; csrfToken: string | null }> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Cookie: sessionCookie,
      Origin: origin,
      Referer: referer,
    },
    cache: "no-store",
  });
  const csrfCookie = readCookieFromSetCookie(readResponseHeader(response, "set-cookie"), "csrftoken");
  const csrfToken = readResponseHeader(response, "X-CSRFToken") ?? csrfCookie;
  return { csrfCookie, csrfToken };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ suggestionId: string }> },
) {
  const session = await getStoredAdminSession();
  if (!session) {
    return NextResponse.json(
      { message: "Admin session is not available.", error: { message: "Admin session is not available." } },
      { status: 401 },
    );
  }

  const { suggestionId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const baseUrl = getAdminApiBaseUrl();
  const upstreamOrigin = new URL(baseUrl).origin;
  const upstreamReferer = `${upstreamOrigin}/`;
  const sessionCookie = `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`;

  // Prime CSRF cookie/token for session-authenticated write request.
  // Use multiple probes because deployments differ in where CSRF is emitted.
  let csrfCookie: string | null = null;
  let csrfToken: string | null = null;
  for (const probeUrl of [
    `${baseUrl}/admin/moderation/listings?status=all&kind=all&page=1&pageSize=1`,
    `${baseUrl}/admin/locality-suggestions?status=pending`,
    `${baseUrl}/auth/me`,
  ]) {
    const probe = await probeCsrf({
      url: probeUrl,
      sessionCookie,
      origin: upstreamOrigin,
      referer: upstreamReferer,
    });
    csrfCookie = csrfCookie ?? probe.csrfCookie;
    csrfToken = csrfToken ?? probe.csrfToken;
    if (csrfCookie || csrfToken) {
      break;
    }
  }
  const cookieParts = [sessionCookie];
  if (csrfCookie || csrfToken) {
    cookieParts.push(`csrftoken=${csrfCookie ?? csrfToken}`);
  }

  const response = await fetch(
    `${baseUrl}/admin/locality-suggestions/${encodeURIComponent(suggestionId)}/decision`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
        Origin: upstreamOrigin,
        Referer: upstreamReferer,
        Cookie: cookieParts.join("; "),
      },
      body: JSON.stringify({
        action: body?.action,
        note: body?.note ?? "",
        mergeTargetCity: body?.mergeTargetCity ?? "",
      }),
      cache: "no-store",
    },
  );

  const raw = await response.text();
  let payload: Record<string, unknown>;
  try {
    payload = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    const fallbackMessage = raw.trim() || response.statusText || "Unable to apply locality suggestion decision.";
    payload = {
      message: fallbackMessage,
      error: { message: fallbackMessage },
    };
  }

  if (!response.ok) {
    const message =
      (payload.message as string | undefined)
      ?? ((payload.error as { message?: string } | undefined)?.message)
      ?? `Unable to apply locality suggestion decision (status ${response.status}).`;
    payload = {
      ...payload,
      message,
      error: { message },
    };
  }

  return NextResponse.json(payload, { status: response.status });
}
