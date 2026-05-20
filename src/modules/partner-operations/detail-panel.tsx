import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import { getPartnerPolicy } from "@/modules/partner-operations/policy";
import type {
  PartnerAccountState,
  PartnerPriority,
  PartnerRecord,
  SupportTier,
} from "@/modules/partner-operations/types";
import type { AdminRole } from "@/modules/auth/types";

function toneForLifecycle(state: PartnerRecord["lifecycleState"]) {
  if (state === "verified") return "success" as const;
  if (state === "rejected" || state === "suspended") return "danger" as const;
  return "warning" as const;
}

function toneForAccountState(state: PartnerAccountState) {
  if (state === "active") return "success" as const;
  if (state === "locked") return "warning" as const;
  return "neutral" as const;
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPayoutMethod(value: PartnerRecord["payoutSetup"]["payoutMethod"]) {
  return value === "mobile_money" ? "Mobile money" : "Bank transfer";
}

function formatPayoutSchedule(value: PartnerRecord["payoutSetup"]["payoutSchedule"]) {
  return value === "manual" ? "Manual release" : value === "daily" ? "Daily" : "Weekly";
}

export function PartnerDetailPanel({
  selectedRecord,
  emptyState,
  role,
  note,
  marketOwner,
  supportTier,
  priority,
  feedback,
  pendingAction,
  onNoteChange,
  onMarketOwnerChange,
  onSupportTierChange,
  onPriorityChange,
  onSaveMetadata,
  onAccountAction,
  onResetSelection,
}: {
  selectedRecord: PartnerRecord | null;
  emptyState?: { title: string; description: string } | null;
  role: AdminRole;
  note: string;
  marketOwner: string;
  supportTier: SupportTier;
  priority: PartnerPriority;
  feedback: { tone: "success" | "error"; message: string } | null;
  pendingAction: string | null;
  onNoteChange: (value: string) => void;
  onMarketOwnerChange: (value: string) => void;
  onSupportTierChange: (value: SupportTier) => void;
  onPriorityChange: (value: PartnerPriority) => void;
  onSaveMetadata: () => void;
  onAccountAction: (action: "lock" | "unlock" | "restore") => void;
  onResetSelection: () => void;
}) {
  if (emptyState) {
    return (
      <article className="tm-panel min-w-0 h-fit">
        <SurfaceState description={emptyState.description} title={emptyState.title} tone="empty" />
      </article>
    );
  }

  if (!selectedRecord) {
    return (
      <article className="tm-panel min-w-0 h-fit">
        <SurfaceState
          actionLabel="Reset to first partner"
          description="The selected partner is no longer available in this directory snapshot."
          onAction={onResetSelection}
          title="Selected partner was not found"
          tone="exception"
        />
      </article>
    );
  }

  const policy = getPartnerPolicy(role);

  return (
    <article className="tm-panel min-w-0 h-fit">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">Partner Detail</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{selectedRecord.businessName}</h2>
          <p className="tm-muted mt-2 text-sm">
            {selectedRecord.partnerName} · {selectedRecord.email} · {selectedRecord.phone}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={selectedRecord.lifecycleState} tone={toneForLifecycle(selectedRecord.lifecycleState)} />
          <StatusBadge label={selectedRecord.accountState} tone={toneForAccountState(selectedRecord.accountState)} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="tm-soft-band">
          <p className="tm-label">Portfolio context</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-lg font-semibold text-slate-950">{selectedRecord.portfolio.stays}</p>
              <p className="tm-muted text-sm">Stays</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-950">{selectedRecord.portfolio.transfers}</p>
              <p className="tm-muted text-sm">Transfers</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-950">{selectedRecord.portfolio.liveListings}</p>
              <p className="tm-muted text-sm">Live listings</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-950">{selectedRecord.portfolio.pendingListings}</p>
              <p className="tm-muted text-sm">Pending listings</p>
            </div>
          </div>
        </div>

        <div className="tm-soft-band">
          <p className="tm-label">Partner state</p>
          <p className="mt-3 text-sm text-slate-900">{selectedRecord.operationalNote}</p>
          <p className="tm-muted mt-3 text-sm">
            Joined {formatDate(selectedRecord.joinedAt)} · last active {formatTimestamp(selectedRecord.lastActiveAt)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="tm-soft-band">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="tm-label">Operating coverage</p>
              <p className="tm-muted mt-2 text-sm">
                Structured onboarding coverage from the partner setup flow. Use this to review where supply should actually be discoverable and supported.
              </p>
            </div>
            <StatusBadge label={`${selectedRecord.operatingCoverage.cities.length} cities`} tone="info" />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white/85 p-4">
              <p className="tm-label">Countries</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedRecord.operatingCoverage.countries.map((country) => (
                  <StatusBadge key={country} label={country} tone="neutral" />
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/85 p-4">
              <p className="tm-label">Regions</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedRecord.operatingCoverage.regions.map((region) => (
                  <StatusBadge key={region} label={region} tone="info" />
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/85 p-4">
              <p className="tm-label">Cities</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedRecord.operatingCoverage.cities.map((city) => (
                  <StatusBadge key={city} label={city} tone="success" />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[28px] border border-dashed border-slate-300 bg-slate-50/80 p-4">
            <p className="tm-label">Coverage notes</p>
            <p className="mt-3 text-sm leading-6 text-slate-900">{selectedRecord.operatingCoverage.coverageNotes}</p>
          </div>
        </section>

        <section className="tm-soft-band">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="tm-label">Payout setup</p>
              <p className="tm-muted mt-2 text-sm">
                Payout schedule only controls when available balances are released. Earnings become eligible after the booked service is completed.
              </p>
            </div>
            <StatusBadge label={selectedRecord.payoutSetup.settlementCurrency} tone="warning" />
          </div>

          <div className="mt-4 grid gap-3">
            <div className="rounded-[28px] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">Settlement trigger</p>
              <p className="mt-3 text-lg font-semibold text-slate-950">Eligible after service completion</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Stay earnings unlock after checkout. Transfer earnings unlock after trip completion.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-3xl border border-slate-200 bg-white/85 p-4">
                <p className="tm-label">Payout method</p>
                <p className="mt-3 text-base font-semibold text-slate-950">{formatPayoutMethod(selectedRecord.payoutSetup.payoutMethod)}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white/85 p-4">
                <p className="tm-label">Payout schedule</p>
                <p className="mt-3 text-base font-semibold text-slate-950">{formatPayoutSchedule(selectedRecord.payoutSetup.payoutSchedule)}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="tm-label">Market owner</span>
          <input className="tm-input mt-3" disabled={!policy.canEditMetadata} onChange={(event) => onMarketOwnerChange(event.target.value)} value={marketOwner} />
        </label>
        <label className="block">
          <span className="tm-label">Support tier</span>
          <select className="tm-input mt-3" disabled={!policy.canEditMetadata} onChange={(event) => onSupportTierChange(event.target.value as SupportTier)} value={supportTier}>
            <option value="standard">standard</option>
            <option value="elevated">elevated</option>
            <option value="strategic">strategic</option>
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Priority segment</span>
          <select className="tm-input mt-3" disabled={!policy.canEditMetadata} onChange={(event) => onPriorityChange(event.target.value as PartnerPriority)} value={priority}>
            <option value="standard">standard</option>
            <option value="priority">priority</option>
            <option value="watchlist">watchlist</option>
          </select>
        </label>
      </div>

      <div className="tm-soft-band mt-5">
        <label className="block">
          <span className="tm-label">Operational note</span>
          <textarea
            className="tm-textarea mt-3"
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Capture internal context, support notes, or action rationale..."
            value={note}
          />
        </label>
        {feedback ? <div className={`mt-4 tm-alert ${feedback.tone === "error" ? "tm-alert-danger" : "tm-alert-success"}`}>{feedback.message}</div> : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="tm-btn tm-btn-primary" disabled={!policy.canEditMetadata || pendingAction !== null} onClick={onSaveMetadata} type="button">
            {pendingAction === "update_metadata" ? "Saving..." : "Save metadata"}
          </button>
          <button
            className="tm-btn tm-btn-outline"
            disabled={!policy.canLock || selectedRecord.accountState !== "active" || pendingAction !== null}
            onClick={() => onAccountAction("lock")}
            type="button"
          >
            {pendingAction === "lock" ? "Locking..." : "Lock access"}
          </button>
          <button
            className="tm-btn tm-btn-outline"
            disabled={!policy.canUnlock || selectedRecord.accountState !== "locked" || pendingAction !== null}
            onClick={() => onAccountAction("unlock")}
            type="button"
          >
            {pendingAction === "unlock" ? "Unlocking..." : "Unlock access"}
          </button>
          <button
            className="tm-btn tm-btn-outline"
            disabled={!policy.canRestore || selectedRecord.accountState !== "archived" || pendingAction !== null}
            onClick={() => onAccountAction("restore")}
            type="button"
          >
            {pendingAction === "restore" ? "Restoring..." : "Restore account"}
          </button>
        </div>
      </div>

      <div className="mt-5">
        <p className="tm-kicker">Account History</p>
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
    </article>
  );
}
