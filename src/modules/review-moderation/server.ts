import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";
import type { AdminReviewRecord } from "@/modules/review-moderation/types";

type Envelope<T> = {
  data?: T;
  message?: string;
  error?: { message?: string };
};

type ReviewPage = {
  page: number;
  pageSize: number;
  total: number;
  results: AdminReviewRecord[];
};

export async function getAdminReviewsFromApi(): Promise<{
  records: AdminReviewRecord[];
  error: string | null;
}> {
  const session = await getStoredAdminSession();
  if (!session) {
    return { records: [], error: "Admin session is not available for review moderation." };
  }

  try {
    const response = await fetch(
      `${getAdminApiBaseUrl()}/admin/reviews?status=all&page=1&pageSize=100`,
      {
        method: "GET",
        headers: {
          Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
        },
        cache: "no-store",
      },
    );

    const body = (await response.json().catch(() => null)) as Envelope<ReviewPage> | null;
    if (!response.ok || !body?.data) {
      return {
        records: [],
        error: body?.message ?? body?.error?.message ?? "Unable to load review queue.",
      };
    }

    return { records: body.data.results ?? [], error: null };
  } catch {
    return { records: [], error: "Unable to load review queue." };
  }
}
