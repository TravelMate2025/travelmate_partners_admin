import { render, screen } from "@testing-library/react";

import { ReviewModerationWorkspace } from "@/modules/review-moderation/workspace";
import type { AdminReviewRecord } from "@/modules/review-moderation/types";

function makeRecord(overrides: Partial<AdminReviewRecord> = {}): AdminReviewRecord {
  return {
    reviewId: "rv_test_001",
    bookingReference: "BKR-TEST-001",
    listingKind: "stay",
    listingId: "listing-001",
    listingName: "Test Stay",
    listingLocation: "Lagos",
    applicationId: "app-001",
    partnerEmail: "partner@example.com",
    overallRating: 4,
    subcategoryRatings: { cleanliness: 4 },
    comment: "Nice stay.",
    status: "pending_moderation",
    rejectionReason: null,
    submittedAt: "2026-01-01T00:00:00Z",
    publishedAt: null,
    ...overrides,
  };
}

describe("ReviewModerationWorkspace role gating", () => {
  it("hides publish/reject actions and shows a view-only note for the reviewer role", () => {
    render(<ReviewModerationWorkspace initialRecords={[makeRecord()]} role="reviewer" />);

    expect(screen.queryByRole("button", { name: /Publish review/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reject" })).not.toBeInTheDocument();
    expect(screen.getByText(/view-only access to review moderation/i)).toBeInTheDocument();
  });

  it("shows publish/reject actions for the operations role", () => {
    render(<ReviewModerationWorkspace initialRecords={[makeRecord()]} role="operations" />);

    expect(screen.getByRole("button", { name: /Publish review/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
  });

  it("shows publish/reject actions for the super_admin role", () => {
    render(<ReviewModerationWorkspace initialRecords={[makeRecord()]} role="super_admin" />);

    expect(screen.getByRole("button", { name: /Publish review/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
  });
});
