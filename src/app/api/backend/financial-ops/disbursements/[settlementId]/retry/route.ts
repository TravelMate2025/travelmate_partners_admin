import { type NextRequest, NextResponse } from "next/server";

import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";

export async function POST(
  _request: NextRequest,
  { params }: { params: { settlementId: string } },
) {
  const session = await getStoredAdminSession();
  if (!session) {
    return NextResponse.json(
      { message: "Admin session is not available.", error: { message: "Admin session is not available." } },
      { status: 401 },
    );
  }

  const { settlementId } = params;

  const response = await fetch(
    `${getAdminApiBaseUrl()}/admin/financial-ops/disbursements/${encodeURIComponent(settlementId)}/retry`,
    {
      method: "POST",
      headers: {
        Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
      cache: "no-store",
    },
  );

  const payload = await response.json().catch(() => ({
    message: "Unable to retry disbursement.",
    error: { message: "Unable to retry disbursement." },
  }));

  return NextResponse.json(payload, { status: response.status });
}
