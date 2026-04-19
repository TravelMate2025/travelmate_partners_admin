import { canApplyCatalogAction } from "@/modules/catalog-controls/rules";
import type {
  CatalogAction,
  CatalogActionPayload,
  CatalogActionResult,
  CatalogIssueRecord,
  TaxonomyRuleRecord,
  TaxonomyRuleUpdatePayload,
  TaxonomyRuleUpdateResult,
} from "@/modules/catalog-controls/types";
import type { AdminRole } from "@/modules/auth/types";

function formatTimestamp(date: string) {
  return new Date(date)
    .toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    })
    .replace(",", " UTC");
}

function buildHistoryAction(action: CatalogAction) {
  switch (action) {
    case "standardize_taxonomy":
      return "Taxonomy standardized";
    case "resolve_duplicate":
      return "Duplicate signal resolved";
    case "resolve_geo":
      return "Geo mismatch resolved";
    case "resolve_policy":
      return "Policy exception resolved";
    case "update_taxonomy_rule":
      return "Taxonomy rule updated";
  }
}

function buildAuditSummary(actor: string, action: CatalogAction, title: string) {
  switch (action) {
    case "standardize_taxonomy":
      return `${actor} standardized taxonomy for ${title}.`;
    case "resolve_duplicate":
      return `${actor} resolved duplicate review for ${title}.`;
    case "resolve_geo":
      return `${actor} resolved geo-data mismatch for ${title}.`;
    case "resolve_policy":
      return `${actor} resolved policy exception for ${title}.`;
    case "update_taxonomy_rule":
      return `${actor} updated a taxonomy normalization rule for ${title}.`;
  }
}

function applyActionToRecord(record: CatalogIssueRecord, payload: CatalogActionPayload) {
  const timestamp = new Date().toISOString();
  const note = payload.note.trim().length > 0 ? payload.note.trim() : record.operationalNote;

  switch (payload.action) {
    case "standardize_taxonomy":
      return {
        ...record,
        status: "resolved" as const,
        lastReviewedAt: timestamp,
        operationalNote: note,
        taxonomySuggestions: [],
        history: [
          {
            id: `catalog-history-${record.id}-taxonomy-${Date.now()}`,
            actor: payload.actor,
            action: buildHistoryAction(payload.action),
            timestamp: formatTimestamp(timestamp),
            note,
          },
          ...record.history,
        ],
      };
    case "resolve_duplicate":
      return {
        ...record,
        status: "resolved" as const,
        lastReviewedAt: timestamp,
        operationalNote: note,
        duplicateWarnings: [],
        history: [
          {
            id: `catalog-history-${record.id}-duplicate-${Date.now()}`,
            actor: payload.actor,
            action: buildHistoryAction(payload.action),
            timestamp: formatTimestamp(timestamp),
            note,
          },
          ...record.history,
        ],
      };
    case "resolve_geo":
      return {
        ...record,
        status: "resolved" as const,
        lastReviewedAt: timestamp,
        operationalNote: note,
        locationLabel: [
          record.geoCheck.suggestedCity ?? record.locationLabel.split(",")[0]?.trim(),
          record.geoCheck.suggestedCountry ?? record.locationLabel.split(",")[1]?.trim(),
        ]
          .filter(Boolean)
          .join(", "),
        geoCheck: {
          status: "match" as const,
          summary: "Geo mismatch reviewed and aligned to the approved service-area configuration.",
        },
        history: [
          {
            id: `catalog-history-${record.id}-geo-${Date.now()}`,
            actor: payload.actor,
            action: buildHistoryAction(payload.action),
            timestamp: formatTimestamp(timestamp),
            note,
          },
          ...record.history,
        ],
      };
    case "resolve_policy":
      return {
        ...record,
        status: "resolved" as const,
        lastReviewedAt: timestamp,
        operationalNote: note,
        policyFlags: [],
        history: [
          {
            id: `catalog-history-${record.id}-policy-${Date.now()}`,
            actor: payload.actor,
            action: buildHistoryAction(payload.action),
            timestamp: formatTimestamp(timestamp),
            note,
          },
          ...record.history,
        ],
      };
    case "update_taxonomy_rule":
      return record;
  }
}

export type CatalogControlsRepository = {
  applyAction(
    records: CatalogIssueRecord[],
    payload: CatalogActionPayload,
    role: AdminRole,
  ): Promise<CatalogActionResult>;
  updateTaxonomyRule(
    rules: TaxonomyRuleRecord[],
    payload: TaxonomyRuleUpdatePayload,
    role: AdminRole,
  ): Promise<TaxonomyRuleUpdateResult>;
};

export const mockCatalogControlsRepository: CatalogControlsRepository = {
  async applyAction(records, payload, role) {
    const record = records.find((item) => item.id === payload.issueId);

    if (!record) {
      throw new Error("Selected catalog issue was not found.");
    }

    if (!canApplyCatalogAction(role, record, payload.action)) {
      throw new Error(`Action ${payload.action} is not allowed for this catalog issue.`);
    }

    const updatedRecord = {
      ...applyActionToRecord(record, payload),
      latestAuditRecord: {
        eventId: `catalog-audit-${payload.action}-${Date.now()}`,
        actor: payload.actor,
        issueId: record.id,
        action: payload.action,
        summary: buildAuditSummary(payload.actor, payload.action, record.listingTitle),
        status: "queued_for_backend" as const,
      },
    };

    return {
      records: records.map((item) => (item.id === record.id ? updatedRecord : item)),
      updatedRecord,
      auditRecord: updatedRecord.latestAuditRecord,
    };
  },
  async updateTaxonomyRule(rules, payload, role) {
    if (role !== "operations" && role !== "super_admin") {
      throw new Error("Only operations and super admin roles can update taxonomy rules.");
    }

    const rule = rules.find((item) => item.id === payload.ruleId);
    if (!rule) {
      throw new Error("Selected taxonomy rule was not found.");
    }

    const normalizedValue = payload.normalizedValue.trim();
    if (normalizedValue.length === 0) {
      throw new Error("Provide a normalized taxonomy value before saving.");
    }

    const updatedRule = {
      ...rule,
      normalizedValue,
      lastUpdatedAt: new Date().toISOString(),
      lastUpdatedBy: payload.actor,
    };

    const auditRecord = {
      eventId: `catalog-taxonomy-rule-${payload.ruleId}-${Date.now()}`,
      actor: payload.actor,
      issueId: payload.ruleId,
      action: "update_taxonomy_rule" as const,
      summary: `${payload.actor} updated taxonomy rule ${rule.field}: ${rule.currentValue} -> ${normalizedValue}.`,
      status: "queued_for_backend" as const,
    };

    return {
      rules: rules.map((item) => (item.id === rule.id ? updatedRule : item)),
      updatedRule,
      auditRecord,
    };
  },
};
