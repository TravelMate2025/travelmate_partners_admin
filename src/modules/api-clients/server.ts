import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";
import type { ApiClientRecord } from "@/modules/api-clients/types";

type Envelope<T> = { data?: T; message?: string; error?: { message?: string } };

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
    return { records: body.data.records, error: null };
  } catch {
    return { records: [], error: "Unable to load API clients." };
  }
}
