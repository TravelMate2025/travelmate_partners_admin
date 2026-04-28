import { type NextRequest, NextResponse } from "next/server";

import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ appealId: string }> },
) {
  try {
    const session = await getStoredAdminSession();
    if (!session) {
      return NextResponse.json(
        { message: "Admin session is not available.", error: { message: "Admin session is not available." } },
        { status: 401 },
      );
    }

    const { appealId } = await context.params;
    const body = await request.text();

    const response = await fetch(`${getAdminApiBaseUrl()}/admin/listing-appeals/${encodeURIComponent(appealId)}/resolve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
      },
      body,
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({
      message: "Unable to resolve listing appeal.",
      error: { message: "Unable to resolve listing appeal." },
    }));

    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      {
        message: "Unable to resolve listing appeal. The backend may be unavailable.",
        error: { message: "Unable to resolve listing appeal. The backend may be unavailable." },
      },
      { status: 502 },
    );
  }
}
