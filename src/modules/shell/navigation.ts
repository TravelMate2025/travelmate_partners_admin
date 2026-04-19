export type AdminNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  section: "core" | "operations" | "finance" | "governance";
  description: string;
};

export const adminNavItems: AdminNavItem[] = [
  {
    href: "/",
    label: "Operations Overview",
    shortLabel: "Overview",
    section: "core",
    description: "Pulse on approvals, queues, alerts, and recent platform movement.",
  },
  {
    href: "/auth/login",
    label: "Admin Access",
    shortLabel: "Access",
    section: "core",
    description: "Session entry, role checks, and access scaffolding.",
  },
  {
    href: "/admin-users",
    label: "Admin Users",
    shortLabel: "Admins",
    section: "core",
    description: "Invite admins, govern roles, and review MFA plus session access context.",
  },
  {
    href: "/verification-review",
    label: "Verification Review",
    shortLabel: "Verification",
    section: "operations",
    description: "Review KYC/KYB submissions and apply verification decisions with linked lifecycle controls.",
  },
  {
    href: "/partners",
    label: "Partner Accounts",
    shortLabel: "Partners",
    section: "operations",
    description: "Search, inspect, lock, restore, and supervise partner records.",
  },
  {
    href: "/moderation",
    label: "Listing Moderation",
    shortLabel: "Moderation",
    section: "operations",
    description: "Approve, reject, and correct stays and transfers.",
  },
  {
    href: "/catalog-controls",
    label: "Catalog Controls",
    shortLabel: "Catalog",
    section: "operations",
    description: "Resolve duplicates, standardize taxonomy, and enforce content quality.",
  },
  {
    href: "/api-clients",
    label: "API Clients",
    shortLabel: "Clients",
    section: "governance",
    description: "Approve clients, issue keys, and manage plans.",
  },
  {
    href: "/api-monitoring",
    label: "API Monitoring",
    shortLabel: "Monitoring",
    section: "governance",
    description: "Watch traffic, errors, latency, and usage anomalies.",
  },
  {
    href: "/commercial-controls",
    label: "Commercial Controls",
    shortLabel: "Commercial",
    section: "finance",
    description: "Set commissions, service fees, and manual adjustments.",
  },
  {
    href: "/notifications",
    label: "Partner Messaging",
    shortLabel: "Messaging",
    section: "operations",
    description: "Broadcast operational messages and transactional updates.",
  },
  {
    href: "/reports",
    label: "Reports & Analytics",
    shortLabel: "Reports",
    section: "governance",
    description: "Track growth, supply, conversions, and exports.",
  },
  {
    href: "/audit-compliance",
    label: "Audit & Compliance",
    shortLabel: "Audit",
    section: "governance",
    description: "Inspect critical action trails and export compliance evidence.",
  },
  {
    href: "/system-config",
    label: "System Config",
    shortLabel: "Config",
    section: "governance",
    description: "Manage feature toggles, templates, and platform master data.",
  },
  {
    href: "/support-incidents",
    label: "Support & Incidents",
    shortLabel: "Support",
    section: "operations",
    description: "Track incidents, escalations, and safe diagnostics.",
  },
  {
    href: "/financial-ops",
    label: "Financial Operations",
    shortLabel: "Finance",
    section: "finance",
    description: "Supervise partner settlement states, admin settlement runs, refunds, and reconciliations.",
  },
  {
    href: "/payout-review",
    label: "Payout Review",
    shortLabel: "Payouts",
    section: "finance",
    description: "Review payout methods, masking controls, holds, and payout risk signals.",
  },
];

export const adminShellHighlights = [
  "Global search, role-aware session controls, and alert rail",
  "Reusable queue widgets, status badges, and review-ready tables",
  "Partner-facing statuses stay aligned with the completed partner app",
  "A single shell for every operational, governance, and finance route",
];
