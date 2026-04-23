import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_API_SESSION_COOKIE,
  getAdminApiBaseUrl,
  getStoredAdminSession,
} from "@/modules/auth/session";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ caseId: string }> },
) {
  const session = await getStoredAdminSession();
  if (!session) {
    return NextResponse.json(
      { message: "Admin session is not available.", error: { message: "Admin session is not available." } },
      { status: 401 },
    );
  }

  const { caseId } = await context.params;
  const body = await request.text();
  const response = await fetch(`${getAdminApiBaseUrl()}/admin/verification-cases/${caseId}/decision`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
    },
    body,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({
    message: "Unable to submit verification decision.",
    error: { message: "Unable to submit verification decision." },
  }));

  return NextResponse.json(payload, { status: response.status });
}
