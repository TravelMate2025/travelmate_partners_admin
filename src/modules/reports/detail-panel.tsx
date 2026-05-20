import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import { getReportSectionLabel } from "@/modules/reports/rules";
import type { ReportBreakdownEntry, ReportMetricKey, ReportSnapshot, ReportsRegion, ReportsTimeframe } from "@/modules/reports/types";

function regionLabel(region: ReportsRegion) {
  if (region === "all") return "All regions";
  if (region === "west_africa") return "West Africa";
  if (region === "east_africa") return "East Africa";
  return "Southern Africa";
}

function timeframeLabel(timeframe: ReportsTimeframe) {
  if (timeframe === "7d") return "Last 7 days";
  if (timeframe === "30d") return "Last 30 days";
  return "Last 90 days";
}

function BreakdownSection({ title, entries }: { title: string; entries: ReportBreakdownEntry[] }) {
  return (
    <div className="tm-soft-band">
      <p className="tm-label">{title}</p>
      <div className="mt-4 grid gap-3">
        {entries.map((entry) => (
          <article className="tm-document-meta" key={entry.id}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">{entry.label}</p>
              <StatusBadge label={entry.value} tone="neutral" />
            </div>
            <p className="tm-muted mt-2 text-sm">{entry.note}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function ReportsDetailPanel({
  snapshot,
  region,
  timeframe,
  selectedSections,
  feedback,
  exportHistory,
  pendingExport,
  onRegionChange,
  onTimeframeChange,
  onSectionToggle,
  onExport,
}: {
  snapshot: ReportSnapshot | null;
  region: ReportsRegion;
  timeframe: ReportsTimeframe;
  selectedSections: ReportMetricKey[];
  feedback: { tone: "success" | "error"; message: string } | null;
  exportHistory: Array<{
    id: string;
    fileName: string;
    exportedAt: string;
    actor: string;
    contextSummary: string;
    sectionLabels: string[];
  }>;
  pendingExport: boolean;
  onRegionChange: (value: ReportsRegion) => void;
  onTimeframeChange: (value: ReportsTimeframe) => void;
  onSectionToggle: (section: ReportMetricKey) => void;
  onExport: () => void;
}) {
  if (!snapshot) {
    return (
      <article className="tm-panel min-w-0 h-fit">
        <SurfaceState description="Reporting data is unavailable for the selected filters." title="Report snapshot unavailable" tone="exception" />
      </article>
    );
  }

  return (
    <article className="tm-panel min-w-0 h-fit">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">Report Detail</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Filter and export analytics</h2>
          <p className="tm-muted mt-2 text-sm">{snapshot.narrative}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={regionLabel(region)} tone="info" />
          <StatusBadge label={timeframeLabel(timeframe)} tone="neutral" />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="tm-label">Region</span>
          <select aria-label="Report region" className="tm-input mt-3" onChange={(event) => onRegionChange(event.target.value as ReportsRegion)} value={region}>
            <option value="all">all regions</option>
            <option value="west_africa">west africa</option>
            <option value="east_africa">east africa</option>
            <option value="southern_africa">southern africa</option>
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Timeframe</span>
          <select aria-label="Report timeframe" className="tm-input mt-3" onChange={(event) => onTimeframeChange(event.target.value as ReportsTimeframe)} value={timeframe}>
            <option value="7d">last 7 days</option>
            <option value="30d">last 30 days</option>
            <option value="90d">last 90 days</option>
          </select>
        </label>
      </div>

      <div className="tm-soft-band mt-5">
        <p className="tm-label">Export sections</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {(["partner_growth", "verification_funnel", "listing_conversion", "supply_mix", "api_adoption", "booking_activity"] as ReportMetricKey[]).map((section) => (
            <label className="inline-flex items-center gap-2 text-sm text-slate-900" key={section}>
              <input checked={selectedSections.includes(section)} onChange={() => onSectionToggle(section)} type="checkbox" />
              <span>{getReportSectionLabel(section)}</span>
            </label>
          ))}
        </div>
        {feedback ? <div className={`mt-4 tm-alert ${feedback.tone === "error" ? "tm-alert-danger" : "tm-alert-success"}`}>{feedback.message}</div> : null}
        <div className="mt-5">
          <button className="tm-btn tm-btn-primary" disabled={pendingExport} onClick={onExport} type="button">
            {pendingExport ? "Exporting..." : "Export report"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <BreakdownSection entries={snapshot.partnerGrowth} title="Partner growth" />
        <BreakdownSection entries={snapshot.verificationFunnel} title="Verification funnel" />
        <BreakdownSection entries={snapshot.listingConversion} title="Listing conversion" />
        <BreakdownSection entries={snapshot.supplyMix} title="Supply mix" />
        <BreakdownSection entries={snapshot.apiAdoption} title="API adoption" />
        <BreakdownSection entries={snapshot.bookingActivity} title="Booking activity" />
      </div>

      <div className="mt-5">
        <p className="tm-kicker">Export History</p>
        <div className="mt-4 grid gap-3">
          {exportHistory.map((entry) => (
            <article className="tm-soft-band" key={entry.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{entry.fileName}</p>
                  <p className="tm-muted mt-1 text-sm">{entry.actor}</p>
                  <p className="tm-muted mt-1 text-sm">{entry.contextSummary}</p>
                  <p className="tm-muted mt-1 text-sm">Sections: {entry.sectionLabels.join(", ")}</p>
                </div>
                <StatusBadge label={entry.exportedAt} tone="neutral" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </article>
  );
}
