"use client";

import type { AdminReviewRecord, ReviewListingKind, ReviewQueueFilterState, ReviewStatus } from "@/modules/review-moderation/types";

const STATUS_LABELS: Record<ReviewStatus | "all", string> = {
  all: "All statuses",
  pending_moderation: "Pending",
  published: "Published",
  rejected: "Rejected",
};

const KIND_LABELS: Record<ReviewListingKind | "all", string> = {
  all: "All types",
  stay: "Stay",
  transfer: "Transfer",
};

function starLabel(rating: number) {
  return `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`;
}

export function ReviewQueuePanel({
  records,
  filters,
  selectedId,
  onSelect,
  onFilterChange,
}: {
  records: AdminReviewRecord[];
  filters: ReviewQueueFilterState;
  selectedId: string;
  onSelect: (reviewId: string) => void;
  onFilterChange: (filters: ReviewQueueFilterState) => void;
}) {
  return (
    <div className="tm-panel flex flex-col overflow-hidden">
      <div className="border-b border-slate-100 p-4">
        <p className="tm-kicker mb-3">Review Queue</p>
        <input
          className="tm-input w-full text-sm"
          onChange={(e) => onFilterChange({ ...filters, query: e.target.value })}
          placeholder="Search by partner, listing ID, or booking ref…"
          type="text"
          value={filters.query}
        />
        <div className="mt-2 flex gap-2">
          <select
            className="tm-input flex-1 text-sm"
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value as ReviewStatus | "all" })}
            value={filters.status}
          >
            {(Object.keys(STATUS_LABELS) as (ReviewStatus | "all")[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            className="tm-input flex-1 text-sm"
            onChange={(e) => onFilterChange({ ...filters, kind: e.target.value as ReviewListingKind | "all" })}
            value={filters.kind}
          >
            {(Object.keys(KIND_LABELS) as (ReviewListingKind | "all")[]).map((k) => (
              <option key={k} value={k}>
                {KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto">
        {records.length === 0 && (
          <li className="p-6 text-center text-sm text-slate-400">No reviews match the current filters.</li>
        )}
        {records.map((record) => (
          <li key={record.reviewId}>
            <button
              className={`w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 ${selectedId === record.reviewId ? "bg-slate-50 ring-inset ring-1 ring-[#033D89]" : ""}`}
              onClick={() => onSelect(record.reviewId)}
              type="button"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-medium text-slate-700">{record.bookingReference}</span>
                <span className={`tm-status-badge ${
                  record.status === "published" ? "tm-badge-success"
                  : record.status === "rejected" ? "tm-badge-danger"
                  : "tm-badge-warning"
                }`}>
                  {record.status === "pending_moderation" ? "Pending" : record.status}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-xs text-amber-500">{starLabel(record.overallRating)}</span>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 capitalize">
                  {record.listingKind}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-slate-400">{record.partnerEmail}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
