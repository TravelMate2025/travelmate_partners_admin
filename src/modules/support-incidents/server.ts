import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";
import type { SupportIncidentRecord } from "@/modules/support-incidents/types";

type AppealRecord = {
  id: string;
  listingKind: "stay" | "transfer";
  listingId: string;
  partnerId: string;
  message: string;
  status: "pending" | "under_review" | "resolved";
  resolution: "reinstated" | "dismissed" | null;
  resolutionNote: string;
  createdAt: string;
  updatedAt: string;
};

type AppealDetail = AppealRecord & {
  listingName?: string | null;
  partnerEmail?: string | null;
};

type AppealListEnvelope = {
  data?: { appeals?: AppealRecord[] };
  message?: string;
  error?: { message?: string };
};

type AppealDetailEnvelope = {
  data?: AppealDetail;
  message?: string;
  error?: { message?: string };
};

function mapAppealToSupportRecord(appeal: AppealRecord, detail?: AppealDetail): SupportIncidentRecord {
  const listingName = detail?.listingName?.trim() || `${appeal.listingKind} ${appeal.listingId.slice(0, 8)}`;
  const partnerName = detail?.partnerEmail?.trim() || `Partner ${appeal.partnerId.slice(0, 8)}`;
  const isResolved = appeal.status === "resolved";
  return {
    id: `appeal-${appeal.id}`,
    title: `${appeal.listingKind === "stay" ? "Stay" : "Transfer"} appeal · ${listingName}`,
    summary: appeal.message,
    partnerName,
    partnerId: appeal.partnerId,
    partnerEmail: detail?.partnerEmail ?? undefined,
    owner: "Operations",
    queue: "trust_ops",
    severity: "high",
    status: isResolved ? "resolved" : "open",
    incidentState: isResolved ? "mitigated" : "active",
    issueType: "policy_concern",
    channel: "in_app",
    region: "Global",
    responseDeadline: appeal.updatedAt,
    lastUpdatedAt: appeal.updatedAt,
    openedAt: appeal.createdAt,
    escalationTeam: "operations",
    operationalNote: appeal.resolutionNote || "",
    linkedContext: [
      {
        id: `appeal-listing-${appeal.id}`,
        label: `${appeal.listingKind === "stay" ? "Stay" : "Transfer"} listing`,
        href: appeal.listingKind === "stay" ? `/moderation?kind=stay&q=${appeal.listingId}` : `/moderation?kind=transfer&q=${appeal.listingId}`,
        statusLabel: appeal.status,
        kind: "listing",
      },
    ],
    diagnostics: [],
    activity: [],
    appealId: appeal.id,
    appealListingKind: appeal.listingKind,
    appealListingId: appeal.listingId,
  };
}

export async function getListingAppealSupportCasesFromApi(): Promise<{ records: SupportIncidentRecord[]; error: string | null }> {
  const session = await getStoredAdminSession();
  if (!session) {
    return { records: [], error: "Admin session is not available for listing appeals." };
  }

  try {
    const response = await fetch(`${getAdminApiBaseUrl()}/admin/listing-appeals?status=pending`, {
      method: "GET",
      headers: {
        Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
      },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as AppealListEnvelope | null;
    const appeals = body?.data?.appeals;
    if (!response.ok || !appeals) {
      return {
        records: [],
        error: body?.message ?? body?.error?.message ?? "Unable to load listing appeals.",
      };
    }

    const records: SupportIncidentRecord[] = [];
    for (const appeal of appeals) {
      const detailResponse = await fetch(`${getAdminApiBaseUrl()}/admin/listing-appeals/${encodeURIComponent(appeal.id)}`, {
        method: "GET",
        headers: {
          Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
        },
        cache: "no-store",
      });
      const detailBody = (await detailResponse.json().catch(() => null)) as AppealDetailEnvelope | null;
      records.push(mapAppealToSupportRecord(appeal, detailBody?.data));
    }

    return { records: sortNewestFirst(records), error: null };
  } catch {
    return { records: [], error: "Unable to load listing appeals." };
  }
}

type SupportEnvelope = {
  data?: { records?: SupportIncidentRecord[] };
  message?: string;
  error?: { message?: string };
};

function sortNewestFirst(records: SupportIncidentRecord[]) {
  return [...records].sort(
    (a, b) =>
      Math.max(new Date(b.lastUpdatedAt).getTime(), new Date(b.openedAt).getTime())
      - Math.max(new Date(a.lastUpdatedAt).getTime(), new Date(a.openedAt).getTime()),
  );
}

export async function getSupportIncidentsFromApi(): Promise<{ records: SupportIncidentRecord[]; error: string | null }> {
  const session = await getStoredAdminSession();
  if (!session) {
    return { records: [], error: "Admin session is not available for support incidents." };
  }
  try {
    const response = await fetch(`${getAdminApiBaseUrl()}/admin/support-incidents`, {
      method: "GET",
      headers: {
        Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
      },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as SupportEnvelope | null;
    if (!response.ok || !body?.data?.records) {
      return {
        records: [],
        error: body?.message ?? body?.error?.message ?? "Unable to load support incidents.",
      };
    }
    return { records: sortNewestFirst(body.data.records), error: null };
  } catch {
    return { records: [], error: "Unable to load support incidents." };
  }
}
