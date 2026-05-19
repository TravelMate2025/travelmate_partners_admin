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
  const currency = searchParams.get("currency") ?? "NGN";

  const response = await fetch(
    `${getAdminApiBaseUrl()}/admin/financial-ops/disbursements/balance-check?currency=${encodeURIComponent(currency)}`,
    {
      method: "GET",
      headers: { Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}` },
      cache: "no-store",
    },
  );

  const payload = await response.json().catch(() => ({
    message: "Unable to load disbursement balance check.",
    error: { message: "Unable to load disbursement balance check." },
  }));

  return NextResponse.json(payload, { status: response.status });
}
