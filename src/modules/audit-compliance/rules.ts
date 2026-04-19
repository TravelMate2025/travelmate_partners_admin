import type { AdminRole } from "@/modules/auth/types";
import type {
  AuditEventCategory,
  AuditFilterState,
  AuditLogEntry,
  AuditPolicy,
  ComplianceExportPayload,
} from "@/modules/audit-compliance/types";

export const auditComplianceAllowedRoles: AdminRole[] = [
  "super_admin",
  "operations",
  "finance",
  "reviewer",
  "support",
];

export const auditExportAllowedRoles: AdminRole[] = ["super_admin", "operations", "finance"];

export function getAuditPolicy(role: AdminRole): AuditPolicy {
  const canExportCompliance = auditExportAllowedRoles.includes(role);
  const canViewRetentionControls = role === "super_admin";
  const canViewAccessPolicy = role === "super_admin" || role === "operations";

  let summary: string;
  if (role === "super_admin") {
    summary =
      "Full audit access: log exploration, compliance exports, retention settings, and access-policy visibility.";
  } else if (role === "operations") {
    summary = "This role can explore the audit log and export compliance evidence. Retention controls are restricted to super admin.";
  } else if (role === "finance") {
    summary =
      "This role can explore the audit log and export compliance evidence. Admin access events are not visible to this role.";
  } else {
    summary = "This role can explore the audit log. Compliance exports and configuration controls are restricted.";
  }

  return {
    canExportCompliance,
    canViewRetentionControls,
    canViewAccessPolicy,
    summary,
    allowedRoles: auditComplianceAllowedRoles,
  };
}

export function getVisibleCategories(role: AdminRole): (AuditEventCategory | "all")[] {
  if (role === "super_admin" || role === "operations") {
    return [
      "all",
      "verification",
      "partner_lifecycle",
      "listing_moderation",
      "financial",
      "settlement",
      "payout_review",
      "admin_access",
      "api_governance",
    ];
  }

  if (role === "finance") {
    return [
      "all",
      "verification",
      "partner_lifecycle",
      "listing_moderation",
      "financial",
      "settlement",
      "payout_review",
      "api_governance",
    ];
  }

  return ["all", "verification", "partner_lifecycle", "listing_moderation", "api_governance"];
}

const reviewerSupportCategories: AuditEventCategory[] = [
  "verification",
  "partner_lifecycle",
  "listing_moderation",
  "api_governance",
];

export function isEntryVisibleToRole(entry: AuditLogEntry, role: AdminRole): boolean {
  if (role === "super_admin" || role === "operations") return true;
  if (role === "finance") return entry.category !== "admin_access";
  return reviewerSupportCategories.includes(entry.category);
}

export function matchesAuditFilter(entry: AuditLogEntry, filter: AuditFilterState, role: AdminRole): boolean {
  if (!isEntryVisibleToRole(entry, role)) return false;

  const query = filter.query.trim().toLowerCase();
  const matchesQuery =
    query.length === 0 ||
    entry.actor.toLowerCase().includes(query) ||
    entry.entityLabel.toLowerCase().includes(query) ||
    entry.summary.toLowerCase().includes(query) ||
    entry.action.toLowerCase().includes(query);

  const matchesCategory = filter.category === "all" || entry.category === filter.category;
  const matchesRisk = filter.riskLevel === "all" || entry.riskLevel === filter.riskLevel;
  const matchesOutcome = filter.outcome === "all" || entry.outcome === filter.outcome;
  const matchesEntity = filter.entityType === "all" || entry.entityType === filter.entityType;

  return matchesQuery && matchesCategory && matchesRisk && matchesOutcome && matchesEntity;
}

export function buildAuditSummary(entries: AuditLogEntry[]) {
  return {
    total: entries.length,
    critical: entries.filter((e) => e.riskLevel === "critical").length,
    high: entries.filter((e) => e.riskLevel === "high").length,
    failed: entries.filter((e) => e.outcome === "failed").length,
  };
}

export function validateExportPayload(payload: ComplianceExportPayload, role: AdminRole): string | null {
  if (!auditExportAllowedRoles.includes(role)) {
    return "This role cannot export compliance evidence.";
  }

  if (payload.note.trim().length < 16) {
    return "Add a clear audit note explaining the reason for this compliance export.";
  }

  return null;
}

export function formatCategoryLabel(category: AuditEventCategory | "all"): string {
  const labels: Record<AuditEventCategory | "all", string> = {
    all: "All categories",
    verification: "Verification",
    partner_lifecycle: "Partner lifecycle",
    listing_moderation: "Listing moderation",
    financial: "Financial",
    settlement: "Settlement",
    payout_review: "Payout review",
    admin_access: "Admin access",
    api_governance: "API governance",
  };
  return labels[category] ?? category;
}

export function formatActionLabel(action: AuditLogEntry["action"]): string {
  return action.replaceAll("_", " ");
}

export function riskTone(level: AuditLogEntry["riskLevel"]) {
  if (level === "critical") return "danger" as const;
  if (level === "high") return "warning" as const;
  if (level === "medium") return "info" as const;
  return "neutral" as const;
}

export function outcomeTone(outcome: AuditLogEntry["outcome"]) {
  if (outcome === "success") return "success" as const;
  if (outcome === "failed") return "danger" as const;
  return "warning" as const;
}
