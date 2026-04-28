import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";
import type { FinancialOpsRecord } from "@/modules/financial-ops/types";

type Envelope<T> = { data?: T; message?: string; error?: { message?: string } };

export async function getFinancialOpsFromApi(): Promise<{
  records: FinancialOpsRecord[];
  error: string | null;
}> {
  const session = await getStoredAdminSession();
  if (!session) {
    return { records: [], error: "Admin session is not available for financial operations." };
  }

  try {
    const response = await fetch(`${getAdminApiBaseUrl()}/admin/financial-ops/cases`, {
      method: "GET",
      headers: {
        Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
      },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as Envelope<{ records: FinancialOpsRecord[] }> | null;
    if (!response.ok || !body?.data?.records) {
      return {
        records: [],
        error: body?.message ?? body?.error?.message ?? "Unable to load financial operations queue.",
      };
    }
    return { records: body.data.records, error: null };
  } catch {
    return { records: [], error: "Unable to load financial operations queue." };
  }
}
