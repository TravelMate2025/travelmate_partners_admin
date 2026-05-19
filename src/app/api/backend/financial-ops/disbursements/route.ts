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

  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") ?? "1";
  const pageSize = searchParams.get("pageSize") ?? "50";

  const response = await fetch(
    `${getAdminApiBaseUrl()}/admin/financial-ops/disbursements?page=${page}&pageSize=${pageSize}`,
    {
      method: "GET",
      headers: { Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}` },
      cache: "no-store",
    },
  );

  const payload = await response.json().catch(() => ({
    message: "Unable to load disbursements.",
    error: { message: "Unable to load disbursements." },
  }));

  return NextResponse.json(payload, { status: response.status });
}
