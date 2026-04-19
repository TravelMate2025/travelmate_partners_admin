import type { AdminRole } from "@/modules/auth/types";
import type {
  ConfigSection,
  ContentKind,
  FeatureToggleArea,
  ModerationTemplateKind,
  ModerationTemplateScope,
  ServiceRegionType,
  SystemConfigActionPayload,
  SystemConfigActionType,
  SystemConfigFilterState,
  SystemConfigPolicy,
  SystemConfigRecord,
  TaxonomyCategory,
} from "@/modules/system-config/types";

export const systemConfigAllowedRoles: AdminRole[] = ["super_admin", "operations"];

export function getSystemConfigPolicy(role: AdminRole): SystemConfigPolicy {
  const isSuperAdmin = role === "super_admin";
  const isOps = role === "operations";

  return {
    canPublish: isSuperAdmin,
    canDeprecate: isSuperAdmin,
    canArchive: isSuperAdmin,
    canManageRegions: isSuperAdmin,
    canToggleFeatures: isSuperAdmin || isOps,
    summary: isSuperAdmin
      ? "Full configuration access: publish, deprecate, archive, manage regions, and toggle features."
      : isOps
        ? "Can enable, disable, and stage feature toggles. All taxonomy, region, template, and content changes require super admin."
        : "Read-only access. No configuration actions are available for this role.",
    allowedRoles: systemConfigAllowedRoles,
  };
}

export function getAvailableActions(record: SystemConfigRecord, role: AdminRole): SystemConfigActionType[] {
  const policy = getSystemConfigPolicy(role);
  const actions: SystemConfigActionType[] = [];

  if (record.kind === "taxonomy") {
    if (record.status === "draft" && policy.canPublish) actions.push("publish");
    if (record.status === "active" && policy.canDeprecate) actions.push("deprecate");
  } else if (record.kind === "toggle") {
    if (policy.canToggleFeatures) {
      if (record.status === "disabled") actions.push("enable", "stage");
      else if (record.status === "enabled") actions.push("disable", "stage");
      else if (record.status === "staged") actions.push("enable", "disable");
    }
  } else if (record.kind === "region") {
    if (policy.canManageRegions) {
      if (record.status === "draft" || record.status === "disabled") actions.push("activate");
      if (record.status === "active") actions.push("deactivate");
    }
  } else if (record.kind === "template") {
    if (record.status === "draft" && policy.canPublish) actions.push("publish");
    if (record.status === "active" && policy.canArchive) actions.push("archive");
  } else if (record.kind === "content") {
    if (record.status === "draft" && policy.canPublish) actions.push("publish");
    if (record.status === "published" && policy.canArchive) actions.push("archive");
  }

  return actions;
}

export function validateConfigAction(
  payload: SystemConfigActionPayload,
  record: SystemConfigRecord,
  role: AdminRole,
  allRecords?: SystemConfigRecord[],
): string | null {
  const policy = getSystemConfigPolicy(role);

  if (record.kind === "taxonomy") {
    if (!policy.canPublish && payload.type === "publish") return "Publishing taxonomy items requires super admin access.";
    if (!policy.canDeprecate && payload.type === "deprecate") return "Deprecating taxonomy items requires super admin access.";
    if (payload.type === "publish" && record.status !== "draft") return "Only draft taxonomy items can be published.";
    if (payload.type === "deprecate" && record.status !== "active") return "Only active taxonomy items can be deprecated.";
  } else if (record.kind === "toggle") {
    if (!policy.canToggleFeatures) return "Toggling feature flags requires operations or super admin access.";
    if (payload.type === "enable" && record.status === "enabled") return "This feature toggle is already enabled.";
    if (payload.type === "disable" && record.status === "disabled") return "This feature toggle is already disabled.";
    if (payload.type === "stage" && record.status === "staged") return "This feature toggle is already staged.";
  } else if (record.kind === "region") {
    if (!policy.canManageRegions) return "Managing service regions requires super admin access.";
    if (payload.type === "activate" && record.status === "active") return "This region is already active.";
    if (payload.type === "deactivate" && record.status !== "active") return "Only active regions can be deactivated.";

    // Dependency check: city/service_area requires active parent
    if (payload.type === "activate" && record.regionType !== "country" && record.parentId && allRecords) {
      const parent = allRecords.find((r) => r.id === record.parentId);
      if (!parent || parent.status !== "active") {
        return "The parent region must be active before activating a city or service area.";
      }
    }
  } else if (record.kind === "template") {
    if (!policy.canPublish && payload.type === "publish") return "Publishing moderation templates requires super admin access.";
    if (!policy.canArchive && payload.type === "archive") return "Archiving moderation templates requires super admin access.";
    if (payload.type === "publish" && record.status !== "draft") return "Only draft templates can be published.";
    if (payload.type === "archive" && record.status !== "active") return "Only active templates can be archived.";

    // Dependency check: cannot archive a template that is still in use
    if (payload.type === "archive" && record.usageCount > 0) {
      return `This template is referenced by ${record.usageCount} active moderation workflows and cannot be archived.`;
    }
  } else if (record.kind === "content") {
    if (!policy.canPublish && payload.type === "publish") return "Publishing content requires super admin access.";
    if (!policy.canArchive && payload.type === "archive") return "Archiving content requires super admin access.";
    if (payload.type === "publish" && record.status !== "draft") return "Only draft content can be published.";
    if (payload.type === "archive" && record.status !== "published") return "Only published content can be archived.";

    // Dependency check: sole published terms/policy cannot be archived
    if (payload.type === "archive" && (record.contentKind === "terms" || record.contentKind === "policy") && allRecords) {
      const publishedSameKind = allRecords.filter(
        (r) => r.kind === "content" && r.contentKind === record.contentKind && r.status === "published",
      );
      if (publishedSameKind.length <= 1) {
        return "Cannot archive the only published terms or policy document. Publish a replacement version first.";
      }
    }
  }

  if (payload.note.trim().length < 12) {
    return "Add an operator note of at least 12 characters before applying this change.";
  }

  return null;
}

