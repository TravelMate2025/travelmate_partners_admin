import type { AdminRole } from "@/modules/auth/types";
import type {
  CatalogAction,
  CatalogControlsPolicy,
  CatalogDashboardSnapshot,
  CatalogIssueRecord,
} from "@/modules/catalog-controls/types";

export function getCatalogControlsPolicy(role: AdminRole): CatalogControlsPolicy {
  if (role === "super_admin") {
    return {
      role,
      canStandardizeTaxonomy: true,
      canResolveDuplicate: true,
      canResolveGeo: true,
      canResolvePolicy: true,
      summary: "Full catalog-control access including taxonomy governance and suspicious-inventory resolution.",
    };
  }

  if (role === "operations") {
    return {
      role,
      canStandardizeTaxonomy: true,
      canResolveDuplicate: true,
      canResolveGeo: true,
      canResolvePolicy: true,
      summary: "Operational quality-control access for taxonomy fixes and flagged-inventory resolution.",
    };
  }

  if (role === "reviewer") {
    return {
      role,
      canStandardizeTaxonomy: false,
      canResolveDuplicate: true,
      canResolveGeo: true,
      canResolvePolicy: true,
      summary: "Reviewer access for duplicate, geo, and policy remediation without taxonomy-rule changes.",
    };
  }

  return {
    role,
    canStandardizeTaxonomy: false,
    canResolveDuplicate: false,
    canResolveGeo: false,
    canResolvePolicy: false,
    summary: "Read-only visibility for catalog-quality context.",
  };
}

export function canApplyCatalogAction(role: AdminRole, record: CatalogIssueRecord, action: CatalogAction) {
  const policy = getCatalogControlsPolicy(role);

  if (record.status === "resolved") {
    return false;
  }

  switch (action) {
    case "standardize_taxonomy":
      return policy.canStandardizeTaxonomy && record.issueType === "taxonomy";
    case "resolve_duplicate":
      return policy.canResolveDuplicate && record.issueType === "duplicate";
    case "resolve_geo":
      return policy.canResolveGeo && record.issueType === "geo";
    case "resolve_policy":
      return policy.canResolvePolicy && record.issueType === "policy";
  }
}

export function buildCatalogDashboardSnapshot(records: CatalogIssueRecord[]): CatalogDashboardSnapshot {
  return {
    openIssues: records.filter((record) => record.status !== "resolved").length,
    resolvedIssues: records.filter((record) => record.status === "resolved").length,
    criticalIssues: records.filter((record) => record.severity === "critical" && record.status !== "resolved").length,
    duplicateSignals: records.filter((record) => record.issueType === "duplicate").length,
    taxonomyGaps: records.filter((record) => record.issueType === "taxonomy").length,
    geoMismatches: records.filter((record) => record.issueType === "geo").length,
    policyExceptions: records.filter((record) => record.issueType === "policy").length,
  };
}
