import { type NextRequest, NextResponse } from "next/server";
import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";

type Context = { params: Promise<{ caseId: string }> };

export async function POST(request: NextRequest, context: Context) {
  const session = await getStoredAdminSession();
  if (!session) return NextResponse.json({ message: "Admin session is not available.", error: { message: "Admin session is not available." } }, { status: 401 });
  const { caseId } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ message: "Request body must be valid JSON.", error: { message: "Request body must be valid JSON." } }, { status: 400 });
  const response = await fetch(`${getAdminApiBaseUrl()}/admin/support-incidents/${encodeURIComponent(caseId)}/action`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}` }, body: JSON.stringify(body), cache: "no-store" });
  const payload = await response.json().catch(() => ({ message: "Unable to update support case.", error: { message: "Unable to update support case." } }));
  return NextResponse.json(payload, { status: response.status });
}
