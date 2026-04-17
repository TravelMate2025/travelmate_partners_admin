import { ActivityTimeline } from "@/components/common/activity-timeline";
import { AlertBanner } from "@/components/common/alert-banner";
import { AdminShell } from "@/components/common/admin-shell";
import { FilterBar } from "@/components/common/filter-bar";
import { QueueCard } from "@/components/common/queue-card";
import { ReviewDrawer } from "@/components/common/review-drawer";
import { StatCard } from "@/components/common/stat-card";
import { StatusBadge } from "@/components/common/status-badge";
import { getAdminSession } from "@/modules/auth/session";
import { formatDashboardMetric, getDashboardModel } from "@/modules/dashboard/data";
import { adminShellHighlights } from "@/modules/shell/navigation";

export default async function DashboardPage() {
  const session = await getAdminSession();
  const role = session?.user.role ?? "super_admin";
  const dashboard = getDashboardModel(role);

  return (
    <AdminShell
      title="Operations Overview"
      description="Role-aware back-office overview for approvals, moderation, support, finance, and governance queues aligned to the completed partner app."
      headerAside={
        <div className="grid gap-3">
          <div>
            <p className="tm-label">Dashboard phase</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">Flow 2.2 active</p>
          </div>
          <div>
            <p className="tm-label">Current focus</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{dashboard.focusLabel}</p>
            <p className="tm-muted mt-1 text-sm">{dashboard.overviewNote}</p>
          </div>
        </div>
      }
    >
      <section className="grid gap-4 xl:grid-cols-4">
        {dashboard.metrics.map((stat) => (
          <StatCard
            accent={stat.accent}
            badge={stat.badge}
            href={stat.href}
            key={stat.id}
            label={stat.label}
            note={stat.note}
            value={formatDashboardMetric(stat.value)}
          />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="tm-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="tm-kicker">Queue Lens</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Actionable queues</h2>
            </div>
            <StatusBadge label={`Role aware · ${role.replace("_", " ")}`} tone="info" />
          </div>
          <div className="mt-5">
            <FilterBar filters={["Assigned queues", "Verification", "Moderation", "Support", "Finance"]} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {dashboard.queues.map((queue) => (
              <QueueCard
                backlog={queue.backlog}
                href={queue.href}
                key={queue.id}
                owner={queue.owner}
                status={queue.status}
                summary={queue.summary}
                title={queue.title}
                tone={queue.tone}
                urgent={queue.urgent}
              />
            ))}
          </div>

          <div className="mt-6">
            <ReviewDrawer
              subtitle="Previewing the shared review surface used for queue triage, evidence review, and downstream admin decisions."
              title="Queue Decision Drawer"
            >
              <div className="space-y-4">
                <div className="tm-soft-band">
                  <p className="tm-label">Queue summary</p>
                  <p className="mt-2 text-base font-semibold text-slate-950">
                    Verification case with linked lifecycle, payout, and incident context
                  </p>
                  <p className="tm-muted mt-2 text-sm">
                    This reusable drawer primitive gives every dashboard drill-down a consistent place for notes, evidence,
                    queue context, and explicit downstream status impact.
                  </p>
                </div>
                <div className="tm-soft-band">
                  <p className="tm-label">Operator promise</p>
                  <p className="mt-2 text-sm text-slate-900">
                    Fast scan, clear hierarchy, linked back-office context, and audit-friendly actions that stay aligned
                    with partner-facing states.
                  </p>
                </div>
              </div>
            </ReviewDrawer>
          </div>
        </article>

        <article className="tm-panel">
          <p className="tm-kicker">Operational Alerts</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Risk and backlog signals</h2>
          <div className="mt-5 grid gap-4">
            {dashboard.alerts.map((alert) => (
              <AlertBanner detail={alert.detail} href={alert.href} key={alert.id} title={alert.title} tone={alert.tone} />
            ))}
          </div>
          <div className="tm-soft-band mt-5">
            <p className="tm-label">Dashboard principle</p>
            <ul className="tm-bullet-list mt-4">
              {adminShellHighlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="tm-panel">
          <p className="tm-kicker">Recent Activity</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Operational movement</h2>
          <div className="mt-5">
            <ActivityTimeline items={dashboard.activities} />
          </div>
        </article>

        <article className="tm-panel">
          <p className="tm-kicker">Overview Notes</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Why this dashboard exists</h2>
          <p className="tm-muted mt-3 text-sm">
            The admin dashboard is the back office for the completed partner app, so this overview summarizes queues and
            alerts without inventing parallel partner-facing states. Every metric and drill-down is meant to move an
            operator directly into moderation, verification, support, finance, or governance work.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="tm-soft-band">
              <p className="tm-label">Queue coverage</p>
              <p className="mt-2 text-sm text-slate-900">
                Verification, moderation, support, finance, and API governance all surface from one aligned operational
                overview.
              </p>
            </div>
            <div className="tm-soft-band">
              <p className="tm-label">Next modules</p>
              <p className="mt-2 text-sm text-slate-900">
                Verification review, partner operations, moderation, and finance modules can now consume the same queue
                semantics shown on this page.
              </p>
            </div>
          </div>
        </article>
      </section>
    </AdminShell>
  );
}
