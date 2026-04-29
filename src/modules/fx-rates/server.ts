import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";
import type { FxRateRecord } from "@/modules/fx-rates/types";

type Envelope<T> = { data?: T; message?: string; error?: { message?: string } };

export async function getFxRatesFromApi(): Promise<{ records: FxRateRecord[]; error: string | null }> {
  const session = await getStoredAdminSession();
  if (!session) {
    return { records: [], error: "Admin session is not available for FX rates." };
  }

  try {
    const response = await fetch(`${getAdminApiBaseUrl()}/admin/fx-rates`, {
      method: "GET",
      headers: {
        Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
      },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as Envelope<{ records: FxRateRecord[] }> | null;
    if (!response.ok || !body?.data?.records) {
      return {
        records: [],
        error: body?.message ?? body?.error?.message ?? "Unable to load FX rates.",
      };
    }
    return { records: body.data.records, error: null };
  } catch {
    return { records: [], error: "Unable to load FX rates." };
  }
}
