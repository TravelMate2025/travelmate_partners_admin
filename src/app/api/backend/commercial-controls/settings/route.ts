import { type NextRequest, NextResponse } from "next/server";

import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";

export async function GET(_request: NextRequest) {
  const session = await getStoredAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Admin session is not available.", error: { message: "Admin session is not available." } }, { status: 401 });
  }
  const response = await fetch(`${getAdminApiBaseUrl()}/admin/commercial-controls/settings`, {
    method: "GET",
    headers: { Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}` },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({ message: "Unable to load commercial settings.", error: { message: "Unable to load commercial settings." } }));
  return NextResponse.json(payload, { status: response.status });
}

export async function PATCH(request: NextRequest) {
  const session = await getStoredAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Admin session is not available.", error: { message: "Admin session is not available." } }, { status: 401 });
  }
  const body = await request.text();
  const response = await fetch(`${getAdminApiBaseUrl()}/admin/commercial-controls/settings`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
    },
    body,
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({ message: "Unable to update commercial settings.", error: { message: "Unable to update commercial settings." } }));
  return NextResponse.json(payload, { status: response.status });
}
