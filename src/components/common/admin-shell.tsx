"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { StatusBadge } from "@/components/common/status-badge";
import { signOutAction } from "@/modules/auth/actions";
import { useAdminSession } from "@/modules/auth/admin-session-context";
import { getRoleAwareAdminNavItems } from "@/modules/shell/navigation";

type AdminShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  headerAside?: React.ReactNode;
};

const sectionLabels = {
  core: "Core",
  operations: "Operations",
  finance: "Finance",
  governance: "Governance",
} as const;

export function AdminShell({ title, description, children, headerAside }: AdminShellProps) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const session = useAdminSession();
  const roleLabel = session?.user.role.replace("_", " ") ?? "guest";
  const navItems = getRoleAwareAdminNavItems(session?.user.role ?? null);

  return (
    <main className="tm-admin-page">
      <div className="tm-admin-grid">
        <aside className={`tm-side-nav ${navOpen ? "tm-side-nav-open" : ""}`}>
          <div className="tm-side-brand">
            <p className="tm-kicker">TravelMate</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">Admin Dashboard</h1>
            <p className="tm-muted mt-2 text-sm">
              Elegant back-office control for approvals, operations, and finance.
            </p>
          </div>

          <div className="mt-6 space-y-6">
            {(["core", "operations", "finance", "governance"] as const).map((section) => (
              <section key={section}>
                <p className="tm-nav-section">{sectionLabels[section]}</p>
                <ul className="mt-3 space-y-2">
                  {navItems
                    .filter((item) => item.section === section)
                    .map((item) => {
                      const active =
                        item.href === "/"
                          ? pathname === "/"
                          : pathname === item.href || pathname.startsWith(`${item.href}/`);

                      return (
                        <li key={item.href}>
                          <Link
                            aria-label={item.accessible ? item.label : `${item.label} (${item.restrictionNote})`}
                            className={`tm-nav-link ${
                              active ? "tm-nav-link-active" : item.accessible ? "tm-nav-link-idle" : "tm-nav-link-locked"
                            }`}
                            href={item.destinationHref}
                            onClick={() => setNavOpen(false)}
                          >
                            <span className={`tm-nav-short ${item.accessible ? "" : "tm-nav-short-locked"}`}>{item.shortLabel}</span>
                            <span className="tm-nav-copy">
                              <span className="font-semibold">{item.label}</span>
                              <span className="tm-muted block text-xs">{item.description}</span>
                              {!item.accessible && item.restrictionNote ? (
                                <span className="tm-nav-lock-note block text-xs">{item.restrictionNote}</span>
                              ) : null}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                </ul>
              </section>
            ))}
          </div>
        </aside>

        <section className="tm-main-shell">
          <header className="tm-topbar">
            <div className="flex items-center gap-3">
              <button className="tm-nav-toggle" onClick={() => setNavOpen((value) => !value)} type="button">
                Menu
              </button>
              <div>
                <p className="tm-kicker">Flow 2.0</p>
                <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
              </div>
            </div>

            <div className="tm-topbar-tools">
              <input className="tm-input tm-search" placeholder="Search partner, listing, settlement, queue..." />
              {session ? <StatusBadge label={roleLabel} tone="info" /> : <StatusBadge label="guest" tone="neutral" />}
              <StatusBadge label={session?.mfaSatisfied ? "MFA verified" : "MFA pending"} tone={session?.mfaSatisfied ? "success" : "warning"} />
              <Link className="tm-btn tm-btn-outline" href="/auth/sessions">
                Manage session
              </Link>
              <form action={signOutAction}>
                <button className="tm-btn tm-btn-outline" type="submit">
                  Sign out
                </button>
              </form>
            </div>
          </header>

          <section className="tm-overview-hero">
            <div>
              <p className="tm-muted text-sm">Back-office shell established with shared operational primitives.</p>
              <h3 className="mt-2 text-4xl font-semibold text-slate-950">{title}</h3>
              <p className="tm-muted mt-3 max-w-3xl text-sm">{description}</p>
            </div>
            <div className="tm-overview-aside">
              {headerAside ?? (
                <>
                  <div>
                    <p className="tm-label">Role</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {session ? session.user.name : "No active session"}
                    </p>
                    <p className="tm-muted mt-1 text-sm capitalize">{roleLabel.replace("_", " ")} · {session?.user.team ?? "Public route"}</p>
                  </div>
                  <div>
                    <p className="tm-label">Session</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {session ? session.deviceLabel : "No session"}
                    </p>
                    <p className="tm-muted mt-1 text-sm">{session?.mfaSatisfied ? "Protected route access enabled" : "Awaiting MFA validation"}</p>
                  </div>
                </>
              )}
            </div>
          </section>

          <div className="tm-shell-body">{children}</div>
        </section>
      </div>
    </main>
  );
}