const SECTION_KIND_MAP: Record<ConfigSection, SystemConfigRecord["kind"]> = {
  taxonomy: "taxonomy",
  toggles: "toggle",
  regions: "region",
  templates: "template",
  content: "content",
};

export function matchesConfigFilter(record: SystemConfigRecord, filters: SystemConfigFilterState): boolean {
  const query = filters.query.trim().toLowerCase();
  const matchesQuery =
    query.length === 0 ||
    record.name.toLowerCase().includes(query) ||
    record.slug.toLowerCase().includes(query) ||
    record.description.toLowerCase().includes(query);

  const matchesSection = filters.section === "all" || record.kind === SECTION_KIND_MAP[filters.section];
  const matchesCategory = filters.category === "all" || (record.kind === "taxonomy" && record.category === filters.category);
  const matchesArea = filters.area === "all" || (record.kind === "toggle" && record.area === filters.area);
  const matchesStatus = filters.status === "all" || record.status === filters.status;

  return matchesQuery && matchesSection && matchesCategory && matchesArea && matchesStatus;
}

export function buildConfigSummary(records: SystemConfigRecord[]) {
  return {
    totalTaxonomy: records.filter((r) => r.kind === "taxonomy").length,
    activeTaxonomy: records.filter((r) => r.kind === "taxonomy" && r.status === "active").length,
    pendingPublish: records.filter((r) => r.status === "draft").length,
    enabledToggles: records.filter((r) => r.kind === "toggle" && r.status === "enabled").length,
  };
}

export function formatCategoryLabel(category: TaxonomyCategory): string {
  const labels: Record<TaxonomyCategory, string> = {
    amenity: "Amenity",
    vehicle_class: "Vehicle Class",
    property_type: "Property Type",
    tag: "Tag",
    service_area: "Service Area",
  };
  return labels[category];
}

export function formatAreaLabel(area: FeatureToggleArea): string {
  const labels: Record<FeatureToggleArea, string> = {
    partner_app: "Partner App",
    admin_dashboard: "Admin Dashboard",
    api: "API",
    global: "Global",
  };
  return labels[area];
}

export function formatRegionTypeLabel(regionType: ServiceRegionType): string {
  const labels: Record<ServiceRegionType, string> = {
    country: "Country",
    city: "City",
    service_area: "Service Area",
  };
  return labels[regionType];
}

export function formatTemplateKindLabel(kind: ModerationTemplateKind): string {
  const labels: Record<ModerationTemplateKind, string> = {
    rejection: "Rejection",
    send_back: "Send Back",
    request_docs: "Request Documents",
    suspension: "Suspension",
    info: "Informational",
  };
  return labels[kind];
}

export function formatTemplateScopeLabel(scope: ModerationTemplateScope): string {
  const labels: Record<ModerationTemplateScope, string> = {
    listing: "Listing",
    partner: "Partner",
    verification: "Verification",
    api_client: "API Client",
  };
  return labels[scope];
}

export function formatContentKindLabel(kind: ContentKind): string {
  const labels: Record<ContentKind, string> = {
    terms: "Terms of Service",
    policy: "Policy",
    help_doc: "Help Document",
    announcement: "Announcement",
  };
  return labels[kind];
}

export function formatSectionLabel(section: ConfigSection): string {
  const labels: Record<ConfigSection, string> = {
    taxonomy: "Taxonomy",
    toggles: "Feature Toggles",
    regions: "Regions",
    templates: "Moderation Templates",
    content: "Static Content",
  };
  return labels[section];
}

export function statusTone(status: SystemConfigRecord["status"]) {
  switch (status) {
    case "active":
    case "enabled":
    case "published":
      return "success" as const;
    case "draft":
    case "staged":
      return "warning" as const;
    case "deprecated":
    case "disabled":
    case "archived":
      return "danger" as const;
  }
}
