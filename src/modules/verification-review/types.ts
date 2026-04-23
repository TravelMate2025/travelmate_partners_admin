export type VerificationStatus = "pending" | "in_review" | "approved" | "rejected";
export type PartnerLifecycleState = "pending" | "verified" | "rejected" | "suspended";
export type ReviewRiskLevel = "low" | "medium" | "high";
export type VerificationDecisionAction = "approve" | "reject" | "request_more_info" | "suspend";

export type VerificationDocument = {
  id: string;
  label: string;
  fileName: string;
  documentType: "identity" | "business" | "address" | "compliance" | "banking" | "permit";
  mimeType: string;
  sizeLabel: string;
  pageCount: number;
  uploadedAt: string;
  source: "partner_portal" | "resubmission";
  securePath: string;
  previewSummary: string;
  reviewerHint: string;
  status: "received" | "flagged" | "resubmitted";
};

export type VerificationHistoryEntry = {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  note: string;
};

export type VerificationAuditRecord = {
  eventId: string;
  actor: string;
  caseId: string;
  action: VerificationDecisionAction;
  summary: string;
  status: "recorded" | "queued_for_backend";
};

export type VerificationPartnerNotification = {
  partnerName: string;
  caseId: string;
  channel: "email" | "in_app";
  template: "verification_approved" | "verification_rejected" | "verification_more_info" | "lifecycle_suspended";
  deliveryStatus: "prepared" | "queued_for_backend";
  summary: string;
};

export type VerificationDecisionPayload = {
  caseId: string;
  action: VerificationDecisionAction;
  note: string;
  actor: string;
};

export type VerificationDecisionResult = {
  cases: VerificationCase[];
  auditRecord: VerificationAuditRecord;
  partnerNotification: VerificationPartnerNotification;
};

export type VerificationCaseReviewSignals = {
  flaggedDocumentCount: number;
  needsMoreInfo: boolean;
  latestActionLabel: string;
};

export type VerificationCase = {
  id: string;
  partnerName: string;
  businessName: string;
  submittedAt: string;
  country: string;
  riskLevel: ReviewRiskLevel;
  verificationStatus: VerificationStatus;
  lifecycleState: PartnerLifecycleState;
  noteDraft: string;
  notificationSummary: string;
  documents: VerificationDocument[];
  history: VerificationHistoryEntry[];
  reviewSignals: VerificationCaseReviewSignals;
  latestAuditRecord?: VerificationAuditRecord;
  latestPartnerNotification?: VerificationPartnerNotification;
};
