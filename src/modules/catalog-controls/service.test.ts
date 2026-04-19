import { getCatalogIssueRecords } from "@/modules/catalog-controls/data";
import { mockCatalogControlsRepository } from "@/modules/catalog-controls/service";

describe("mockCatalogControlsRepository", () => {
  it("standardizes taxonomy and prepares audit output", async () => {
    const result = await mockCatalogControlsRepository.applyAction(
      getCatalogIssueRecords(),
      {
        actor: "Operations Admin",
        issueId: "catalog-issue-002",
        action: "standardize_taxonomy",
        note: "Mapped transfer labels to approved taxonomy values.",
      },
      "operations",
    );

    expect(result.updatedRecord.status).toBe("resolved");
    expect(result.updatedRecord.taxonomySuggestions).toHaveLength(0);
    expect(result.auditRecord.status).toBe("queued_for_backend");
  });

  it("rejects policy-resolution attempts for support role", async () => {
    await expect(
      mockCatalogControlsRepository.applyAction(
        getCatalogIssueRecords(),
        {
          actor: "Support Admin",
          issueId: "catalog-issue-004",
          action: "resolve_policy",
          note: "Trying to override policy issue from support queue.",
        },
        "support",
      ),
    ).rejects.toThrow(/not allowed/i);
  });

  it("updates taxonomy rules for operations role", async () => {
    const { getTaxonomyRuleRecords } = await import("@/modules/catalog-controls/data");

    const result = await mockCatalogControlsRepository.updateTaxonomyRule(
      getTaxonomyRuleRecords(),
      {
        actor: "Operations Admin",
        ruleId: "taxonomy-rule-001",
        normalizedValue: "Executive Crossover",
        note: "Refined vehicle class normalization.",
      },
      "operations",
    );

    expect(result.updatedRule.normalizedValue).toBe("Executive Crossover");
    expect(result.auditRecord.status).toBe("queued_for_backend");
  });
});
