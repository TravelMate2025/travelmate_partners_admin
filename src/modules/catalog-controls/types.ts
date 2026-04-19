import type { AdminRole } from "@/modules/auth/types";

export type CatalogIssueKind = "stay" | "transfer";
export type CatalogIssueType = "duplicate" | "taxonomy" | "geo" | "policy";
export type CatalogIssueStatus = "open" | "in_review" | "resolved";
export type CatalogSeverity = "low" | "medium" | "high" | "critical";
export type CatalogAction =
  | "standardize_taxonomy"
  | "resolve_duplicate"
  | "resolve_geo"
  | "resolve_policy"
  | "update_taxonomy_rule";

export type TaxonomySuggestion = {
  field: string;
  currentValue: string;
  suggestedValue: string;
  reason: string;
};

export type CatalogGeoCheck = {
  status: "match" | "mismatch" | "needs_review";
  summary: string;
  suggestedCity?: string;
  suggestedCountry?: string;
};

export type CatalogHistoryEntry = {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  note: string;
};

export type CatalogAuditRecord = {
  eventId: string;
  actor: string;
  issueId: string;
  action: CatalogAction;
  summary: string;
  status: "recorded" | "queued_for_backend";
};

export type CatalogIssueRecord = {
  id: string;
  listingId: string;
  listingTitle: string;
  partnerName: string;
  businessName: string;
  kind: CatalogIssueKind;
  issueType: CatalogIssueType;
  status: CatalogIssueStatus;
  severity: CatalogSeverity;
  locationLabel: string;
  submittedAt: string;
  lastReviewedAt: string;
  completenessScore: number;
  summary: string;
  missingRequiredFields: string[];
  duplicateWarnings: string[];
  taxonomySuggestions: TaxonomySuggestion[];
  geoCheck: CatalogGeoCheck;
  policyFlags: string[];
  operationalNote: string;
  history: CatalogHistoryEntry[];
  latestAuditRecord?: CatalogAuditRecord;
};

export type CatalogFilterState = {
  query: string;
  kind: CatalogIssueKind | "all";
  issueType: CatalogIssueType | "all";
  status: CatalogIssueStatus | "all";
  severity: CatalogSeverity | "all";
};

export type CatalogActionPayload = {
  actor: string;
  issueId: string;
  action: CatalogAction;
  note: string;
};

export type TaxonomyRuleRecord = {
  id: string;
  field: string;
  currentValue: string;
  normalizedValue: string;
  scope: CatalogIssueKind | "shared";
  usageCount: number;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
};

export type TaxonomyRuleUpdatePayload = {
  actor: string;
  ruleId: string;
  normalizedValue: string;
  note: string;
};

export type CatalogActionResult = {
  records: CatalogIssueRecord[];
  updatedRecord: CatalogIssueRecord;
  auditRecord: CatalogAuditRecord;
};

export type TaxonomyRuleUpdateResult = {
  rules: TaxonomyRuleRecord[];
  updatedRule: TaxonomyRuleRecord;
  auditRecord: CatalogAuditRecord;
};

export type CatalogControlsPolicy = {
  role: AdminRole;
  canStandardizeTaxonomy: boolean;
  canResolveDuplicate: boolean;
  canResolveGeo: boolean;
  canResolvePolicy: boolean;
  summary: string;
};

export type CatalogDashboardSnapshot = {
  openIssues: number;
  resolvedIssues: number;
  criticalIssues: number;
  duplicateSignals: number;
  taxonomyGaps: number;
  geoMismatches: number;
  policyExceptions: number;
};

export type CatalogWorkspaceSurfaceState =
  | {
      status: "loading" | "error" | "exception";
      title?: string;
      description?: string;
    }
  | undefined;
