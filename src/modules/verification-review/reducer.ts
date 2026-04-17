import type {
  VerificationCase,
  VerificationDecisionAction,
  VerificationDecisionPayload,
} from "@/modules/verification-review/types";

function buildHistoryEntry(payload: VerificationDecisionPayload) {
  const labelMap: Record<VerificationDecisionAction, string> = {
    approve: "Verification approved",
    reject: "Verification rejected",
    request_more_info: "More information requested",
    suspend: "Lifecycle suspended",
  };

  return {
    id: `hist-${payload.caseId}-${payload.action}-${Date.now()}`,
    actor: payload.actor,
    action: labelMap[payload.action],
    timestamp: "Just now",
    note: payload.note,
  };
}

export function isVerificationDecisionAllowed(item: VerificationCase, action: VerificationDecisionAction) {
  if (action === "approve" || action === "reject") {
    return ["pending", "in_review"].includes(item.verificationStatus);
  }

  if (action === "request_more_info") {
    return ["pending", "in_review", "rejected"].includes(item.verificationStatus);
  }

  if (action === "suspend") {
    return item.lifecycleState === "verified" || item.verificationStatus === "approved";
  }

  return false;
}

export function applyVerificationDecision(cases: VerificationCase[], payload: VerificationDecisionPayload): VerificationCase[] {
  return cases.map((item) => {
    if (item.id !== payload.caseId) {
      return item;
    }

    if (payload.action === "approve") {
      if (!isVerificationDecisionAllowed(item, payload.action)) {
        return item;
      }

      const updated: VerificationCase = {
        ...item,
        verificationStatus: "approved",
        lifecycleState: "verified",
        noteDraft: "",
        notificationSummary: "Partner is notified of approval and partner lifecycle advances to verified.",
        reviewSignals: {
          flaggedDocumentCount: item.documents.filter((document) => document.status === "flagged").length,
          needsMoreInfo: false,
          latestActionLabel: "Verification approved",
        },
        history: [buildHistoryEntry(payload), ...item.history],
      };
      return updated;
    }

    if (payload.action === "reject") {
      if (!isVerificationDecisionAllowed(item, payload.action)) {
        return item;
      }

      const updated: VerificationCase = {
        ...item,
        verificationStatus: "rejected",
        lifecycleState: "rejected",
        noteDraft: "",
        notificationSummary: "Partner is notified of rejection and receives the review note for resubmission guidance.",
        reviewSignals: {
          flaggedDocumentCount: item.documents.filter((document) => document.status === "flagged").length,
          needsMoreInfo: true,
          latestActionLabel: "Verification rejected",
        },
        history: [buildHistoryEntry(payload), ...item.history],
      };
      return updated;
    }

    if (payload.action === "request_more_info") {
      if (!isVerificationDecisionAllowed(item, payload.action)) {
        return item;
      }

      const updated: VerificationCase = {
        ...item,
        verificationStatus: "in_review",
        lifecycleState: "pending",
        noteDraft: "",
        notificationSummary: "Partner remains pending and receives an additional-document request.",
        reviewSignals: {
          flaggedDocumentCount: item.documents.filter((document) => document.status === "flagged").length,
          needsMoreInfo: true,
          latestActionLabel: "More information requested",
        },
        history: [buildHistoryEntry(payload), ...item.history],
      };
      return updated;
    }

    if (payload.action === "suspend") {
      if (!isVerificationDecisionAllowed(item, payload.action)) {
        return item;
      }

      const updated: VerificationCase = {
        ...item,
        lifecycleState: "suspended",
        noteDraft: "",
        notificationSummary: "Partner access is suspended as an admin lifecycle action while verification history stays approved.",
        reviewSignals: {
          flaggedDocumentCount: item.documents.filter((document) => document.status === "flagged").length,
          needsMoreInfo: false,
          latestActionLabel: "Lifecycle suspended",
        },
        history: [buildHistoryEntry(payload), ...item.history],
      };
      return updated;
    }

    return item;
  });
}
