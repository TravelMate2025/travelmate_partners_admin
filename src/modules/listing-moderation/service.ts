import { canApplyModerationAction } from "@/modules/listing-moderation/policy";
import type {
  ModerationAction,
  ModerationActionPayload,
  ModerationActionResult,
  ModerationListingRecord,
} from "@/modules/listing-moderation/types";
import type { AdminRole } from "@/modules/auth/types";

function buildHistoryAction(action: ModerationAction) {
  switch (action) {
    case "approve":
      return "Listing approved";
    case "reject":
      return "Listing rejected";
    case "send_back":
      return "Sent back for edits";
    case "flag":
      return "Listing flagged";
    case "emergency_unpublish":
      return "Emergency unpublish applied";
  }
}

function buildNotificationTemplate(action: ModerationAction) {
  switch (action) {
    case "approve":
      return "listing_approved" as const;
    case "reject":
      return "listing_rejected" as const;
    case "send_back":
      return "listing_correction_requested" as const;
    case "flag":
      return "listing_flagged" as const;
    case "emergency_unpublish":
      return "listing_emergency_unpublished" as const;
  }
}

function buildStatus(action: ModerationAction, currentStatus: ModerationListingRecord["status"]) {
  switch (action) {
    case "approve":
      return "approved" as const;
    case "reject":
      return "rejected" as const;
    case "send_back":
      return "rejected" as const;
    case "flag":
      return currentStatus;
    case "emergency_unpublish":
      return "paused" as const;
  }
}

function buildFeedback(action: ModerationAction, note: string, title: string) {
  const trimmed = note.trim();

  if (trimmed.length > 0) {
    return trimmed;
  }

  switch (action) {
    case "approve":
      return `${title} was approved and is ready for partner-side publication.`;
    case "reject":
      return `${title} was rejected and remains blocked until the partner resubmits.`;
    case "send_back":
      return `${title} was sent back for edits and partner correction.`;
    case "flag":
      return `${title} was flagged for additional compliance review.`;
    case "emergency_unpublish":
      return `${title} was emergency-unpublished pending risk review.`;
  }
}

function applyActionToRecord(
  record: ModerationListingRecord,
  payload: ModerationActionPayload,
  action: ModerationAction,
) {
  const timestamp = new Date().toISOString();
  const nextStatus = buildStatus(action, record.status);
  const feedback = buildFeedback(action, payload.note, record.title);

  return {
    ...record,
    status: nextStatus,
    moderationFeedback: feedback,
    lastReviewedAt: timestamp,
    compliance: {
      ...record.compliance,
      manualFlag: action === "flag" ? true : record.compliance.manualFlag,
      requiredFixes:
        action === "send_back" || action === "reject"
          ? [feedback, ...record.compliance.requiredFixes.filter((item) => item !== feedback)]
          : record.compliance.requiredFixes,
    },
    reviewSignals: {
      ...record.reviewSignals,
      queueLabel:
        action === "emergency_unpublish"
          ? "Emergency takedown review"
          : action === "flag"
            ? "Flagged for follow-up"
            : action === "approve"
              ? "Approved moderation outcome"
              : "Correction loop active",
      priorityLabel:
        action === "emergency_unpublish"
          ? "Emergency takedown"
          : action === "flag"
            ? "Flagged"
            : record.reviewSignals.priorityLabel,
      pendingAgeLabel: "Updated just now",
    },
    history: [
      {
        id: `moderation-history-${record.id}-${action}-${Date.now()}`,
        actor: payload.actor,
        action: buildHistoryAction(action),
        timestamp: new Date(timestamp).toLocaleString("en-GB", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "UTC",
        }).replace(",", " UTC"),
        note: feedback,
      },
      ...record.history,
    ],
  };
}

export type ListingModerationRepository = {
  applyAction(
    records: ModerationListingRecord[],
    payload: ModerationActionPayload,
    role: AdminRole,
  ): Promise<ModerationActionResult>;
};

export const mockListingModerationRepository: ListingModerationRepository = {
  async applyAction(records, payload, role) {
    if (payload.listingIds.length === 0) {
      throw new Error("Select at least one listing before applying a moderation action.");
    }

    const targets = records.filter((record) => payload.listingIds.includes(record.id));
    if (targets.length !== payload.listingIds.length) {
      throw new Error("One or more selected listings were not found.");
    }

    for (const record of targets) {
      if (!canApplyModerationAction(role, record, payload.action)) {
        throw new Error(`Action ${payload.action} is not allowed for listing ${record.id}.`);
      }
    }

    const auditRecord = {
      eventId: `moderation-audit-${payload.action}-${Date.now()}`,
      actor: payload.actor,
      listingId: targets[0].id,
      action: payload.action,
      summary: `${payload.actor} executed ${payload.action} for ${targets.length} listing${targets.length > 1 ? "s" : ""}.`,
      status: "queued_for_backend" as const,
    };

    const nextRecords = records.map((record) => {
      if (!payload.listingIds.includes(record.id)) {
        return record;
      }

      const updated = applyActionToRecord(record, payload, payload.action);
      return {
        ...updated,
        latestAuditRecord: auditRecord,
        latestPartnerNotification: {
          listingId: record.id,
          listingTitle: record.title,
          channel: "email" as const,
          template: buildNotificationTemplate(payload.action),
          deliveryStatus: "queued_for_backend" as const,
          summary: updated.moderationFeedback ?? "",
        },
      };
    });

    return {
      records: nextRecords,
      updatedIds: payload.listingIds,
      auditRecord,
      partnerNotifications: nextRecords
        .filter((record) => payload.listingIds.includes(record.id))
        .map((record) => record.latestPartnerNotification!)
        .filter(Boolean),
    };
  },
};
