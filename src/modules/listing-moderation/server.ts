import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";
import type { ModerationListingRecord } from "@/modules/listing-moderation/types";

type Envelope<T> = {
  data?: T;
  message?: string;
  error?: { message?: string };
};

type ModerationPage = {
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
  results: ModerationListingRecord[];
};

function sortNewestFirst(records: ModerationListingRecord[]) {
  return [...records].sort(
    (a, b) =>
      Math.max(
        new Date(b.submittedAt).getTime(),
        new Date(b.lastReviewedAt).getTime(),
      )
      - Math.max(
        new Date(a.submittedAt).getTime(),
        new Date(a.lastReviewedAt).getTime(),
      ),
  );
}

export async function getModerationListingsFromApi(): Promise<{
  records: ModerationListingRecord[];
  error: string | null;
}> {
  const session = await getStoredAdminSession();
  if (!session) {
    return { records: [], error: "Admin session is not available for moderation review." };
  }

  try {
    const response = await fetch(
      `${getAdminApiBaseUrl()}/admin/moderation/listings?status=all&kind=all&page=1&pageSize=100`,
      {
        method: "GET",
        headers: {
          Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
        },
        cache: "no-store",
      },
    );

    const body = (await response.json().catch(() => null)) as Envelope<ModerationPage> | null;
    if (!response.ok || !body?.data) {
      return {
        records: [],
        error: body?.message ?? body?.error?.message ?? "Unable to load moderation queue.",
      };
    }

    return { records: sortNewestFirst(body.data.results ?? []), error: null };
  } catch {
    return { records: [], error: "Unable to load moderation queue." };
  }
}
