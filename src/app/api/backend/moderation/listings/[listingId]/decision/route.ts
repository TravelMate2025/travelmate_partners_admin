import { type NextRequest, NextResponse } from "next/server";

import {
  ADMIN_API_SESSION_COOKIE,
  getAdminApiBaseUrl,
  getStoredAdminSession,
} from "@/modules/auth/session";

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
  const upstream = new URL(
    `${getAdminApiBaseUrl()}/admin/moderation/listings/${listingId}/decision`,
  );

  const response = await fetch(upstream.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
    },
    body,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({
    message: "Unable to apply moderation decision.",
    error: { message: "Unable to apply moderation decision." },
  }));

  return NextResponse.json(payload, { status: response.status });
}
