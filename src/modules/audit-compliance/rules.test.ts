import { getAuditLogEntries } from "@/modules/audit-compliance/data";
import {
  auditComplianceAllowedRoles,
  auditExportAllowedRoles,
  buildAuditSummary,
  formatCategoryLabel,
  getAuditPolicy,
  getVisibleCategories,
  isEntryVisibleToRole,
  matchesAuditFilter,
  validateExportPayload,
} from "@/modules/audit-compliance/rules";
import type { AuditFilterState } from "@/modules/audit-compliance/types";

const emptyFilter: AuditFilterState = {
  query: "",
  category: "all",
  riskLevel: "all",
  outcome: "all",
  entityType: "all",
};

describe("audit compliance rules", () => {
  it("exports allowed roles correctly", () => {
    expect(auditComplianceAllowedRoles).toContain("super_admin");
    expect(auditComplianceAllowedRoles).toContain("operations");
    expect(auditComplianceAllowedRoles).toContain("finance");
    expect(auditComplianceAllowedRoles).toContain("reviewer");
    expect(auditComplianceAllowedRoles).toContain("support");
  });

  it("exports export-restricted roles correctly", () => {
    expect(auditExportAllowedRoles).toContain("super_admin");
    expect(auditExportAllowedRoles).toContain("operations");
    expect(auditExportAllowedRoles).toContain("finance");
    expect(auditExportAllowedRoles).not.toContain("reviewer");
    expect(auditExportAllowedRoles).not.toContain("support");
  });

  describe("getAuditPolicy", () => {
    it("grants super_admin full access", () => {
      const policy = getAuditPolicy("super_admin");
      expect(policy.canExportCompliance).toBe(true);
      expect(policy.canViewRetentionControls).toBe(true);
      expect(policy.canViewAccessPolicy).toBe(true);
    });

    it("grants operations export and access policy but not retention", () => {
      const policy = getAuditPolicy("operations");
      expect(policy.canExportCompliance).toBe(true);
      expect(policy.canViewRetentionControls).toBe(false);
      expect(policy.canViewAccessPolicy).toBe(true);
    });

    it("grants finance export only", () => {
      const policy = getAuditPolicy("finance");
      expect(policy.canExportCompliance).toBe(true);
      expect(policy.canViewRetentionControls).toBe(false);
      expect(policy.canViewAccessPolicy).toBe(false);
    });

    it("restricts reviewer from export and config surfaces", () => {
      const policy = getAuditPolicy("reviewer");
      expect(policy.canExportCompliance).toBe(false);
      expect(policy.canViewRetentionControls).toBe(false);
      expect(policy.canViewAccessPolicy).toBe(false);
    });

    it("restricts support from export and config surfaces", () => {
      const policy = getAuditPolicy("support");
      expect(policy.canExportCompliance).toBe(false);
      expect(policy.canViewRetentionControls).toBe(false);
      expect(policy.canViewAccessPolicy).toBe(false);
    });
  });

  describe("getVisibleCategories", () => {
    it("includes admin_access for super_admin", () => {
      expect(getVisibleCategories("super_admin")).toContain("admin_access");
    });

    it("excludes admin_access for finance", () => {
      expect(getVisibleCategories("finance")).not.toContain("admin_access");
    });

    it("restricts reviewer and support to operational categories only", () => {
      for (const role of ["reviewer", "support"] as const) {
        const visible = getVisibleCategories(role);
        expect(visible).not.toContain("financial");
        expect(visible).not.toContain("settlement");
        expect(visible).not.toContain("payout_review");
        expect(visible).not.toContain("admin_access");
        expect(visible).toContain("verification");
        expect(visible).toContain("listing_moderation");
      }
    });
  });

  describe("isEntryVisibleToRole", () => {
    const adminAccessEntry = getAuditLogEntries().find((e) => e.category === "admin_access")!;
    const verificationEntry = getAuditLogEntries().find((e) => e.category === "verification")!;
    const financialEntry = getAuditLogEntries().find((e) => e.category === "financial")!;

    it("shows admin_access entries to super_admin and operations", () => {
      expect(isEntryVisibleToRole(adminAccessEntry, "super_admin")).toBe(true);
      expect(isEntryVisibleToRole(adminAccessEntry, "operations")).toBe(true);
    });

    it("hides admin_access entries from finance, reviewer, support", () => {
      expect(isEntryVisibleToRole(adminAccessEntry, "finance")).toBe(false);
      expect(isEntryVisibleToRole(adminAccessEntry, "reviewer")).toBe(false);
      expect(isEntryVisibleToRole(adminAccessEntry, "support")).toBe(false);
    });

    it("hides financial entries from reviewer and support", () => {
      expect(isEntryVisibleToRole(financialEntry, "reviewer")).toBe(false);
      expect(isEntryVisibleToRole(financialEntry, "support")).toBe(false);
    });

    it("shows verification entries to all roles", () => {
      for (const role of ["super_admin", "operations", "finance", "reviewer", "support"] as const) {
        expect(isEntryVisibleToRole(verificationEntry, role)).toBe(true);
      }
    });
  });

  describe("matchesAuditFilter", () => {
    const entries = getAuditLogEntries();

    it("returns all visible entries when filter is empty", () => {
      const visible = entries.filter((e) => matchesAuditFilter(e, emptyFilter, "super_admin"));
      expect(visible.length).toBe(entries.length);
    });

    it("filters by category", () => {
      const filter: AuditFilterState = { ...emptyFilter, category: "financial" };
      const result = entries.filter((e) => matchesAuditFilter(e, filter, "super_admin"));
      expect(result.every((e) => e.category === "financial")).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("filters by risk level", () => {
      const filter: AuditFilterState = { ...emptyFilter, riskLevel: "critical" };
      const result = entries.filter((e) => matchesAuditFilter(e, filter, "super_admin"));
      expect(result.every((e) => e.riskLevel === "critical")).toBe(true);
    });

    it("filters by outcome", () => {
      const filter: AuditFilterState = { ...emptyFilter, outcome: "success" };
      const result = entries.filter((e) => matchesAuditFilter(e, filter, "super_admin"));
      expect(result.every((e) => e.outcome === "success")).toBe(true);
    });

    it("filters by query matching actor name", () => {
      const filter: AuditFilterState = { ...emptyFilter, query: "Tunde" };
      const result = entries.filter((e) => matchesAuditFilter(e, filter, "super_admin"));
      expect(result.every((e) => e.actor.includes("Tunde"))).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("filters by query matching entity label", () => {
      const filter: AuditFilterState = { ...emptyFilter, query: "GlobalStays" };
      const result = entries.filter((e) => matchesAuditFilter(e, filter, "super_admin"));
      expect(result.length).toBeGreaterThan(0);
    });

    it("excludes role-restricted categories even when filter matches", () => {
      const filter: AuditFilterState = { ...emptyFilter, category: "admin_access" };
      const result = entries.filter((e) => matchesAuditFilter(e, filter, "finance"));
      expect(result.length).toBe(0);
    });

    it("returns empty when query matches nothing", () => {
      const filter: AuditFilterState = { ...emptyFilter, query: "zzznomatch" };
      const result = entries.filter((e) => matchesAuditFilter(e, filter, "super_admin"));
      expect(result.length).toBe(0);
    });
  });

  describe("buildAuditSummary", () => {
    it("counts total, critical, high, and failed entries", () => {
      const entries = getAuditLogEntries();
      const summary = buildAuditSummary(entries);
      expect(summary.total).toBe(entries.length);
      expect(summary.critical).toBe(entries.filter((e) => e.riskLevel === "critical").length);
      expect(summary.high).toBe(entries.filter((e) => e.riskLevel === "high").length);
      expect(summary.failed).toBe(entries.filter((e) => e.outcome === "failed").length);
    });

    it("returns zeros for empty list", () => {
      const summary = buildAuditSummary([]);
      expect(summary.total).toBe(0);
      expect(summary.critical).toBe(0);
      expect(summary.high).toBe(0);
      expect(summary.failed).toBe(0);
    });
  });

  describe("validateExportPayload", () => {
    const validPayload = {
      actor: "Kwame Asante",
      filter: emptyFilter,
      note: "Exporting audit data for Q1 internal compliance review.",
    };

    it("returns null for a valid payload from an allowed role", () => {
      expect(validateExportPayload(validPayload, "super_admin")).toBeNull();
      expect(validateExportPayload(validPayload, "operations")).toBeNull();
      expect(validateExportPayload(validPayload, "finance")).toBeNull();
    });

    it("rejects reviewer and support roles", () => {
      expect(validateExportPayload(validPayload, "reviewer")).toMatch(/cannot export/i);
      expect(validateExportPayload(validPayload, "support")).toMatch(/cannot export/i);
    });

    it("rejects a short or missing audit note", () => {
      const shortNote = { ...validPayload, note: "too short" };
      expect(validateExportPayload(shortNote, "super_admin")).toMatch(/audit note/i);
    });
  });

  describe("formatCategoryLabel", () => {
    it("formats category to human-readable label", () => {
      expect(formatCategoryLabel("admin_access")).toBe("Admin access");
      expect(formatCategoryLabel("listing_moderation")).toBe("Listing moderation");
      expect(formatCategoryLabel("all")).toBe("All categories");
    });
  });
});
