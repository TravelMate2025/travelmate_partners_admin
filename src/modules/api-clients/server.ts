import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";
import type { ApiClientRecord } from "@/modules/api-clients/types";

type Envelope<T> = { data?: T; message?: string; error?: { message?: string } };

function sortNewestFirst(records: ApiClientRecord[]) {
  return [...records].sort(
    (a, b) =>
      Math.max(
        new Date(b.usage.lastActiveAt).getTime(),
        new Date(b.approvedAt ?? "").getTime(),
        new Date(b.submittedAt).getTime(),
      )
      - Math.max(
        new Date(a.usage.lastActiveAt).getTime(),
        new Date(a.approvedAt ?? "").getTime(),
        new Date(a.submittedAt).getTime(),
      ),
  );
}

export async function getApiClientsFromApi(): Promise<{ records: ApiClientRecord[]; error: string | null }> {
  const session = await getStoredAdminSession();
  if (!session) return { records: [], error: "Admin session is not available for API clients." };
  try {
    const response = await fetch(`${getAdminApiBaseUrl()}/admin/api-clients`, {
      method: "GET",
      headers: { Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}` },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as Envelope<{ records: ApiClientRecord[] }> | null;
    if (!response.ok || !body?.data?.records) {
      return { records: [], error: body?.message ?? body?.error?.message ?? "Unable to load API clients." };
    }
    return { records: sortNewestFirst(body.data.records), error: null };
  } catch {
    return { records: [], error: "Unable to load API clients." };
  }
}
