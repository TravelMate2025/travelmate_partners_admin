"use client";

import { useState } from "react";

import type { AdminReviewRecord, ReviewDecisionAction } from "@/modules/review-moderation/types";

const STAY_SUBCATEGORY_LABELS: Record<string, string> = {
  cleanliness: "Cleanliness",
  accuracy: "Accuracy",
  checkin: "Check-in",
  communication: "Communication",
  location: "Location",
  value: "Value",
};

const TRANSFER_SUBCATEGORY_LABELS: Record<string, string> = {
  punctuality: "Punctuality",
  vehicle_condition: "Vehicle condition",
  professionalism: "Professionalism",
  safety: "Safety",
};

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400">
      {"★".repeat(rating)}
      <span className="text-slate-200">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ReviewDetailPanel({
  record,
  pending,
  feedback,
  onAction,
  canModerate,
}: {
  record: AdminReviewRecord | null;
  pending: ReviewDecisionAction | null;
  feedback: { tone: "success" | "error"; message: string } | null;
  onAction: (action: ReviewDecisionAction, reason?: string) => void;
  canModerate: boolean;
}) {
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!record) {
    return (
      <div className="tm-panel flex items-center justify-center p-10">
        <p className="text-sm text-slate-400">Select a review from the queue to inspect it.</p>
      </div>
    );
  }

  const subcategoryLabels =
    record.listingKind === "stay" ? STAY_SUBCATEGORY_LABELS : TRANSFER_SUBCATEGORY_LABELS;
  const isPending = record.status === "pending_moderation";
  const isActing = pending !== null;

  function handlePublish() {
    setShowRejectForm(false);
    onAction("publish");
  }

  function handleRejectSubmit() {
    if (!rejectReason.trim()) return;
    onAction("reject", rejectReason.trim());
    setShowRejectForm(false);
    setRejectReason("");
  }

  return (
    <div className="tm-panel flex flex-col gap-0 overflow-hidden">
      <div className="border-b border-slate-100 p-5">
        <p className="tm-kicker mb-1">Review Detail</p>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-950">{record.bookingReference}</h2>
          <span className={`tm-status-badge ${
            record.status === "published" ? "tm-badge-success"
            : record.status === "rejected" ? "tm-badge-danger"
            : "tm-badge-warning"
          }`}>
            {record.status === "pending_moderation" ? "Pending moderation" : record.status}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 capitalize">
            {record.listingKind}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">{record.partnerEmail}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid gap-5">
          <section className="grid gap-3">
            <div className="flex items-center gap-3">
              <p className="text-3xl font-bold text-slate-950">{record.overallRating}</p>
              <div>
                <StarRow rating={record.overallRating} />
                <p className="text-xs text-slate-400 mt-0.5">Overall rating</p>
              </div>
            </div>

            {Object.keys(record.subcategoryRatings).length > 0 && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                {Object.entries(record.subcategoryRatings).map(([key, val]) => (
                  <div key={key}>
                    <p className="text-xs text-slate-400">{subcategoryLabels[key] ?? key}</p>
                    <div className="flex items-center gap-1.5">
                      <StarRow rating={val} />
                      <span className="text-xs text-slate-600">{val}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {record.comment && (
            <section>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Guest comment</p>
              <blockquote className="rounded-md border-l-4 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 italic">
                "{record.comment}"
              </blockquote>
            </section>
          )}

          <section className="grid gap-1.5 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Listing</p>
            <div className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
              {record.listingName && (
                <>
                  <span className="text-slate-400">Name</span>
                  <span className="font-medium text-slate-700">{record.listingName}</span>
                </>
              )}
              {record.listingLocation && (
                <>
                  <span className="text-slate-400">{record.listingKind === "transfer" ? "Route" : "Location"}</span>
                  <span className="text-slate-600">{record.listingLocation}</span>
                </>
              )}
              <span className="text-slate-400">Listing ID</span>
              <span className="font-mono text-xs text-slate-500">{record.listingId}</span>
            </div>
          </section>

          <section className="grid gap-1.5 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Booking</p>
            <div className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
              <span className="text-slate-400">Reference</span>
              <span className="font-mono text-xs text-slate-600">{record.bookingReference}</span>
              <span className="text-slate-400">Partner</span>
              <span className="text-slate-600">{record.partnerEmail}</span>
              <span className="text-slate-400">Submitted</span>
              <span className="text-slate-600">{formatDate(record.submittedAt)}</span>
              {record.publishedAt && (
                <>
                  <span className="text-slate-400">Published</span>
                  <span className="text-slate-600">{formatDate(record.publishedAt)}</span>
                </>
              )}
              {record.rejectionReason && (
                <>
                  <span className="text-slate-400">Rejection reason</span>
                  <span className="text-slate-600">{record.rejectionReason}</span>
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      {feedback && (
        <div className={`border-t px-5 py-3 text-sm ${feedback.tone === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-red-100 bg-red-50 text-red-700"}`}>
          {feedback.message}
        </div>
      )}

      {isPending && !canModerate && (
        <div className="border-t border-slate-100 p-5">
          <p className="text-sm text-slate-500">
            Your role has view-only access to review moderation. Publishing and rejecting reviews requires the
            operations or super admin role.
          </p>
        </div>
      )}

      {isPending && canModerate && (
        <div className="border-t border-slate-100 p-5">
          {showRejectForm ? (
            <div className="grid gap-3">
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-slate-600">Rejection reason (required)</span>
                <textarea
                  className="tm-input min-h-[80px] resize-none text-sm"
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this review is being rejected…"
                  value={rejectReason}
                />
              </label>
              <div className="flex gap-2">
                <button
                  className="tm-btn tm-btn-danger flex-1"
                  disabled={isActing || !rejectReason.trim()}
                  onClick={handleRejectSubmit}
                  type="button"
                >
                  {pending === "reject" ? "Rejecting…" : "Confirm rejection"}
                </button>
                <button
                  className="tm-btn tm-btn-outline"
                  disabled={isActing}
                  onClick={() => { setShowRejectForm(false); setRejectReason(""); }}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                className="tm-btn flex-1"
                disabled={isActing}
                onClick={handlePublish}
                type="button"
              >
                {pending === "publish" ? "Publishing…" : "Publish review"}
              </button>
              <button
                className="tm-btn tm-btn-outline text-red-600 hover:bg-red-50"
                disabled={isActing}
                onClick={() => setShowRejectForm(true)}
                type="button"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
