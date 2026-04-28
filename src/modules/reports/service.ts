import {
  buildReportCsvPreviewRows,
  buildReportExportFileName,
  getReportSectionLabel,
  validateReportExportPayload,
} from "@/modules/reports/rules";
import type {
  ReportExportPayload,
  ReportExportResult,
  ReportExportRecord,
  ReportSnapshot,
} from "@/modules/reports/types";

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

type ReportsExportEnvelope = {
  data?: {
    exportRecord?: ReportExportRecord;
    auditRecord?: ReportExportResult["auditRecord"];
  };
  message?: string;
  error?: { message?: string };
};

export async function fetchReportsSnapshot(region: string, timeframe: string): Promise<{ snapshot: ReportSnapshot; exports: ReportExportRecord[] }> {
  const response = await fetch(`/api/backend/reports?region=${encodeURIComponent(region)}&timeframe=${encodeURIComponent(timeframe)}`, {
    method: "GET",
    cache: "no-store",
  });
  const body = await response.json().catch(() => null) as { data?: { snapshot?: ReportSnapshot; exports?: ReportExportRecord[] } | null; message?: string; error?: { message?: string } } | null;
  if (!response.ok || !body?.data?.snapshot || !body.data.exports) {
    throw new Error(body?.message ?? body?.error?.message ?? "Unable to load reports.");
  }
  return {
    snapshot: body.data.snapshot,
    exports: body.data.exports,
  };
}

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

export const realReportsRepository: ReportsRepository = {
  async exportReport(exports, payload) {
    const validationError = validateReportExportPayload(payload);
    if (validationError) {
      throw new Error(validationError);
    }

    const response = await fetch("/api/backend/reports/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        actor: payload.actor,
        action: payload.action,
        region: payload.region,
        timeframe: payload.timeframe,
        includedSections: payload.includedSections,
      }),
    });
    const body = (await response.json().catch(() => null)) as ReportsExportEnvelope | null;
    if (!response.ok || !body?.data?.exportRecord || !body.data.auditRecord) {
      throw new Error(body?.message ?? body?.error?.message ?? "Unable to export report.");
    }

    const exportRecord = body.data.exportRecord;
    const auditRecord = body.data.auditRecord;
    return {
      exports: [exportRecord, ...exports.filter((item) => item.id !== exportRecord.id)],
      exportRecord,
      auditRecord,
    };
  },
};
