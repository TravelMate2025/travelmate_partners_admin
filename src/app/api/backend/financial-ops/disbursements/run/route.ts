import { type NextRequest, NextResponse } from "next/server";

import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";

export async function POST(request: NextRequest) {
  const session = await getStoredAdminSession();
  if (!session) {
    return NextResponse.json(
      { message: "Admin session is not available.", error: { message: "Admin session is not available." } },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.settlementId) {
    return NextResponse.json({ message: "settlementId is required." }, { status: 400 });
  }

  const response = await fetch(`${getAdminApiBaseUrl()}/admin/financial-ops/disbursements/run`, {
    method: "POST",
    headers: {
      Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ settlementId: body.settlementId }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({
    message: "Disbursement run failed.",
    error: { message: "Disbursement run failed." },
  }));

  return NextResponse.json(payload, { status: response.status });
}
