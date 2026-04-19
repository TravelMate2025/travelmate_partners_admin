import type { AdminRole } from "@/modules/auth/types";

export type TaxonomyCategory = "amenity" | "vehicle_class" | "property_type" | "tag" | "service_area";
export type FeatureToggleArea = "partner_app" | "admin_dashboard" | "api" | "global";
export type ServiceRegionType = "country" | "city" | "service_area";
export type ModerationTemplateKind = "rejection" | "send_back" | "request_docs" | "suspension" | "info";
export type ModerationTemplateScope = "listing" | "partner" | "verification" | "api_client";
export type ContentKind = "terms" | "policy" | "help_doc" | "announcement";

export type SystemConfigStatus =
  | "active"
  | "draft"
  | "deprecated"
  | "enabled"
  | "disabled"
  | "staged"
  | "published"
  | "archived";

export type ConfigSection = "taxonomy" | "toggles" | "regions" | "templates" | "content";

export type SystemConfigActionType =
  | "publish"    // taxonomy draft→active | template draft→active | content draft→published
  | "deprecate"  // taxonomy active→deprecated
  | "archive"    // template active→archived | content published→archived
  | "activate"   // region draft/disabled→active
  | "deactivate" // region active→disabled
  | "enable"     // toggle →enabled
  | "disable"    // toggle →disabled
  | "stage";     // toggle →staged

export type SystemConfigHistoryEntry = {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  note: string;
};

export type SystemConfigAuditRecord = {
  eventId: string;
  actor: string;
  itemId: string;
  action: SystemConfigActionType;
  summary: string;
  status: "queued_for_backend";
};

export type SystemConfigRecord = {
  id: string;
  kind: "taxonomy" | "toggle" | "region" | "template" | "content";
  name: string;
  slug: string;
  description: string;
  status: SystemConfigStatus;
  // taxonomy
  category: TaxonomyCategory | null;
  // toggle
  area: FeatureToggleArea | null;
  rolloutPercent: number | null;
  // region
  regionType: ServiceRegionType | null;
  parentId: string | null;
  parentSlug: string | null;
  timezone: string | null;
  currency: string | null;
  // template
  templateKind: ModerationTemplateKind | null;
  templateScope: ModerationTemplateScope | null;
  // content
  contentKind: ContentKind | null;
  contentVersion: string | null;
  // shared
  usageCount: number;
  updatedBy: string;
  updatedAt: string;
  operationalNote: string;
  history: SystemConfigHistoryEntry[];
  latestAuditRecord: SystemConfigAuditRecord | null;
};

export type SystemConfigFilterState = {
  query: string;
  section: ConfigSection | "all";
  category: TaxonomyCategory | "all";
  area: FeatureToggleArea | "all";
  status: SystemConfigStatus | "all";
};

export type SystemConfigActionPayload = {
  type: SystemConfigActionType;
  itemId: string;
  actor: string;
  note: string;
  rolloutPercent?: number;
};

export type SystemConfigActionResult = {
  records: SystemConfigRecord[];
  updatedRecord: SystemConfigRecord;
  auditRecord: SystemConfigAuditRecord;
};

export type SystemConfigPolicy = {
  canPublish: boolean;
  canDeprecate: boolean;
  canArchive: boolean;
  canManageRegions: boolean;
  canToggleFeatures: boolean;
  summary: string;
  allowedRoles: AdminRole[];
};
