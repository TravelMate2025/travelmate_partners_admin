export default function FinancialOpsLoading() {
  return (
    <main className="tm-admin-page">
      <div className="tm-admin-grid">
        <aside className="tm-side-nav">
          <div className="tm-side-brand">
            <p className="tm-kicker">TravelMate</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">Admin Dashboard</h1>
            <p className="tm-muted mt-2 text-sm">Loading financial operations…</p>
          </div>
          <div className="mt-6 space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="h-16 rounded-2xl border border-slate-200 bg-white/60" key={index} />
            ))}
          </div>
        </aside>

        <section className="tm-main-shell">
          <div className="tm-topbar">
            <div>
              <p className="tm-kicker">Flow 2.0</p>
              <h2 className="text-2xl font-semibold text-slate-950">Financial Operations</h2>
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-20 rounded-full bg-slate-200/80" />
              <div className="h-9 w-28 rounded-full bg-slate-200/80" />
            </div>
          </div>

          <div className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="tm-panel min-h-[180px] animate-pulse" />
              <div className="tm-panel min-h-[180px] animate-pulse" />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="tm-panel min-h-[180px] animate-pulse" />
              <div className="tm-panel min-h-[180px] animate-pulse" />
            </div>
            <div className="tm-panel min-h-[420px] animate-pulse" />
          </div>
        </section>
      </div>
    </main>
  );
}
