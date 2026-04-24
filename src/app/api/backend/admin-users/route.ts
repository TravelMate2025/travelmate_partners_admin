import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_API_SESSION_COOKIE,
  getAdminApiBaseUrl,
  getStoredAdminSession,
} from "@/modules/auth/session";

export async function GET() {
  const session = await getStoredAdminSession();
  if (!session) {
    return NextResponse.json(
      { message: "Admin session is not available.", error: { message: "Admin session is not available." } },
      { status: 401 },
    );
  }

  const response = await fetch(`${getAdminApiBaseUrl()}/admin/admin-users`, {
    method: "GET",
    headers: {
      Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({
    message: "Unable to load admin access records.",
    error: { message: "Unable to load admin access records." },
  }));

  return NextResponse.json(payload, { status: response.status });
}

export async function POST(request: NextRequest) {
  const session = await getStoredAdminSession();
  if (!session) {
    return NextResponse.json(
      { message: "Admin session is not available.", error: { message: "Admin session is not available." } },
      { status: 401 },
    );
  }

  const body = await request.text();
  const response = await fetch(`${getAdminApiBaseUrl()}/admin/admin-users/invite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
    },
    body,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({
    message: "Unable to send the admin invite.",
    error: { message: "Unable to send the admin invite." },
  }));

  return NextResponse.json(payload, { status: response.status });
}
