import type { AdminRole } from "@/modules/auth/types";
import type {
  ListingLifecycleStatus,
  ListingModerationPolicy,
  ModerationAction,
  ModerationListingRecord,
} from "@/modules/listing-moderation/types";

const actionByStatus: Record<ListingLifecycleStatus, ModerationAction[]> = {
  draft: ["flag"],
  pending: ["approve", "reject", "send_back", "flag"],
  approved: ["flag", "emergency_unpublish"],
  live: ["flag", "emergency_unpublish"],
  paused: ["flag"],
  rejected: ["flag"],
  archived: [],
};

export function getListingModerationPolicy(role: AdminRole): ListingModerationPolicy {
  if (role === "super_admin") {
    return {
      role,
      canApprove: true,
      canReject: true,
      canSendBack: true,
      canFlag: true,
      canEmergencyUnpublish: true,
      canBulkUpdate: true,
      summary: "Full moderation access including emergency takedowns and bulk decisions.",
    };
  }

  if (role === "operations") {
    return {
      role,
      canApprove: true,
      canReject: true,
      canSendBack: true,
      canFlag: true,
      canEmergencyUnpublish: true,
      canBulkUpdate: true,
      summary: "Operational moderation access for queue review, corrections, and emergency takedowns.",
    };
  }

  if (role === "reviewer") {
    return {
      role,
      canApprove: true,
      canReject: true,
      canSendBack: true,
      canFlag: true,
      canEmergencyUnpublish: false,
      canBulkUpdate: true,
      summary: "Reviewer access for listing decisions and correction loops without emergency takedowns.",
    };
  }

  if (role === "support") {
    return {
      role,
      canApprove: false,
      canReject: false,
      canSendBack: false,
      canFlag: true,
      canEmergencyUnpublish: false,
      canBulkUpdate: false,
      summary: "Support can inspect moderation detail and raise flags for follow-up.",
    };
  }

  return {
    role,
    canApprove: false,
    canReject: false,
    canSendBack: false,
    canFlag: false,
    canEmergencyUnpublish: false,
    canBulkUpdate: false,
    summary: "Finance has read-only visibility for cross-functional context.",
  };
}

export function canApplyModerationAction(
  role: AdminRole,
  record: ModerationListingRecord,
  action: ModerationAction,
) {
  const policy = getListingModerationPolicy(role);

  const roleAllowed =
    (action === "approve" && policy.canApprove) ||
    (action === "reject" && policy.canReject) ||
    (action === "send_back" && policy.canSendBack) ||
    (action === "flag" && policy.canFlag) ||
    (action === "emergency_unpublish" && policy.canEmergencyUnpublish);

  return roleAllowed && actionByStatus[record.status].includes(action);
}

export function getAllowedBulkModerationActions(
  role: AdminRole,
  records: ModerationListingRecord[],
): Record<ModerationAction, boolean> {
  if (records.length === 0) {
    return {
      approve: false,
      reject: false,
      send_back: false,
      flag: false,
      emergency_unpublish: false,
    };
  }

  return {
    approve: records.every((record) => canApplyModerationAction(role, record, "approve")),
    reject: records.every((record) => canApplyModerationAction(role, record, "reject")),
    send_back: records.every((record) => canApplyModerationAction(role, record, "send_back")),
    flag: records.every((record) => canApplyModerationAction(role, record, "flag")),
    emergency_unpublish: records.every((record) => canApplyModerationAction(role, record, "emergency_unpublish")),
  };
}
