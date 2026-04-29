import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";
import type { PartnerRecord } from "@/modules/partner-operations/types";

type Envelope<T> = { data?: T; message?: string; error?: { message?: string } };

export async function getPartnerOperationsFromApi(): Promise<{ records: PartnerRecord[]; error: string | null }> {
  const session = await getStoredAdminSession();
  if (!session) return { records: [], error: "Admin session is not available for partner operations." };
  try {
    const response = await fetch(`${getAdminApiBaseUrl()}/admin/partner-operations`, {
      method: "GET",
      headers: { Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}` },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as Envelope<{ records: PartnerRecord[] }> | null;
    if (!response.ok || !body?.data?.records) {
      return { records: [], error: body?.message ?? body?.error?.message ?? "Unable to load partner operations." };
    }
    return { records: body.data.records, error: null };
  } catch {
    return { records: [], error: "Unable to load partner operations." };
  }
}
