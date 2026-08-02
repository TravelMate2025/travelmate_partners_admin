"use client";

import { useMemo, useState } from "react";

import { SurfaceState } from "@/components/common/surface-state";
import type { AdminRole } from "@/modules/auth/types";
import { ReviewDetailPanel } from "@/modules/review-moderation/detail-panel";
import { ReviewQueuePanel } from "@/modules/review-moderation/queue-panel";
import { applyReviewDecision, fetchReviewQueue } from "@/modules/review-moderation/service";
import type {
  AdminReviewRecord,
  ReviewDecisionAction,
  ReviewListingKind,
  ReviewQueueFilterState,
  ReviewStatus,
} from "@/modules/review-moderation/types";

const REVIEW_MODERATOR_ROLES: AdminRole[] = ["super_admin", "operations"];

function matchesFilter(record: AdminReviewRecord, filters: ReviewQueueFilterState) {
  const query = filters.query.trim().toLowerCase();
  const matchesQuery =
    query.length === 0 ||
    record.bookingReference.toLowerCase().includes(query) ||
    record.partnerEmail.toLowerCase().includes(query) ||
    record.listingId.toLowerCase().includes(query) ||
    record.comment.toLowerCase().includes(query);

  const matchesStatus = filters.status === "all" || record.status === filters.status;
  const matchesKind = filters.kind === "all" || record.listingKind === filters.kind;

  return matchesQuery && matchesStatus && matchesKind;
}

export function ReviewModerationWorkspace({
  initialRecords,
  role,
}: {
  initialRecords: AdminReviewRecord[];
  role: AdminRole;
}) {
  const canModerate = REVIEW_MODERATOR_ROLES.includes(role);
  const [records, setRecords] = useState(initialRecords);
  const [filters, setFilters] = useState<ReviewQueueFilterState>({
    query: "",
    status: "pending_moderation",
    kind: "all",
  });
  const [selectedId, setSelectedId] = useState(
    initialRecords.find((r) => r.status === "pending_moderation")?.reviewId ?? initialRecords[0]?.reviewId ?? "",
  );
  const [pending, setPending] = useState<ReviewDecisionAction | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const filteredRecords = useMemo(() => records.filter((r) => matchesFilter(r, filters)), [records, filters]);
  const selectedRecord = useMemo(() => records.find((r) => r.reviewId === selectedId) ?? null, [records, selectedId]);

  function handleSelect(reviewId: string) {
    setSelectedId(reviewId);
    setFeedback(null);
  }

  function handleFilterChange(next: ReviewQueueFilterState) {
    setFilters(next);
    setFeedback(null);
  }

  async function handleAction(action: ReviewDecisionAction, reason?: string) {
    if (!selectedRecord || !canModerate) return;
    setPending(action);
    setFeedback(null);

    const payload =
      action === "reject"
        ? { action: "reject" as const, reason: reason ?? "" }
        : { action: "publish" as const };

    const result = await applyReviewDecision(selectedRecord.reviewId, payload);

    if (!result.ok) {
      setFeedback({ tone: "error", message: result.message });
      setPending(null);
      return;
    }

    const nextStatus: ReviewStatus = action === "publish" ? "published" : "rejected";
    const updatedRecords = records.map((r) =>
      r.reviewId === selectedRecord.reviewId
        ? {
            ...r,
            status: nextStatus,
            rejectionReason: action === "reject" ? (reason ?? "") : r.rejectionReason,
            publishedAt: action === "publish" ? new Date().toISOString() : r.publishedAt,
          }
        : r,
    );
    setRecords(updatedRecords);
    setFeedback({ tone: "success", message: result.message });
    setPending(null);

    const nextPending = updatedRecords.find(
      (r) => r.status === "pending_moderation" && r.reviewId !== selectedRecord.reviewId,
    );
    if (nextPending) {
      setSelectedId(nextPending.reviewId);
    }
  }

  async function handleRefresh() {
    setFeedback(null);
    const { records: fresh } = await fetchReviewQueue({ status: "all" });
    if (fresh.length > 0) {
      setRecords(fresh);
    }
  }

  if (records.length === 0) {
    return (
      <section className="grid gap-5">
        <article className="tm-panel">
          <SurfaceState
            description="Submitted guest reviews will appear here once API clients start posting reviews for completed bookings."
            title="No reviews yet"
            tone="empty"
          />
        </article>
      </section>
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <ReviewQueuePanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onSelect={handleSelect}
        records={filteredRecords}
        selectedId={selectedId}
      />
      <ReviewDetailPanel
        canModerate={canModerate}
        feedback={feedback}
        onAction={(action, reason) => void handleAction(action, reason)}
        pending={pending}
        record={selectedRecord}
      />
    </section>
  );
}
