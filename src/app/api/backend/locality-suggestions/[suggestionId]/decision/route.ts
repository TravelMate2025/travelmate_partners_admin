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

  // Prime CSRF cookie/token for session-authenticated write request.
  const csrfProbe = await fetch(`${baseUrl}/admin/locality-suggestions?status=pending`, {
    method: "GET",
    headers: {
      Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
      Origin: upstreamOrigin,
      Referer: upstreamReferer,
    },
    cache: "no-store",
  });
  const csrfCookie = readCookieFromSetCookie(readResponseHeader(csrfProbe, "set-cookie"), "csrftoken");
  const csrfToken = readResponseHeader(csrfProbe, "X-CSRFToken") ?? csrfCookie;
  const cookieParts = [`${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`];
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
      }),
      cache: "no-store",
    },
  );

  const payload = await response.json().catch(() => ({
    message: "Unable to apply locality suggestion decision.",
    error: { message: "Unable to apply locality suggestion decision." },
  }));

  return NextResponse.json(payload, { status: response.status });
}
