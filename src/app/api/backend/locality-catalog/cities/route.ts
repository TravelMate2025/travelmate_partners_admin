import { NextRequest, NextResponse } from "next/server";

import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";

export async function GET(request: NextRequest) {
  const session = await getStoredAdminSession();
  if (!session) {
    return NextResponse.json(
      { message: "Admin session is not available.", error: { message: "Admin session is not available." } },
      { status: 401 },
    );
  }

  const upstream = new URL(`${getAdminApiBaseUrl()}/admin/locality-catalog/cities`);
  const { searchParams } = new URL(request.url);
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
    message: "Unable to load locality catalog cities.",
    error: { message: "Unable to load locality catalog cities." },
  }));

  return NextResponse.json(payload, { status: response.status });
}
