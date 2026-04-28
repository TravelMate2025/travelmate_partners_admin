import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";
import type { ReportExportRecord, ReportSnapshot } from "@/modules/reports/types";

type Envelope<T> = { data?: T; message?: string; error?: { message?: string } };

export async function getReportsFromApi(region = "all", timeframe = "30d"): Promise<{
  snapshot: ReportSnapshot | null;
  exports: ReportExportRecord[];
  error: string | null;
}> {
  const session = await getStoredAdminSession();
  if (!session) {
    return { snapshot: null, exports: [], error: "Admin session is not available for reports." };
  }

  try {
    const response = await fetch(
      `${getAdminApiBaseUrl()}/admin/reports?region=${encodeURIComponent(region)}&timeframe=${encodeURIComponent(timeframe)}`,
      {
        method: "GET",
        headers: {
          Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
        },
        cache: "no-store",
      },
    );
    const body = (await response.json().catch(() => null)) as Envelope<{
      snapshot: ReportSnapshot;
      exports: ReportExportRecord[];
    }> | null;
    if (!response.ok || !body?.data?.snapshot || !body.data.exports) {
      return {
        snapshot: null,
        exports: [],
        error: body?.message ?? body?.error?.message ?? "Unable to load reports.",
      };
    }
    return { snapshot: body.data.snapshot, exports: body.data.exports, error: null };
  } catch {
    return { snapshot: null, exports: [], error: "Unable to load reports." };
  }
}
