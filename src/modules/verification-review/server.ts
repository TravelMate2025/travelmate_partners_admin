import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";
import type { VerificationCase } from "@/modules/verification-review/types";

type Envelope<T> = {
  data?: T;
  message?: string;
  error?: { message?: string };
};

export async function getVerificationCasesFromApi() {
  const session = await getStoredAdminSession();
  if (!session) {
    return {
      cases: [] as VerificationCase[],
      error: "Admin session is not available for verification review.",
    };
  }

  try {
    const response = await fetch(`${getAdminApiBaseUrl()}/admin/verification-cases`, {
      method: "GET",
      headers: {
        Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
      },
      cache: "no-store",
    });

    const body = (await response.json().catch(() => null)) as Envelope<VerificationCase[]> | null;
    if (!response.ok || !body?.data) {
      return {
        cases: [] as VerificationCase[],
        error: body?.message ?? body?.error?.message ?? "Unable to load verification review cases.",
      };
    }

    return {
      cases: body.data,
      error: null,
    };
  } catch {
    return {
      cases: [] as VerificationCase[],
      error: "Unable to load verification review cases.",
    };
  }
}
