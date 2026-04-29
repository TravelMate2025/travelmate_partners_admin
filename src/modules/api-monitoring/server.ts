import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";
import type { ApiMonitoringRecord } from "@/modules/api-monitoring/types";

type Envelope<T> = { data?: T; message?: string; error?: { message?: string } };

export async function getApiMonitoringFromApi(): Promise<{ records: ApiMonitoringRecord[]; error: string | null }> {
  const session = await getStoredAdminSession();
  if (!session) return { records: [], error: "Admin session is not available for API monitoring." };
  try {
    const response = await fetch(`${getAdminApiBaseUrl()}/admin/api-monitoring`, {
      method: "GET",
      headers: { Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}` },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as Envelope<{ records: ApiMonitoringRecord[] }> | null;
    if (!response.ok || !body?.data?.records) {
      return { records: [], error: body?.message ?? body?.error?.message ?? "Unable to load API monitoring queue." };
    }
    return { records: body.data.records, error: null };
  } catch {
    return { records: [], error: "Unable to load API monitoring queue." };
  }
}
