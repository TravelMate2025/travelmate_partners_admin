import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import type { CatalogAction, CatalogIssueRecord, TaxonomyRuleRecord } from "@/modules/catalog-controls/types";

type IssueResolutionAction = Exclude<CatalogAction, "update_taxonomy_rule">;

function toneForStatus(status: CatalogIssueRecord["status"]) {
  if (status === "resolved") return "success" as const;
  if (status === "in_review") return "warning" as const;
  return "danger" as const;
}

export function CatalogControlsDetailPanel({
  selectedRecord,
  note,
  pendingAction,
  feedback,
  ruleFeedback,
  allowedActions,
  policySummary,
  ruleDraft,
  selectedRuleId,
  taxonomyRules,
  canManageTaxonomyRules,
  onNoteChange,
  onAction,
  onRuleDraftChange,
  onSelectRule,
  onSaveRule,
  onResetSelection,
}: {
  selectedRecord: CatalogIssueRecord | null;
  note: string;
  pendingAction: CatalogAction | null;
  feedback: { tone: "success" | "error"; message: string } | null;
  ruleFeedback: { tone: "success" | "error"; message: string } | null;
  allowedActions: Record<IssueResolutionAction, boolean> | null;
  policySummary: string;
  ruleDraft: string;
  selectedRuleId: string;
  taxonomyRules: TaxonomyRuleRecord[];
  canManageTaxonomyRules: boolean;
  onNoteChange: (value: string) => void;
  onAction: (action: CatalogAction) => void;
  onRuleDraftChange: (value: string) => void;
  onSelectRule: (ruleId: string) => void;
  onSaveRule: () => void;
  onResetSelection: () => void;
}) {
  if (!selectedRecord) {
    return (
      <article className="tm-panel min-w-0 h-fit">
        <SurfaceState
          actionLabel="Reset quality selection"
          description="The selected catalog issue is no longer available in the current queue snapshot."
          onAction={onResetSelection}
          title="Selected catalog issue was not found"
          tone="exception"
        />
      </article>
    );
  }

  return (
    <article className="tm-panel min-w-0 h-fit">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">Issue Detail</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{selectedRecord.listingTitle}</h2>
          <p className="tm-muted mt-2 text-sm">
            {selectedRecord.kind} · {selectedRecord.businessName} · {selectedRecord.locationLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={selectedRecord.issueType} tone="info" />
          <StatusBadge label={selectedRecord.status} tone={toneForStatus(selectedRecord.status)} />
          <StatusBadge label={`${selectedRecord.completenessScore}% complete`} tone="neutral" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="tm-soft-band">
          <p className="tm-label">Quality summary</p>
          <p className="mt-3 text-sm text-slate-900">{selectedRecord.summary}</p>
          <ul className="tm-bullet-list mt-4">
            {selectedRecord.missingRequiredFields.map((item) => (
              <li key={item}>Missing field: {item}</li>
            ))}
            {selectedRecord.duplicateWarnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
            {selectedRecord.policyFlags.map((item) => (
              <li key={item}>{item}</li>
            ))}
            <li>{selectedRecord.geoCheck.summary}</li>
          </ul>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Taxonomy and geo guidance</p>
          <div className="mt-4 grid gap-3">
            {selectedRecord.taxonomySuggestions.map((suggestion) => (
              <div className="tm-document-meta" key={`${suggestion.field}-${suggestion.suggestedValue}`}>
                <p className="text-sm font-semibold text-slate-950">{suggestion.field}</p>
                <p className="tm-muted mt-2 text-sm">
                  {suggestion.currentValue} {"->"} {suggestion.suggestedValue}
                </p>
                <p className="tm-muted mt-2 text-sm">{suggestion.reason}</p>
              </div>
            ))}
            {selectedRecord.taxonomySuggestions.length === 0 ? (
              <div className="tm-document-meta">
                <p className="text-sm font-semibold text-slate-950">No taxonomy changes pending</p>
                <p className="tm-muted mt-2 text-sm">Current issue resolution does not require taxonomy normalization.</p>
              </div>
            ) : null}
            {selectedRecord.geoCheck.suggestedCity || selectedRecord.geoCheck.suggestedCountry ? (
              <div className="tm-document-meta">
                <p className="text-sm font-semibold text-slate-950">Suggested geo correction</p>
                <p className="tm-muted mt-2 text-sm">
                  {[selectedRecord.geoCheck.suggestedCity, selectedRecord.geoCheck.suggestedCountry]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="tm-soft-band mt-5">
        <p className="tm-label">Operator action</p>
        <p className="tm-muted mt-2 text-sm">{policySummary}</p>
        <label className="block mt-4">
          <span className="tm-label">Resolution note</span>
          <textarea
            className="tm-textarea mt-3"
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Capture the correction, taxonomy change, or suspicious-listing resolution..."
            value={note}
          />
        </label>
        {selectedRecord.latestAuditRecord ? (
          <div className="tm-alert tm-alert-success mt-4">
            Audit prep: {selectedRecord.latestAuditRecord.summary} Event is{" "}
            {selectedRecord.latestAuditRecord.status.replaceAll("_", " ")}.
          </div>
        ) : null}
        {feedback ? <div className={`mt-4 tm-alert ${feedback.tone === "error" ? "tm-alert-danger" : "tm-alert-success"}`}>{feedback.message}</div> : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className="tm-btn tm-btn-primary"
            disabled={pendingAction !== null || !allowedActions?.standardize_taxonomy}
            onClick={() => onAction("standardize_taxonomy")}
            type="button"
          >
            {pendingAction === "standardize_taxonomy" ? "Standardizing..." : "Standardize taxonomy"}
          </button>
          <button
            className="tm-btn tm-btn-outline"
            disabled={pendingAction !== null || !allowedActions?.resolve_duplicate}
            onClick={() => onAction("resolve_duplicate")}
            type="button"
          >
            {pendingAction === "resolve_duplicate" ? "Resolving..." : "Resolve duplicate"}
          </button>
          <button
            className="tm-btn tm-btn-outline"
            disabled={pendingAction !== null || !allowedActions?.resolve_geo}
            onClick={() => onAction("resolve_geo")}
            type="button"
          >
            {pendingAction === "resolve_geo" ? "Resolving..." : "Resolve geo mismatch"}
          </button>
          <button
            className="tm-btn tm-btn-outline"
            disabled={pendingAction !== null || !allowedActions?.resolve_policy}
            onClick={() => onAction("resolve_policy")}
            type="button"
          >
            {pendingAction === "resolve_policy" ? "Resolving..." : "Resolve policy exception"}
          </button>
        </div>
      </div>

      <div className="mt-5">
        <div className="tm-soft-band mb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="tm-label">Taxonomy rule management</p>
              <p className="tm-muted mt-2 text-sm">
                Standardize shared taxonomy mappings that feed catalog controls and partner-side quality guidance.
              </p>
            </div>
            <StatusBadge label={canManageTaxonomyRules ? "rule edit enabled" : "read only"} tone={canManageTaxonomyRules ? "info" : "neutral"} />
          </div>
          <div className="mt-4 grid gap-3">
            {taxonomyRules.map((rule) => (
              <button
                className={`tm-document-card text-left ${rule.id === selectedRuleId ? "tm-document-card-active" : ""}`}
                key={rule.id}
                onClick={() => onSelectRule(rule.id)}
                type="button"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{rule.field}</p>
                    <p className="tm-muted mt-2 text-sm">
                      {rule.currentValue} {"->"} {rule.normalizedValue}
                    </p>
                  </div>
                  <StatusBadge label={`${rule.usageCount} uses`} tone="neutral" />
                </div>
              </button>
            ))}
          </div>
          <label className="block mt-4">
            <span className="tm-label">Normalized value</span>
            <input
              className="tm-input mt-3"
              disabled={!canManageTaxonomyRules}
              onChange={(event) => onRuleDraftChange(event.target.value)}
              value={ruleDraft}
            />
          </label>
          {ruleFeedback ? <div className={`mt-4 tm-alert ${ruleFeedback.tone === "error" ? "tm-alert-danger" : "tm-alert-success"}`}>{ruleFeedback.message}</div> : null}
          <div className="mt-4">
            <button className="tm-btn tm-btn-outline" disabled={!canManageTaxonomyRules} onClick={onSaveRule} type="button">
              Save taxonomy rule
            </button>
          </div>
        </div>

        <div>
        <p className="tm-kicker">Issue history</p>
        <div className="mt-4 grid gap-3">
          {selectedRecord.history.map((entry) => (
            <article className="tm-soft-band" key={entry.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{entry.action}</p>
                  <p className="tm-muted mt-1 text-sm">{entry.note}</p>
                </div>
                <StatusBadge label={entry.timestamp} tone="neutral" />
              </div>
              <p className="tm-muted mt-2 text-sm">{entry.actor}</p>
            </article>
          ))}
        </div>
        </div>
      </div>
    </article>
  );
}
