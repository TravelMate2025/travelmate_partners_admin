import { type NextRequest, NextResponse } from "next/server";

import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";

export async function GET(request: NextRequest) {
  const session = await getStoredAdminSession();
  if (!session) {
    return NextResponse.json(
      { message: "Admin session is not available.", error: { message: "Admin session is not available." } },
      { status: 401 },
    );
  }

  const search = request.nextUrl.search;
  const response = await fetch(`${getAdminApiBaseUrl()}/admin/reports${search}`, {
    method: "GET",
    headers: {
      Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({
    message: "Unable to load reports.",
    error: { message: "Unable to load reports." },
  }));

  return NextResponse.json(payload, { status: response.status });
}
