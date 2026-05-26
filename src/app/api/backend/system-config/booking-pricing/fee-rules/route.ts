import { type NextRequest, NextResponse } from "next/server";

import {
  ADMIN_API_SESSION_COOKIE,
  getAdminApiBaseUrl,
  getStoredAdminSession,
} from "@/modules/auth/session";

function unauthorizedResponse() {
  return NextResponse.json(
    {
      message: "Admin session is not available.",
      error: { message: "Admin session is not available." },
    },
    { status: 401 },
  );
}

export async function GET(request: NextRequest) {
  const session = await getStoredAdminSession();
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const upstream = new URL(`${getAdminApiBaseUrl()}/admin/system-config/booking-pricing/fee-rules`);
  for (const [key, value] of searchParams.entries()) {
    upstream.searchParams.set(key, value);
  }

  const response = await fetch(upstream.toString(), {
    method: "GET",
    headers: {
      Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({
    message: "Unable to load fee rules.",
    error: { message: "Unable to load fee rules." },
  }));
  return NextResponse.json(payload, { status: response.status });
}

export async function POST(request: NextRequest) {
  const session = await getStoredAdminSession();
  if (!session) return unauthorizedResponse();

  const body = await request.json().catch(() => ({}));
  const response = await fetch(`${getAdminApiBaseUrl()}/admin/system-config/booking-pricing/fee-rules`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({
    message: "Unable to create fee rule.",
    error: { message: "Unable to create fee rule." },
  }));
  return NextResponse.json(payload, { status: response.status });
}
