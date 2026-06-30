import type { AdminReviewRecord, ReviewDecisionPayload } from "@/modules/review-moderation/types";

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

export async function fetchReviewQueue(params: {
  status?: string;
  kind?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ records: AdminReviewRecord[]; error: string | null }> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.kind) qs.set("listing_kind", params.kind);
  qs.set("page", String(params.page ?? 1));
  qs.set("pageSize", String(params.pageSize ?? 100));

  const response = await fetch(`/api/backend/moderation/reviews?${qs.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as Envelope<ReviewPage> | null;
  if (!response.ok || !body?.data) {
    return {
      records: [],
      error: body?.message ?? body?.error?.message ?? "Unable to load review queue.",
    };
  }

  return { records: body.data.results ?? [], error: null };
}

export async function applyReviewDecision(
  reviewId: string,
  payload: ReviewDecisionPayload,
): Promise<{ ok: boolean; message: string }> {
  const response = await fetch(`/api/backend/moderation/reviews/${reviewId}/decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as Envelope<unknown> | null;
  if (!response.ok) {
    return {
      ok: false,
      message: body?.message ?? body?.error?.message ?? "Unable to apply review decision.",
    };
  }

  return {
    ok: true,
    message: payload.action === "publish" ? "Review published successfully." : "Review rejected.",
  };
}
