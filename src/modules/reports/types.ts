export type ReportsRegion = "all" | "west_africa" | "east_africa" | "southern_africa";
export type ReportsTimeframe = "7d" | "30d" | "90d";
export type ReportAction = "export_report";
export type ReportMetricKey =
  | "partner_growth"
  | "verification_funnel"
  | "listing_conversion"
  | "supply_mix"
  | "api_adoption";

export type ReportMetric = {
  key: ReportMetricKey;
  label: string;
  value: string;
  note: string;
  accent: string;
  badge?: {
    label: string;
    tone?: "neutral" | "info" | "warning" | "success" | "danger";
  };
};

export type ReportBreakdownEntry = {
  id: string;
  label: string;
  value: string;
  note: string;
};

export type ReportSnapshot = {
  id: string;
  title: string;
  subtitle: string;
  region: ReportsRegion;
  timeframe: ReportsTimeframe;
  metrics: ReportMetric[];
  partnerGrowth: ReportBreakdownEntry[];
  verificationFunnel: ReportBreakdownEntry[];
  listingConversion: ReportBreakdownEntry[];
  supplyMix: ReportBreakdownEntry[];
  apiAdoption: ReportBreakdownEntry[];
  narrative: string;
};

export type ReportsFilterState = {
  region: ReportsRegion;
  timeframe: ReportsTimeframe;
};

export type ReportExportRecord = {
  id: string;
  actor: string;
  region: ReportsRegion;
  timeframe: ReportsTimeframe;
  fileName: string;
  exportedAt: string;
  includedSections: ReportMetricKey[];
  sectionLabels: string[];
  contextSummary: string;
  csvPreviewRows: string[];
};

export type ReportsAuditRecord = {
  eventId: string;
  actor: string;
  action: ReportAction;
  summary: string;
  status: "queued_for_backend";
  region: ReportsRegion;
  timeframe: ReportsTimeframe;
  includedSections: ReportMetricKey[];
  sectionLabels: string[];
  fileName: string;
};

export type ReportsSurfaceState =
  | {
      status: "loading" | "error" | "exception";
      title: string;
      description: string;
    }
  | undefined;

export type ReportExportPayload = {
  actor: string;
  action: "export_report";
  region: ReportsRegion;
  timeframe: ReportsTimeframe;
  includedSections: ReportMetricKey[];
  snapshot: ReportSnapshot;
};

export type ReportExportResult = {
  exports: ReportExportRecord[];
  exportRecord: ReportExportRecord;
  auditRecord: ReportsAuditRecord;
};
