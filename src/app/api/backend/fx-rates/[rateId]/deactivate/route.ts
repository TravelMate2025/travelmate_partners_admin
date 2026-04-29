import { type NextRequest, NextResponse } from "next/server";

import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ rateId: string }> },
) {
  const session = await getStoredAdminSession();
  if (!session) {
    return NextResponse.json(
      { message: "Admin session is not available.", error: { message: "Admin session is not available." } },
      { status: 401 },
    );
  }

  const { rateId } = await context.params;
  const response = await fetch(`${getAdminApiBaseUrl()}/admin/fx-rates/${encodeURIComponent(rateId)}/deactivate`, {
    method: "POST",
    headers: {
      Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({
    message: "Unable to deactivate FX rate.",
    error: { message: "Unable to deactivate FX rate." },
  }));

  return NextResponse.json(payload, { status: response.status });
}
