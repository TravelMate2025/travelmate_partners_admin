"use client";

import { useMemo, useState } from "react";

import { SurfaceState } from "@/components/common/surface-state";
import { ReportsDashboardPanel } from "@/modules/reports/dashboard-panel";
import { getReportSnapshot } from "@/modules/reports/data";
import { ReportsDetailPanel } from "@/modules/reports/detail-panel";
import { mockReportsRepository } from "@/modules/reports/service";
import type {
  ReportExportRecord,
  ReportMetricKey,
  ReportsRegion,
  ReportsSurfaceState,
  ReportsTimeframe,
} from "@/modules/reports/types";

export function ReportsWorkspace({
  actor,
  initialExports,
  surfaceState,
}: {
  actor: string;
  initialExports: ReportExportRecord[];
  surfaceState?: ReportsSurfaceState;
}) {
  const [region, setRegion] = useState<ReportsRegion>("all");
  const [timeframe, setTimeframe] = useState<ReportsTimeframe>("30d");
  const [selectedSections, setSelectedSections] = useState<ReportMetricKey[]>([
    "partner_growth",
    "verification_funnel",
    "listing_conversion",
    "supply_mix",
    "api_adoption",
  ]);
  const [exports, setExports] = useState(initialExports);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [pendingExport, setPendingExport] = useState(false);

  const snapshot = useMemo(() => getReportSnapshot(region, timeframe), [region, timeframe]);

  function toggleSection(section: ReportMetricKey) {
    setSelectedSections((current) =>
      current.includes(section) ? current.filter((item) => item !== section) : [...current, section],
    );
  }

  async function handleExport() {
    setPendingExport(true);
    setFeedback(null);

    try {
      const result = await mockReportsRepository.exportReport(exports, {
        actor,
        action: "export_report",
        region,
        timeframe,
        includedSections: selectedSections,
        snapshot,
      });

      setExports(result.exports);
      setFeedback({ tone: "success", message: result.auditRecord.summary });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to export report.",
      });
    } finally {
      setPendingExport(false);
    }
  }

  if (surfaceState) {
    return (
      <section className="grid gap-5">
        <article className="tm-panel">
          <SurfaceState description={surfaceState.description} title={surfaceState.title} tone={surfaceState.status} />
        </article>
      </section>
    );
  }

  return (
    <section className="grid gap-5">
      <ReportsDashboardPanel snapshot={snapshot} />
      <ReportsDetailPanel
        exportHistory={exports.map((entry) => ({
          id: entry.id,
          fileName: entry.fileName,
          exportedAt: entry.exportedAt,
          actor: entry.actor,
          contextSummary: entry.contextSummary,
          sectionLabels: entry.sectionLabels,
        }))}
        feedback={feedback}
        onExport={() => void handleExport()}
        onRegionChange={setRegion}
        onSectionToggle={toggleSection}
        onTimeframeChange={setTimeframe}
        pendingExport={pendingExport}
        region={region}
        selectedSections={selectedSections}
        snapshot={snapshot}
        timeframe={timeframe}
      />
    </section>
  );
}
