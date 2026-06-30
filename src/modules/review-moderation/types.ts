export type ReviewStatus = "pending_moderation" | "published" | "rejected";
export type ReviewListingKind = "stay" | "transfer";
export type ReviewDecisionAction = "publish" | "reject";

export type AdminReviewRecord = {
  reviewId: string;
  bookingReference: string;
  listingKind: ReviewListingKind;
  listingId: string;
  listingName: string;
  listingLocation: string;
  applicationId: string;
  partnerEmail: string;
  overallRating: number;
  subcategoryRatings: Record<string, number>;
  comment: string;
  status: ReviewStatus;
  rejectionReason: string | null;
  submittedAt: string;
  publishedAt: string | null;
};

export type ReviewQueueFilterState = {
  query: string;
  status: ReviewStatus | "all";
  kind: ReviewListingKind | "all";
};

export type ReviewDecisionPayload =
  | { action: "publish" }
  | { action: "reject"; reason: string };
