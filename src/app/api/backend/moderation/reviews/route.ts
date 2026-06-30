import { type NextRequest, NextResponse } from "next/server";

import {
  ADMIN_API_SESSION_COOKIE,
  getAdminApiBaseUrl,
  getStoredAdminSession,
} from "@/modules/auth/session";

export async function GET(request: NextRequest) {
  const session = await getStoredAdminSession();
  if (!session) {
    return NextResponse.json(
      { message: "Admin session is not available.", error: { message: "Admin session is not available." } },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const upstream = new URL(`${getAdminApiBaseUrl()}/admin/reviews`);
  for (const [key, value] of searchParams.entries()) {
    upstream.searchParams.set(key, value);
  }

  const response = await fetch(upstream.toString(), {
    method: "GET",
    headers: {
      Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({
    message: "Unable to load review queue.",
    error: { message: "Unable to load review queue." },
  }));

  return NextResponse.json(payload, { status: response.status });
}
