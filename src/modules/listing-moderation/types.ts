import type { AdminRole } from "@/modules/auth/types";

export type ListingLifecycleStatus =
  | "draft"
  | "pending"
  | "approved"
  | "live"
  | "paused"
  | "rejected"
  | "archived";

export type ModerationListingKind = "stay" | "transfer";
export type ModerationAction =
  | "approve"
  | "reject"
  | "send_back"
  | "flag"
  | "emergency_unpublish";
export type ModerationReasonCode =
  | "content_quality"
  | "missing_details"
  | "policy_violation"
  | "pricing_mismatch"
  | "duplicate_listing"
  | "safety_risk";

export type ModerationMediaAsset = {
  id: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  previewSummary: string;
  securePath: string;
  roomId?: string | null;
  spaceType?: string | null;
};

export type ModerationHistoryEntry = {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  note: string;
};

export type ModerationComplianceContext = {
  completenessScore: number;
  policyFlags: string[];
  duplicateWarnings: string[];
  geoSignals: string[];
  requiredFixes: string[];
  manualFlag: boolean;
};

export type ModerationAuditRecord = {
  eventId: string;
  actor: string;
  listingId: string;
  action: ModerationAction;
  summary: string;
  status: "recorded" | "queued_for_backend";
};

export type ModerationPartnerNotification = {
  listingId: string;
  listingTitle: string;
  channel: "email" | "in_app";
  template:
    | "listing_approved"
    | "listing_rejected"
    | "listing_correction_requested"
    | "listing_flagged"
    | "listing_emergency_unpublished";
  deliveryStatus: "prepared" | "queued_for_backend";
  summary: string;
};

export type ModerationReviewSignals = {
  priorityLabel: string;
  pendingAgeLabel: string;
  queueLabel: string;
};

export type ModerationListingRecord = {
  id: string;
  kind: ModerationListingKind;
  partnerName: string;
  businessName: string;
  partnerUserId: string;
  title: string;
  locationLabel: string;
  status: ListingLifecycleStatus;
  submittedAt: string;
  lastReviewedAt: string;
  summary: string;
  moderationFeedback?: string;
  escalationNote?: string;
  media: ModerationMediaAsset[];
  compliance: ModerationComplianceContext;
  history: ModerationHistoryEntry[];
  reviewSignals: ModerationReviewSignals;
  latestAuditRecord?: ModerationAuditRecord;
  latestPartnerNotification?: ModerationPartnerNotification;
};

export type ModerationFilterState = {
  query: string;
  kind: ModerationListingKind | "all";
  status: ListingLifecycleStatus | "all";
};

export type ModerationActionPayload = {
  actor: string;
  listingIds: string[];
  action: ModerationAction;
  reasonCode: ModerationReasonCode;
  note: string;
};

export type ModerationActionResult = {
  records: ModerationListingRecord[];
  updatedIds: string[];
  auditRecord: ModerationAuditRecord;
  partnerNotifications: ModerationPartnerNotification[];
};

export type ListingModerationPolicy = {
  role: AdminRole;
  canApprove: boolean;
  canReject: boolean;
  canSendBack: boolean;
  canFlag: boolean;
  canEmergencyUnpublish: boolean;
  canBulkUpdate: boolean;
  summary: string;
};
