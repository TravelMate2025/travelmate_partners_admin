import { formatDashboardMetric, getDashboardModel } from "@/modules/dashboard/data";

describe("dashboard data model", () => {
  it("formats dashboard metrics for compact KPI display", () => {
    expect(formatDashboardMetric(128)).toBe("128");
    expect(formatDashboardMetric(1200)).toBe("1.2K");
  });

  it("exposes finance queues for finance roles", () => {
    const dashboard = getDashboardModel("finance");
    expect(dashboard.queues.some((queue) => queue.href === "/financial-ops")).toBe(true);
    expect(dashboard.queues.every((queue) => ["finance", "super_admin"].includes(queue.roles[0]) || queue.roles.includes("finance"))).toBe(true);
  });

  it("keeps finance-only queues out of reviewer dashboards", () => {
    const dashboard = getDashboardModel("reviewer");
    expect(dashboard.queues.some((queue) => queue.href === "/financial-ops")).toBe(false);
    expect(dashboard.activities.some((activity) => activity.href === "/verification-review")).toBe(true);
  });
});
