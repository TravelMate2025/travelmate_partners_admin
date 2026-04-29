import { type NextRequest, NextResponse } from "next/server";
import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";

type Context = { params: Promise<{ partnerId: string }> };

export async function POST(request: NextRequest, context: Context) {
  const session = await getStoredAdminSession();
  if (!session) return NextResponse.json({ message: "Admin session is not available.", error: { message: "Admin session is not available." } }, { status: 401 });
  const { partnerId } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ message: "Request body must be valid JSON.", error: { message: "Request body must be valid JSON." } }, { status: 400 });
  const response = await fetch(`${getAdminApiBaseUrl()}/admin/partner-operations/${encodeURIComponent(partnerId)}/action`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}` }, body: JSON.stringify(body), cache: "no-store" });
  const payload = await response.json().catch(() => ({ message: "Unable to apply partner action.", error: { message: "Unable to apply partner action." } }));
  return NextResponse.json(payload, { status: response.status });
}
