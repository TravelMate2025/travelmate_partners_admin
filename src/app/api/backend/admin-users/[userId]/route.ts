import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_API_SESSION_COOKIE,
  getAdminApiBaseUrl,
  getStoredAdminSession,
} from "@/modules/auth/session";

const actionEndpointMap = {
  resend_invite: "resend-invite",
  revoke_invite: "revoke-invite",
  activate_admin: "activate",
  deactivate_admin: "deactivate",
  delete_admin: "delete",
  assign_role: "assign-role",
} as const;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const session = await getStoredAdminSession();
  if (!session) {
    return NextResponse.json(
      { message: "Admin session is not available.", error: { message: "Admin session is not available." } },
      { status: 401 },
    );
  }

  const { userId } = await context.params;
  const parsed = (await request.json().catch(() => null)) as
    | {
        action?: keyof typeof actionEndpointMap;
        note?: string;
        targetRole?: string;
        confirmSensitiveGrant?: boolean;
      }
    | null;

  const action = parsed?.action;
  if (!action || !(action in actionEndpointMap)) {
    return NextResponse.json(
      { message: "Unsupported admin governance action.", error: { message: "Unsupported admin governance action." } },
      { status: 400 },
    );
  }

  const body =
    action === "assign_role"
      ? JSON.stringify({
          role: parsed?.targetRole ?? "",
          note: parsed?.note ?? "",
          confirmSensitiveGrant: Boolean(parsed?.confirmSensitiveGrant),
        })
      : JSON.stringify({
          note: parsed?.note ?? "",
          dashboardBaseUrl: request.nextUrl.origin,
        });

  const response = await fetch(`${getAdminApiBaseUrl()}/admin/admin-users/${userId}/${actionEndpointMap[action]}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
    },
    body,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({
    message: "Unable to update the admin governance record.",
    error: { message: "Unable to update the admin governance record." },
  }));

  return NextResponse.json(payload, { status: response.status });
}
