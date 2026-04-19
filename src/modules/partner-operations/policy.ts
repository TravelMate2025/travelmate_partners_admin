import type { AdminRole } from "@/modules/auth/types";
import type { PartnerPolicy, PartnerRecord, PartnerRoutePolicySummary } from "@/modules/partner-operations/types";

export function getPartnerPolicy(role: AdminRole): PartnerPolicy {
  if (role === "super_admin" || role === "operations") {
    return {
      canEditMetadata: true,
      canLock: true,
      canUnlock: true,
      canRestore: true,
    };
  }

  if (role === "support") {
    return {
      canEditMetadata: true,
      canLock: true,
      canUnlock: true,
      canRestore: false,
    };
  }

  return {
    canEditMetadata: false,
    canLock: false,
    canUnlock: false,
    canRestore: false,
  };
}

export function canApplyPartnerAction(role: AdminRole, partner: PartnerRecord, action: "lock" | "unlock" | "restore") {
  const policy = getPartnerPolicy(role);

  if (action === "lock") {
    return policy.canLock && partner.accountState === "active";
  }

  if (action === "unlock") {
    return policy.canUnlock && partner.accountState === "locked";
  }

  return policy.canRestore && partner.accountState === "archived";
}

export function getPartnerRoutePolicySummary(role: AdminRole): PartnerRoutePolicySummary {
  const map: Record<AdminRole, string> = {
    super_admin: "Full partner supervision, metadata edits, and lifecycle account controls.",
    operations: "Operational ownership of partner metadata, locks, unlocks, and restore actions.",
    reviewer: "Read-only portfolio and lifecycle visibility for verification-linked follow-up.",
    support: "Partner support visibility plus lock and unlock controls for incident handling.",
    finance: "Read-only partner context for payout and settlement investigations.",
  };

  return {
    role,
    summary: map[role],
  };
}
