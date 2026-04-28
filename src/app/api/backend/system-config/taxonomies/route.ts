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
  if (!session) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const upstream = new URL(`${getAdminApiBaseUrl()}/admin/system-config/taxonomies`);
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
    message: "Unable to load taxonomy options.",
    error: { message: "Unable to load taxonomy options." },
  }));
  return NextResponse.json(payload, { status: response.status });
}

export async function POST(request: NextRequest) {
  const session = await getStoredAdminSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const body = await request.json().catch(() => ({}));
  const response = await fetch(`${getAdminApiBaseUrl()}/admin/system-config/taxonomies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({
    message: "Unable to create taxonomy option.",
    error: { message: "Unable to create taxonomy option." },
  }));
  return NextResponse.json(payload, { status: response.status });
}
