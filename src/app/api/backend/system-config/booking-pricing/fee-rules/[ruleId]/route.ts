import { type NextRequest, NextResponse } from "next/server";

import {
  ADMIN_API_SESSION_COOKIE,
  getAdminApiBaseUrl,
  getStoredAdminSession,
} from "@/modules/auth/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> },
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

  const { ruleId } = await params;
  const body = await request.json().catch(() => ({}));
  const response = await fetch(`${getAdminApiBaseUrl()}/admin/system-config/booking-pricing/fee-rules/${ruleId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({
    message: "Unable to update fee rule.",
    error: { message: "Unable to update fee rule." },
  }));
  return NextResponse.json(payload, { status: response.status });
}
