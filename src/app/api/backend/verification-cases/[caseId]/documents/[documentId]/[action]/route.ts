import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_API_SESSION_COOKIE,
  getAdminApiBaseUrl,
  getStoredAdminSession,
} from "@/modules/auth/session";

const ALLOWED_ACTIONS = new Set(["download", "view"]);

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ caseId: string; documentId: string; action: string }> },
) {
  const session = await getStoredAdminSession();
  if (!session) {
    return NextResponse.json(
      { message: "Admin session is not available.", error: { message: "Admin session is not available." } },
      { status: 401 },
    );
  }

  const { caseId, documentId, action } = await context.params;
  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json(
      { message: "Document action is not supported.", error: { message: "Document action is not supported." } },
      { status: 404 },
    );
  }

  const response = await fetch(
    `${getAdminApiBaseUrl()}/admin/verification-cases/${caseId}/documents/${documentId}/${action}`,
    {
      method: "GET",
      headers: {
        Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
      },
      cache: "no-store",
    },
  );

  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok && contentType.includes("application/json")) {
    const payload = await response.json().catch(() => ({
      message: "Unable to fetch verification document.",
      error: { message: "Unable to fetch verification document." },
    }));
    return NextResponse.json(payload, { status: response.status });
  }

  const headers = new Headers();
  for (const headerName of [
    "content-type",
    "content-disposition",
    "cache-control",
    "content-length",
    "x-content-type-options",
  ]) {
    const value = response.headers.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers,
  });
}
