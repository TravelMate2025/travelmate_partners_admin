import { formatDashboardMetric } from "@/modules/dashboard/data";
import type {
  ReportBreakdownEntry,
  ReportExportPayload,
  ReportMetric,
  ReportMetricKey,
  ReportSnapshot,
  ReportsRegion,
  ReportsTimeframe,
} from "@/modules/reports/types";

export function validateReportExportPayload(payload: ReportExportPayload) {
  if (payload.includedSections.length === 0) {
    return "Select at least one report section before exporting.";
  }

  return null;
}

export function formatReportMetric(metric: ReportMetric) {
  const numericValue = Number(metric.value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numericValue) && metric.value === `${numericValue}` ? formatDashboardMetric(numericValue) : metric.value;
}

export function buildReportExportFileName(region: ReportsRegion, timeframe: ReportsTimeframe) {
  return `travelmate-report-${region}-${timeframe}.csv`;
}

export function getReportSectionLabel(section: ReportMetricKey) {
  switch (section) {
    case "partner_growth":
      return "Partner growth";
    case "verification_funnel":
      return "Verification funnel";
    case "listing_conversion":
      return "Listing conversion";
    case "supply_mix":
      return "Supply mix";
    case "api_adoption":
      return "API adoption";
    case "booking_activity":
      return "Booking activity";
  }
}

export function flattenReportSection(section: ReportMetricKey, entries: ReportBreakdownEntry[]) {
  return entries.map((entry) => `${section},${entry.label},${entry.value},${entry.note}`);
}

export function getReportSectionEntries(snapshot: ReportSnapshot, section: ReportMetricKey) {
  switch (section) {
    case "partner_growth":
      return snapshot.partnerGrowth;
    case "verification_funnel":
      return snapshot.verificationFunnel;
    case "listing_conversion":
      return snapshot.listingConversion;
    case "supply_mix":
      return snapshot.supplyMix;
    case "api_adoption":
      return snapshot.apiAdoption;
    case "booking_activity":
      return snapshot.bookingActivity;
  }
}

export function buildReportCsvPreviewRows(snapshot: ReportSnapshot, sections: ReportMetricKey[]) {
  return [
    "section,label,value,note",
    ...sections.flatMap((section) => flattenReportSection(section, getReportSectionEntries(snapshot, section))),
  ];
}
