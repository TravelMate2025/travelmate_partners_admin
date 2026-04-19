import { getApiMonitoringRecords } from "@/modules/api-monitoring/data";
import { mockApiMonitoringRepository } from "@/modules/api-monitoring/service";

describe("mockApiMonitoringRepository", () => {
  it("acknowledges open alerts into investigation state", async () => {
    const result = await mockApiMonitoringRepository.applyAction(
      getApiMonitoringRecords(),
      {
        actor: "Operations Admin",
        anomalyId: "api-anomaly-001",
        action: "acknowledge_alert",
        note: "Investigating client polling cadence after latency spike.",
      },
      "operations",
    );

    expect(result.updatedRecord.status).toBe("investigating");
    expect(result.auditRecord.status).toBe("queued_for_backend");
  });

  it("queues containment for abusive anomaly signals", async () => {
    const result = await mockApiMonitoringRepository.applyAction(
      getApiMonitoringRecords(),
      {
        actor: "Operations Admin",
        anomalyId: "api-anomaly-002",
        action: "queue_client_containment",
        note: "Prepare containment handoff due to repeated export threshold breaches.",
      },
      "operations",
    );

    expect(result.updatedRecord.status).toBe("contained");
    expect(result.updatedRecord.history[0]?.action).toBe("Client containment queued");
  });
});
