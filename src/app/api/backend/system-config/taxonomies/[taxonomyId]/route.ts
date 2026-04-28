import { type NextRequest, NextResponse } from "next/server";

import {
  ADMIN_API_SESSION_COOKIE,
  getAdminApiBaseUrl,
  getStoredAdminSession,
} from "@/modules/auth/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taxonomyId: string }> },
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

  const { taxonomyId } = await params;
  const body = await request.json().catch(() => ({}));
  const response = await fetch(`${getAdminApiBaseUrl()}/admin/system-config/taxonomies/${taxonomyId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({
    message: "Unable to update taxonomy option.",
    error: { message: "Unable to update taxonomy option." },
  }));
  return NextResponse.json(payload, { status: response.status });
}
