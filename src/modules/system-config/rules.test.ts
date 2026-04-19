import {
  buildConfigSummary,
  formatAreaLabel,
  formatCategoryLabel,
  formatContentKindLabel,
  formatRegionTypeLabel,
  formatTemplateKindLabel,
  formatTemplateScopeLabel,
  getAvailableActions,
  getSystemConfigPolicy,
  matchesConfigFilter,
  statusTone,
  systemConfigAllowedRoles,
  validateConfigAction,
} from "@/modules/system-config/rules";
import { getSystemConfigRecords } from "@/modules/system-config/data";

describe("system-config rules", () => {
  const records = getSystemConfigRecords();

  const draftTaxonomy = records.find((r) => r.id === "sysc-003")!;
  const activeTaxonomy = records.find((r) => r.id === "sysc-001")!;
  const deprecatedTaxonomy = records.find((r) => r.id === "sysc-009")!;
  const enabledToggle = records.find((r) => r.id === "sysc-010")!;
  const disabledToggle = records.find((r) => r.id === "sysc-012")!;
  const stagedToggle = records.find((r) => r.id === "sysc-011")!;
  const draftRegion = records.find((r) => r.id === "sysc-021")!;
  const activeRegion = records.find((r) => r.id === "sysc-019")!;
  const activeCountry = records.find((r) => r.id === "sysc-017")!;
  const draftTemplate = records.find((r) => r.id === "sysc-026")!;
  const activeTemplate = records.find((r) => r.id === "sysc-023")!;
  const draftContent = records.find((r) => r.id === "sysc-031")!;
  const publishedTerms = records.find((r) => r.id === "sysc-028")!;

  it("exposes only super_admin and operations in allowed roles", () => {
    expect(systemConfigAllowedRoles).toEqual(["super_admin", "operations"]);
  });

  describe("getSystemConfigPolicy", () => {
    it("grants super_admin full configuration access", () => {
      const policy = getSystemConfigPolicy("super_admin");
      expect(policy.canPublish).toBe(true);
      expect(policy.canDeprecate).toBe(true);
      expect(policy.canArchive).toBe(true);
      expect(policy.canManageRegions).toBe(true);
      expect(policy.canToggleFeatures).toBe(true);
    });

    it("grants operations only toggle access", () => {
      const policy = getSystemConfigPolicy("operations");
      expect(policy.canPublish).toBe(false);
      expect(policy.canDeprecate).toBe(false);
      expect(policy.canArchive).toBe(false);
      expect(policy.canManageRegions).toBe(false);
      expect(policy.canToggleFeatures).toBe(true);
    });

    it("blocks reviewer, support, and finance from all config actions", () => {
      for (const role of ["reviewer", "support", "finance"] as const) {
        const policy = getSystemConfigPolicy(role);
        expect(policy.canPublish).toBe(false);
        expect(policy.canToggleFeatures).toBe(false);
        expect(policy.canManageRegions).toBe(false);
      }
    });
  });

  describe("getAvailableActions", () => {
    it("offers publish for a draft taxonomy item to super_admin", () => {
      expect(getAvailableActions(draftTaxonomy, "super_admin")).toContain("publish");
    });

    it("does not offer publish to operations for taxonomy", () => {
      expect(getAvailableActions(draftTaxonomy, "operations")).not.toContain("publish");
    });

    it("offers deprecate for an active taxonomy item to super_admin only", () => {
      expect(getAvailableActions(activeTaxonomy, "super_admin")).toContain("deprecate");
      expect(getAvailableActions(activeTaxonomy, "operations")).not.toContain("deprecate");
    });

    it("returns no actions for a deprecated taxonomy item", () => {
      expect(getAvailableActions(deprecatedTaxonomy, "super_admin")).toHaveLength(0);
    });

    it("offers enable and stage for a disabled toggle to operations", () => {
      expect(getAvailableActions(disabledToggle, "operations")).toEqual(expect.arrayContaining(["enable", "stage"]));
    });

    it("offers enable and disable for a staged toggle", () => {
      expect(getAvailableActions(stagedToggle, "operations")).toEqual(expect.arrayContaining(["enable", "disable"]));
    });

    it("offers activate for a draft region to super_admin", () => {
      expect(getAvailableActions(draftRegion, "super_admin")).toContain("activate");
    });

    it("offers deactivate for an active region to super_admin", () => {
      expect(getAvailableActions(activeRegion, "super_admin")).toContain("deactivate");
    });

    it("does not offer region actions to operations", () => {
      expect(getAvailableActions(draftRegion, "operations")).toHaveLength(0);
    });

    it("offers publish for a draft template to super_admin", () => {
      expect(getAvailableActions(draftTemplate, "super_admin")).toContain("publish");
    });

    it("offers archive for an active template to super_admin", () => {
      expect(getAvailableActions(activeTemplate, "super_admin")).toContain("archive");
    });

    it("offers publish for draft content to super_admin", () => {
      expect(getAvailableActions(draftContent, "super_admin")).toContain("publish");
    });
  });

  describe("validateConfigAction — dependency checks", () => {
    it("blocks city activation when parent city is not active", () => {
      // sysc-021 (Nairobi CBD service_area) has parentId: sysc-019 (Nairobi city)
      const disabledParentCity = { ...activeRegion, status: "disabled" as const };
      const allWithDisabledParent = records.map((r) => (r.id === "sysc-019" ? disabledParentCity : r));

      const error = validateConfigAction(
        { type: "activate", itemId: draftRegion.id, actor: "Amina Bello", note: "Activating Nairobi CBD service area." },
        draftRegion,
        "super_admin",
        allWithDisabledParent,
      );
      expect(error).toBe("The parent region must be active before activating a city or service area.");
    });

    it("allows city activation when parent country is active", () => {
      const error = validateConfigAction(
        { type: "activate", itemId: draftRegion.id, actor: "Amina Bello", note: "Activating Nairobi CBD service area." },
        draftRegion,
        "super_admin",
        records,
      );
      expect(error).toBeNull();
    });

    it("blocks archiving a moderation template with active usage", () => {
      const error = validateConfigAction(
        { type: "archive", itemId: activeTemplate.id, actor: "Amina Bello", note: "Archiving in favour of updated template." },
        activeTemplate,
        "super_admin",
        records,
      );
      expect(error).toContain("referenced by 47 active moderation workflows");
    });

    it("allows archiving a moderation template with zero usage", () => {
      const unusedTemplate = records.find((r) => r.id === "sysc-026")!;
      const publishedUnused = { ...unusedTemplate, status: "active" as const };
      const error = validateConfigAction(
        { type: "archive", itemId: publishedUnused.id, actor: "Amina Bello", note: "Archiving unused draft template." },
        publishedUnused,
        "super_admin",
        records,
      );
      expect(error).toBeNull();
    });

    it("blocks archiving the sole published terms document", () => {
      const error = validateConfigAction(
        { type: "archive", itemId: publishedTerms.id, actor: "Amina Bello", note: "Archiving old terms version now." },
        publishedTerms,
        "super_admin",
        records,
      );
      expect(error).toBe("Cannot archive the only published terms or policy document. Publish a replacement version first.");
    });

    it("blocks operations from managing regions", () => {
      const error = validateConfigAction(
        { type: "activate", itemId: draftRegion.id, actor: "David Cole", note: "Trying to activate from operations." },
        draftRegion,
        "operations",
        records,
      );
      expect(error).toBe("Managing service regions requires super admin access.");
    });

    it("rejects action when operator note is too short", () => {
      const error = validateConfigAction(
        { type: "activate", itemId: draftRegion.id, actor: "Amina Bello", note: "ok" },
        draftRegion,
        "super_admin",
        records,
      );
      expect(error).toBe("Add an operator note of at least 12 characters before applying this change.");
    });
  });

  describe("matchesConfigFilter", () => {
    it("matches all records when no filters are active", () => {
      const filtered = records.filter((r) =>
        matchesConfigFilter(r, { query: "", section: "all", category: "all", area: "all", status: "all" }),
      );
      expect(filtered).toHaveLength(records.length);
    });

    it("filters section=taxonomy to only taxonomy items", () => {
      const filtered = records.filter((r) =>
        matchesConfigFilter(r, { query: "", section: "taxonomy", category: "all", area: "all", status: "all" }),
      );
      expect(filtered.every((r) => r.kind === "taxonomy")).toBe(true);
    });

    it("filters section=regions to only region items", () => {
      const filtered = records.filter((r) =>
        matchesConfigFilter(r, { query: "", section: "regions", category: "all", area: "all", status: "all" }),
      );
      expect(filtered.every((r) => r.kind === "region")).toBe(true);
      expect(filtered.length).toBe(6);
    });

    it("filters section=templates to only template items", () => {
      const filtered = records.filter((r) =>
        matchesConfigFilter(r, { query: "", section: "templates", category: "all", area: "all", status: "all" }),
      );
      expect(filtered.every((r) => r.kind === "template")).toBe(true);
      expect(filtered.length).toBe(5);
    });

    it("filters section=content to only content items", () => {
      const filtered = records.filter((r) =>
        matchesConfigFilter(r, { query: "", section: "content", category: "all", area: "all", status: "all" }),
      );
      expect(filtered.every((r) => r.kind === "content")).toBe(true);
      expect(filtered.length).toBe(4);
    });

    it("filters by taxonomy category and excludes other kinds", () => {
      const filtered = records.filter((r) =>
        matchesConfigFilter(r, { query: "", section: "all", category: "vehicle_class", area: "all", status: "all" }),
      );
      expect(filtered.every((r) => r.category === "vehicle_class")).toBe(true);
      expect(filtered.some((r) => r.kind !== "taxonomy")).toBe(false);
    });

    it("filters by toggle area and excludes other kinds", () => {
      const filtered = records.filter((r) =>
        matchesConfigFilter(r, { query: "", section: "all", category: "all", area: "api", status: "all" }),
      );
      expect(filtered.every((r) => r.area === "api")).toBe(true);
    });

    it("filters by status=draft across all kinds", () => {
      const filtered = records.filter((r) =>
        matchesConfigFilter(r, { query: "", section: "all", category: "all", area: "all", status: "draft" }),
      );
      expect(filtered.every((r) => r.status === "draft")).toBe(true);
      expect(filtered.length).toBe(6);
    });

    it("filters by status=published to only published content", () => {
      const filtered = records.filter((r) =>
        matchesConfigFilter(r, { query: "", section: "all", category: "all", area: "all", status: "published" }),
      );
      expect(filtered.every((r) => r.status === "published")).toBe(true);
    });
  });

  describe("buildConfigSummary", () => {
    it("returns accurate summary counts across all record kinds", () => {
      const summary = buildConfigSummary(records);
      expect(summary.totalTaxonomy).toBe(9);
      expect(summary.activeTaxonomy).toBe(5);
      expect(summary.pendingPublish).toBe(6);
      expect(summary.enabledToggles).toBe(3);
    });
  });

  describe("label formatters", () => {
    it("formats all taxonomy category values", () => {
      expect(formatCategoryLabel("amenity")).toBe("Amenity");
      expect(formatCategoryLabel("vehicle_class")).toBe("Vehicle Class");
      expect(formatCategoryLabel("property_type")).toBe("Property Type");
    });

    it("formats all toggle area values", () => {
      expect(formatAreaLabel("partner_app")).toBe("Partner App");
      expect(formatAreaLabel("admin_dashboard")).toBe("Admin Dashboard");
      expect(formatAreaLabel("api")).toBe("API");
      expect(formatAreaLabel("global")).toBe("Global");
    });

    it("formats region type values", () => {
      expect(formatRegionTypeLabel("country")).toBe("Country");
      expect(formatRegionTypeLabel("city")).toBe("City");
      expect(formatRegionTypeLabel("service_area")).toBe("Service Area");
    });

    it("formats template kind and scope values", () => {
      expect(formatTemplateKindLabel("rejection")).toBe("Rejection");
      expect(formatTemplateKindLabel("send_back")).toBe("Send Back");
      expect(formatTemplateKindLabel("request_docs")).toBe("Request Documents");
      expect(formatTemplateScopeLabel("listing")).toBe("Listing");
      expect(formatTemplateScopeLabel("verification")).toBe("Verification");
    });

    it("formats content kind values", () => {
      expect(formatContentKindLabel("terms")).toBe("Terms of Service");
      expect(formatContentKindLabel("policy")).toBe("Policy");
      expect(formatContentKindLabel("help_doc")).toBe("Help Document");
      expect(formatContentKindLabel("announcement")).toBe("Announcement");
    });
  });

  describe("statusTone", () => {
    it("maps active, enabled, published to success", () => {
      expect(statusTone("active")).toBe("success");
      expect(statusTone("enabled")).toBe("success");
      expect(statusTone("published")).toBe("success");
    });

    it("maps draft and staged to warning", () => {
      expect(statusTone("draft")).toBe("warning");
      expect(statusTone("staged")).toBe("warning");
    });

    it("maps deprecated, disabled, archived to danger", () => {
      expect(statusTone("deprecated")).toBe("danger");
      expect(statusTone("disabled")).toBe("danger");
      expect(statusTone("archived")).toBe("danger");
    });
  });
});
