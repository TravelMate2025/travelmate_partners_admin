import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";
import type { PayoutReviewRecord } from "@/modules/payout-review/types";

type Envelope<T> = { data?: T; message?: string; error?: { message?: string } };

function sortNewestFirst(records: PayoutReviewRecord[]) {
  return [...records].sort(
    (a, b) =>
      Math.max(
        new Date(b.lastUpdatedAt).getTime(),
        new Date(b.verificationSubmittedAt).getTime(),
      )
      - Math.max(
        new Date(a.lastUpdatedAt).getTime(),
        new Date(a.verificationSubmittedAt).getTime(),
      ),
  );
}

export async function getPayoutReviewFromApi(): Promise<{
  records: PayoutReviewRecord[];
  error: string | null;
}> {
  const session = await getStoredAdminSession();
  if (!session) {
    return { records: [], error: "Admin session is not available for payout review." };
  }

  try {
    const response = await fetch(`${getAdminApiBaseUrl()}/admin/payout-review/cases`, {
      method: "GET",
      headers: {
        Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
      },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as Envelope<{ records: PayoutReviewRecord[] }> | null;
    if (!response.ok || !body?.data?.records) {
      return {
        records: [],
        error: body?.message ?? body?.error?.message ?? "Unable to load payout review queue.",
      };
    }
    return { records: sortNewestFirst(body.data.records), error: null };
  } catch {
    return { records: [], error: "Unable to load payout review queue." };
  }
}
