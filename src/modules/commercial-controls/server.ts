import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";

type CommercialSetting = {
  commissionRatePercent: string;
  taxWithholdingPercent: string;
  serviceFeeFlatAmount: number;
  updatedBy?: string;
  updatedAt?: string;
};

type Envelope<T> = { data?: T; message?: string; error?: { message?: string } };

export async function getCommercialSettingsFromApi(): Promise<{ setting: CommercialSetting | null; error: string | null }> {
  const session = await getStoredAdminSession();
  if (!session) {
    return { setting: null, error: "Admin session is not available for commercial controls." };
  }
  try {
    const response = await fetch(`${getAdminApiBaseUrl()}/admin/commercial-controls/settings`, {
      method: "GET",
      headers: { Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}` },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as Envelope<CommercialSetting> | null;
    if (!response.ok || !body?.data) {
      return { setting: null, error: body?.message ?? body?.error?.message ?? "Unable to load commercial settings." };
    }
    return { setting: body.data, error: null };
  } catch {
    return { setting: null, error: "Unable to load commercial settings." };
  }
}
