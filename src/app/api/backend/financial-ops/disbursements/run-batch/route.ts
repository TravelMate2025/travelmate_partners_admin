import { NextResponse } from "next/server";

import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";

export async function POST() {
  const session = await getStoredAdminSession();
  if (!session) {
    return NextResponse.json(
      { message: "Admin session is not available.", error: { message: "Admin session is not available." } },
      { status: 401 },
    );
  }

  const response = await fetch(`${getAdminApiBaseUrl()}/admin/financial-ops/disbursements/run-batch`, {
    method: "POST",
    headers: {
      Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({
    message: "Batch disbursement run failed.",
    error: { message: "Batch disbursement run failed." },
  }));

  return NextResponse.json(payload, { status: response.status });
}
