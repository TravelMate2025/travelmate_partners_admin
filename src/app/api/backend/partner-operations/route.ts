import { type NextRequest, NextResponse } from "next/server";
import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";

export async function GET(_request: NextRequest) {
  const session = await getStoredAdminSession();
  if (!session) return NextResponse.json({ message: "Admin session is not available.", error: { message: "Admin session is not available." } }, { status: 401 });
  const response = await fetch(`${getAdminApiBaseUrl()}/admin/partner-operations`, { method: "GET", headers: { Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}` }, cache: "no-store" });
  const payload = await response.json().catch(() => ({ message: "Unable to load partner operations.", error: { message: "Unable to load partner operations." } }));
  return NextResponse.json(payload, { status: response.status });
}
