import { getApiMonitoringRecords } from "@/modules/api-monitoring/data";
import {
  buildApiMonitoringDashboard,
  canApplyApiGovernanceAction,
  detectApiMonitoringTags,
  getApiMonitoringPolicy,
} from "@/modules/api-monitoring/rules";

describe("api monitoring rules", () => {
  it("allows operations to queue containment for active abuse signals", () => {
    const record = getApiMonitoringRecords().find((item) => item.id === "api-anomaly-002");

    expect(record).toBeDefined();
    expect(getApiMonitoringPolicy("operations").canQueueContainment).toBe(true);
    expect(canApplyApiGovernanceAction("operations", record!, "queue_client_containment")).toBe(true);
  });

  it("limits finance to read-only monitoring visibility", () => {
    const record = getApiMonitoringRecords()[0];

    expect(getApiMonitoringPolicy("finance").canOpenIncident).toBe(false);
    expect(canApplyApiGovernanceAction("finance", record, "open_incident")).toBe(false);
  });

  it("builds dashboard and anomaly recommendation tags", () => {
    const records = getApiMonitoringRecords();
    const dashboard = buildApiMonitoringDashboard(records);
    const tags = detectApiMonitoringTags(records[1]!);

    expect(dashboard.criticalAlerts).toBeGreaterThan(0);
    expect(tags.needsIncident).toBe(true);
    expect(tags.needsContainment).toBe(true);
    expect(tags.endpointRisk).toBe(true);
  });
});
