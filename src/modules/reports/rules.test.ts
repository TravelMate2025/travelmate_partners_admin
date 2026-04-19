import { getReportSnapshot } from "@/modules/reports/data";
import { buildReportCsvPreviewRows, buildReportExportFileName, flattenReportSection, validateReportExportPayload } from "@/modules/reports/rules";

describe("reports rules", () => {
  it("aggregates report snapshots from explicit source windows", () => {
    const regionalSnapshot = getReportSnapshot("east_africa", "90d");
    const allRegionsSnapshot = getReportSnapshot("all", "90d");

    expect(regionalSnapshot.partnerGrowth[0]?.value).toBe("287");
    expect(regionalSnapshot.apiAdoption[0]?.value).toBe("17");
    expect(allRegionsSnapshot.partnerGrowth[0]?.value).toBe("887");
    expect(allRegionsSnapshot.verificationFunnel[0]?.value).toBe("305");
  });

  it("validates export payloads", () => {
    expect(
      validateReportExportPayload({
        actor: "Amina Bello",
        action: "export_report",
        region: "all",
        timeframe: "30d",
        includedSections: ["partner_growth"],
      }),
    ).toBeNull();

    expect(
      validateReportExportPayload({
        actor: "Amina Bello",
        action: "export_report",
        region: "all",
        timeframe: "30d",
        includedSections: [],
      }),
    ).toBe("Select at least one report section before exporting.");
  });

  it("builds export transforms", () => {
    expect(buildReportExportFileName("east_africa", "90d")).toBe("travelmate-report-east_africa-90d.csv");
    expect(
      flattenReportSection("partner_growth", [{ id: "1", label: "Verified partners", value: "120", note: "Partners in verified lifecycle." }]),
    ).toEqual(["partner_growth,Verified partners,120,Partners in verified lifecycle."]);
  });

  it("builds csv preview rows from the selected snapshot sections", () => {
    const snapshot = getReportSnapshot("east_africa", "90d");
    const rows = buildReportCsvPreviewRows(snapshot, ["partner_growth", "api_adoption"]);

    expect(rows[0]).toBe("section,label,value,note");
    expect(rows).toContain("partner_growth,Verified partners,287,Partners in a verified lifecycle state.");
    expect(rows).toContain("api_adoption,Approved API clients,17,Partners with active API adoption.");
  });
});
