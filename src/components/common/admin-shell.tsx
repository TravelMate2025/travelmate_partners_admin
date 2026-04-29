"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { showAdminToast } from "@/components/common/admin-toast";
import { StatusBadge } from "@/components/common/status-badge";
import { signOutAction } from "@/modules/auth/actions";
import { useAdminSession } from "@/modules/auth/admin-session-context";
import {
  extractNotificationRecords,
  getNewNotificationRecords,
  readSeenNotificationIds,
  writeSeenNotificationIds,
} from "@/modules/notifications/alert-rail";
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
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [unreadAlertsHref, setUnreadAlertsHref] = useState<string | null>(null);
  const [alertsInitialized, setAlertsInitialized] = useState(false);
  const announcedIds = useRef<Set<string>>(new Set());
  const session = useAdminSession();
  const roleLabel = session?.user.role.replace("_", " ") ?? "guest";
  const navItems = getRoleAwareAdminNavItems(session?.user.role ?? null);
  const notificationsHref = useMemo(
    () => navItems.find((item) => item.href === "/notifications")?.destinationHref ?? "/notifications",
    [navItems],
  );

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function pollAdminNotifications() {
      try {
        const response = await fetch("/api/backend/notifications", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json().catch(() => null)) as unknown;
        if (!active) {
          return;
        }

        const records = extractNotificationRecords(payload);
        let seenIds = readSeenNotificationIds();
        if (pathname.startsWith("/notifications")) {
          seenIds = new Set(records.map((record) => record.id));
          writeSeenNotificationIds(seenIds);
        }
        const unseen = records.filter((record) => !seenIds.has(record.id));
        setUnreadAlertsCount(unseen.length);
        const prioritizedDestination =
          unseen.find((record) => typeof record.routing?.href === "string" && record.routing.href.length > 0)?.routing?.href ?? null;
        setUnreadAlertsHref(prioritizedDestination);

        if (!alertsInitialized) {
          announcedIds.current = new Set(records.map((record) => record.id));
          setAlertsInitialized(true);
          return;
        }

        const newlyArrived = getNewNotificationRecords(records, seenIds).filter(
          (record) => !announcedIds.current.has(record.id),
        );
        if (newlyArrived.length > 0) {
          for (const record of [...newlyArrived].reverse()) {
            showAdminToast({
              kind: "info",
              message: `New admin notification: ${record.title}`,
            });
            announcedIds.current.add(record.id);
          }
        }
      } catch {
        // Notification rail should not block the shell.
      }
    }

    if (session) {
      void pollAdminNotifications();
      timer = setInterval(() => {
        void pollAdminNotifications();
      }, 15000);
    }

    return () => {
      active = false;
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [alertsInitialized, pathname, session]);

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
                              <span className="flex items-center gap-2 font-semibold">
                                <span>{item.label}</span>
                                {item.href === "/notifications" && unreadAlertsCount > 0 ? (
                                  <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                                    {unreadAlertsCount}
                                  </span>
                                ) : null}
                              </span>
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
              {unreadAlertsCount > 0 ? (
                <Link className="tm-btn tm-btn-outline" href={unreadAlertsHref ?? notificationsHref}>
                  Alerts ({unreadAlertsCount})
                </Link>
              ) : null}
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
