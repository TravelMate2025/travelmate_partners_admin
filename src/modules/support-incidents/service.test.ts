import { getSupportIncidentRecords } from "@/modules/support-incidents/data";
import { mockSupportIncidentRepository } from "@/modules/support-incidents/service";

describe("support-incidents service", () => {
  it("flags an incident, escalates it, and resolves it with traceable history", async () => {
    const records = getSupportIncidentRecords();

    const flagged = await mockSupportIncidentRepository.applyAction(
      records,
      {
        caseId: "sup-001",
        action: "flag_incident",
        actor: "Maya Singh",
        note: "Flagging an incident because unlock recovery is still failing for the partner.",
      },
      "support",
    );

    expect(flagged.updatedRecord.status).toBe("monitoring");
    expect(flagged.updatedRecord.incidentState).toBe("active");

    const escalated = await mockSupportIncidentRepository.applyAction(
      flagged.records,
      {
        caseId: "sup-001",
        action: "escalate",
        actor: "Maya Singh",
        note: "Escalating this account-access case to operations for unlock recovery review.",
      },
      "support",
    );

    expect(escalated.updatedRecord.status).toBe("escalated");
    expect(escalated.updatedRecord.activity[0].title).toBe("Case escalated");

    const resolved = await mockSupportIncidentRepository.applyAction(
      escalated.records,
      {
        caseId: "sup-001",
        action: "resolve",
        actor: "Maya Singh",
        note: "Partner access restored and incident trail can now be closed safely.",
      },
      "support",
    );

    expect(resolved.updatedRecord.status).toBe("resolved");
    expect(resolved.updatedRecord.incidentState).toBe("mitigated");
    expect(resolved.updatedRecord.activity[0].title).toBe("Case resolved");
  });

  it("runs safe diagnostics without exposing secrets", async () => {
    const result = await mockSupportIncidentRepository.applyAction(
      getSupportIncidentRecords(),
      {
        caseId: "sup-002",
        action: "run_diagnostics",
        actor: "Maya Singh",
        note: "Running safe diagnostics to confirm the refund workflow status for support follow-up.",
      },
      "support",
    );

    expect(result.updatedRecord.diagnostics[0].summary).toContain("No sensitive credentials");
    expect(JSON.stringify(result.updatedRecord.diagnostics[0])).not.toMatch(/secret|token|api[_-]?key/i);
  });

  it("rejects support actions for read-only roles", async () => {
    await expect(
      mockSupportIncidentRepository.applyAction(
        getSupportIncidentRecords(),
        {
          caseId: "sup-001",
          action: "log_note",
          actor: "Ifeoma Okoye",
          note: "Reviewer wants to leave a support note directly from this queue.",
        },
        "reviewer",
      ),
    ).rejects.toThrow("This action is not available for the selected support case and role.");
  });
});
