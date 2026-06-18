import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";

import type { LocalitySuggestionRecord } from "@/modules/locality-suggestions/types";

type Envelope<T> = {
  data?: T;
  message?: string;
  error?: { message?: string };
};

function sortNewestFirst(records: LocalitySuggestionRecord[]) {
  return [...records].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export async function getLocalitySuggestionsFromApi(): Promise<{
  records: LocalitySuggestionRecord[];
  error: string | null;
}> {
  const session = await getStoredAdminSession();
  if (!session) {
    return { records: [], error: "Admin session is not available for locality review." };
  }

  try {
    const response = await fetch(`${getAdminApiBaseUrl()}/admin/locality-suggestions?status=pending`, {
      method: "GET",
      headers: {
        Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
      },
      cache: "no-store",
    });

    const body = (await response.json().catch(() => null)) as Envelope<LocalitySuggestionRecord[]> | null;
    if (!response.ok || !body?.data) {
      return {
        records: [],
        error: body?.message ?? body?.error?.message ?? "Unable to load locality suggestions.",
      };
    }

    return { records: sortNewestFirst(body.data), error: null };
  } catch {
    return { records: [], error: "Unable to load locality suggestions." };
  }
}
