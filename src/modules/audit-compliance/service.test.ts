import { getAuditLogEntries } from "@/modules/audit-compliance/data";
import { matchesAuditFilter } from "@/modules/audit-compliance/rules";
import { mockAuditComplianceRepository } from "@/modules/audit-compliance/service";
import type { AuditFilterState } from "@/modules/audit-compliance/types";

const emptyFilter: AuditFilterState = {
  query: "",
  category: "all",
  riskLevel: "all",
  outcome: "all",
  entityType: "all",
};

describe("audit compliance service", () => {
  it("exports filtered entries and builds a compliance export record", async () => {
    const allEntries = getAuditLogEntries();
    const filter: AuditFilterState = { ...emptyFilter, category: "financial" };
    const filteredEntries = allEntries.filter((e) => matchesAuditFilter(e, filter, "super_admin"));

    const result = await mockAuditComplianceRepository.applyExport(
      filteredEntries,
      {
        actor: "Kwame Asante",
        filter,
        note: "Exporting financial audit entries for Q1 internal compliance review.",
      },
      "super_admin",
    );

    expect(result.exportRecord.action).toBe("export_compliance_data");
    expect(result.exportRecord.actor).toBe("Kwame Asante");
    expect(result.exportRecord.exportedEntryCount).toBe(filteredEntries.length);
    expect(result.exportRecord.category).toBe("financial");
    expect(result.exportRecord.fileName).toMatch(/travelmate-audit-export-.*-financial\.csv/);
    expect(result.exportRecord.status).toBe("queued_for_backend");
    expect(result.exportRecord.summary).toMatch(/Kwame Asante exported/i);
    expect(result.exportRecord.summary).toMatch(/financial category/i);
  });

  it("exports all entries when category filter is all", async () => {
    const allEntries = getAuditLogEntries();

    const result = await mockAuditComplianceRepository.applyExport(
      allEntries,
      {
        actor: "Amara Nwosu",
        filter: emptyFilter,
        note: "Full platform audit export for annual compliance submission.",
      },
      "operations",
    );

    expect(result.exportRecord.exportedEntryCount).toBe(allEntries.length);
    expect(result.exportRecord.fileName).toMatch(/travelmate-audit-export-.*\.csv/);
    expect(result.exportRecord.fileName).not.toContain("all");
    expect(result.exportRecord.summary).toMatch(/full audit log/i);
  });

  it("throws when a restricted role attempts to export", async () => {
    const entries = getAuditLogEntries();
    await expect(
      mockAuditComplianceRepository.applyExport(
        entries,
        {
          actor: "Priya Sharma",
          filter: emptyFilter,
          note: "Attempting export from reviewer role.",
        },
        "reviewer",
      ),
    ).rejects.toThrow(/cannot export/i);
  });

  it("throws when the audit note is too short", async () => {
    const entries = getAuditLogEntries();
    await expect(
      mockAuditComplianceRepository.applyExport(
        entries,
        {
          actor: "Kwame Asante",
          filter: emptyFilter,
          note: "too short",
        },
        "super_admin",
      ),
    ).rejects.toThrow(/audit note/i);
  });

  it("includes entry count of zero when no entries match the filter", async () => {
    const result = await mockAuditComplianceRepository.applyExport(
      [],
      {
        actor: "Tunde Adebayo",
        filter: emptyFilter,
        note: "Exporting empty filtered set for gap analysis reporting.",
      },
      "finance",
    );

    expect(result.exportRecord.exportedEntryCount).toBe(0);
    expect(result.exportRecord.summary).toMatch(/0 audit entries/i);
  });
});
