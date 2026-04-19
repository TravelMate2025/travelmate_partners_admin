import {
  buildSupportIncidentSummary,
  getAvailableSupportActions,
  getSupportIncidentPolicy,
  matchesSupportIncidentFilter,
  validateSupportAction,
} from "@/modules/support-incidents/rules";
import { getSupportIncidentRecords } from "@/modules/support-incidents/data";

describe("support-incidents rules", () => {
  const records = getSupportIncidentRecords();

  it("grants support operators full case controls", () => {
    const policy = getSupportIncidentPolicy("support");
    expect(policy.canEscalate).toBe(true);
    expect(policy.canRunDiagnostics).toBe(true);
  });

  it("keeps reviewer read-only", () => {
    const policy = getSupportIncidentPolicy("reviewer");
    expect(policy.canLogNote).toBe(false);
    expect(policy.canResolve).toBe(false);
  });

  it("offers flag incident for an open non-incident case", () => {
    expect(getAvailableSupportActions(records[0], "support")).toContain("flag_incident");
  });

  it("blocks escalation before incident creation", () => {
    expect(validateSupportAction(records[0], "escalate", "support", "Escalating this case to operations.")).toBe(
      "Flag an incident before escalating it.",
    );
  });

  it("matches queue and incident filters", () => {
    const filtered = records.filter((record) =>
      matchesSupportIncidentFilter(record, {
        query: "",
        status: "all",
        severity: "all",
        queue: "financial_followup",
        incidentState: "active",
      }),
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("sup-002");
  });

  it("builds dashboard counts", () => {
    expect(buildSupportIncidentSummary(records)).toEqual({
      openCases: 3,
      escalatedCases: 1,
      activeIncidents: 2,
      criticalCases: 2,
    });
  });
});
