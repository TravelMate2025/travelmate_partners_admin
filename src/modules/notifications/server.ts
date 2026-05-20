import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";
import type { NotificationRecord } from "@/modules/notifications/types";

type Envelope<T> = { data?: T; message?: string; error?: { message?: string } };

function sortNewestFirst(records: NotificationRecord[]) {
  return [...records].sort(
    (a, b) =>
      new Date(b.deliveryMetadata?.sentAt ?? b.createdAt).getTime()
      - new Date(a.deliveryMetadata?.sentAt ?? a.createdAt).getTime(),
  );
}

export async function getNotificationsFromApi(): Promise<{ records: NotificationRecord[]; error: string | null }> {
  const session = await getStoredAdminSession();
  if (!session) {
    return { records: [], error: "Admin session is not available for notifications." };
  }

  try {
    const response = await fetch(`${getAdminApiBaseUrl()}/admin/notifications`, {
      method: "GET",
      headers: {
        Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
      },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as Envelope<NotificationRecord[]> | null;
    if (!response.ok || !body?.data) {
      return {
        records: [],
        error: body?.message ?? body?.error?.message ?? "Unable to load notifications.",
      };
    }
    return { records: sortNewestFirst(body.data), error: null };
  } catch {
    return { records: [], error: "Unable to load notifications." };
  }
}
