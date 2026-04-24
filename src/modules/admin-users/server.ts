import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";
import type { AdminAccessRecord } from "@/modules/admin-users/types";
import { buildPermissionPolicies } from "@/modules/admin-users/service";

type Envelope<T> = {
  data?: T;
  message?: string;
  error?: { message?: string };
};

type AdminUsersApiRecord = Omit<AdminAccessRecord, "permissionPolicies"> & {
  inviteExpiresAt?: string;
  dateJoined?: string;
};

export async function getAdminUsersFromApi() {
  const session = await getStoredAdminSession();
  if (!session) {
    return {
      records: [] as AdminAccessRecord[],
      error: "Admin session is not available for admin user management.",
    };
  }

  try {
    const response = await fetch(`${getAdminApiBaseUrl()}/admin/admin-users`, {
      method: "GET",
      headers: {
        Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
      },
      cache: "no-store",
    });

    const body = (await response.json().catch(() => null)) as Envelope<AdminUsersApiRecord[]> | null;
    if (!response.ok || !body?.data) {
      return {
        records: [] as AdminAccessRecord[],
        error: body?.message ?? body?.error?.message ?? "Unable to load admin access records.",
      };
    }

    return {
      records: body.data.map((record) => ({
        ...record,
        permissionPolicies: buildPermissionPolicies(record.role),
      })),
      error: null,
    };
  } catch {
    return {
      records: [] as AdminAccessRecord[],
      error: "Unable to load admin access records.",
    };
  }
}
