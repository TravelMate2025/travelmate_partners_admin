import {
  buildCatalogDashboardSnapshot,
  canApplyCatalogAction,
  getCatalogControlsPolicy,
} from "@/modules/catalog-controls/rules";
import { getCatalogIssueRecords } from "@/modules/catalog-controls/data";

describe("catalog controls rules", () => {
  it("builds dashboard counts from flagged inventory", () => {
    const snapshot = buildCatalogDashboardSnapshot(getCatalogIssueRecords());

    expect(snapshot.openIssues).toBe(4);
    expect(snapshot.criticalIssues).toBe(1);
    expect(snapshot.taxonomyGaps).toBe(1);
    expect(snapshot.geoMismatches).toBe(1);
  });

  it("restricts taxonomy standardization to operations and super admin", () => {
    const taxonomyIssue = getCatalogIssueRecords().find((record) => record.issueType === "taxonomy");

    expect(taxonomyIssue).toBeDefined();
    expect(getCatalogControlsPolicy("operations").canStandardizeTaxonomy).toBe(true);
    expect(getCatalogControlsPolicy("reviewer").canStandardizeTaxonomy).toBe(false);
    expect(canApplyCatalogAction("operations", taxonomyIssue!, "standardize_taxonomy")).toBe(true);
    expect(canApplyCatalogAction("reviewer", taxonomyIssue!, "standardize_taxonomy")).toBe(false);
  });
});
