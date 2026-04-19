import {
  buildReportCsvPreviewRows,
  buildReportExportFileName,
  getReportSectionLabel,
  validateReportExportPayload,
} from "@/modules/reports/rules";
import type { ReportExportPayload, ReportExportResult, ReportExportRecord } from "@/modules/reports/types";

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

export type ReportsRepository = {
  exportReport(exports: ReportExportRecord[], payload: ReportExportPayload): Promise<ReportExportResult>;
};

export const mockReportsRepository: ReportsRepository = {
  async exportReport(exports, payload) {
    const validationError = validateReportExportPayload(payload);
    if (validationError) {
      throw new Error(validationError);
    }

    const timestamp = new Date().toISOString();
    const sectionLabels = payload.includedSections.map(getReportSectionLabel);
    const exportRecord = {
      id: `report-export-${Date.now()}`,
      actor: payload.actor,
      region: payload.region,
      timeframe: payload.timeframe,
      fileName: buildReportExportFileName(payload.region, payload.timeframe),
      exportedAt: formatTimestamp(timestamp),
      includedSections: payload.includedSections,
      sectionLabels,
      contextSummary: `${payload.snapshot.title} · ${sectionLabels.length} sections`,
      csvPreviewRows: buildReportCsvPreviewRows(payload.snapshot, payload.includedSections),
    };

    const auditRecord = {
      eventId: `reports-audit-${Date.now()}`,
      actor: payload.actor,
      action: "export_report" as const,
      summary: `${payload.actor} exported analytics report ${exportRecord.fileName} with ${sectionLabels.join(", ")}.`,
      status: "queued_for_backend" as const,
      region: payload.region,
      timeframe: payload.timeframe,
      includedSections: payload.includedSections,
      sectionLabels,
      fileName: exportRecord.fileName,
    };

    return {
      exports: [exportRecord, ...exports],
      exportRecord,
      auditRecord,
    };
  },
};
