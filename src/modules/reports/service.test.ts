import { getInitialReportExports, getReportSnapshot } from "@/modules/reports/data";
import { mockReportsRepository } from "@/modules/reports/service";

describe("reports service", () => {
  it("exports a report with filter-aware metadata", async () => {
    const result = await mockReportsRepository.exportReport(getInitialReportExports(), {
      actor: "Amina Bello",
      action: "export_report",
      region: "east_africa",
      timeframe: "90d",
      includedSections: ["partner_growth", "api_adoption"],
      snapshot: getReportSnapshot("east_africa", "90d"),
    });

    expect(result.exportRecord.fileName).toBe("travelmate-report-east_africa-90d.csv");
    expect(result.auditRecord.region).toBe("east_africa");
    expect(result.exports[0]?.includedSections).toEqual(["partner_growth", "api_adoption"]);
    expect(result.exportRecord.sectionLabels).toEqual(["Partner growth", "API adoption"]);
    expect(result.auditRecord.sectionLabels).toEqual(["Partner growth", "API adoption"]);
    expect(result.exportRecord.csvPreviewRows[0]).toBe("section,label,value,note");
  });
});
