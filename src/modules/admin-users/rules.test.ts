import {
  getAvailableAdminGovernanceActions,
  validateAdminGovernanceAction,
  validateInviteAdminInput,
} from "@/modules/admin-users/rules";
import { getAdminAccessRecords } from "@/modules/admin-users/data";

describe("admin-users rules", () => {
  it("requires explicit confirmation for sensitive role invites", () => {
    expect(
      validateInviteAdminInput(
        {
          name: "Jordan Nwosu",
          email: "jordan.nwosu@travelmate.test",
          team: "Finance Operations",
          role: "finance",
          note: "Finance capacity is expanding and this sensitive grant has governance approval.",
          confirmSensitiveGrant: false,
        },
        "super_admin",
      ),
    ).toBe("Explicit confirmation is required before inviting an admin into a sensitive role.");
  });

  it("blocks deactivating the last active super admin", () => {
    const records = getAdminAccessRecords().map((record) =>
      record.id === "adm-006" ? { ...record, status: "inactive" as const } : record,
    );
    const target = records.find((record) => record.id === "adm-001");
    expect(target).toBeDefined();

    expect(
      validateAdminGovernanceAction(records, target!, "deactivate_admin", "super_admin", "Closing the only remaining super admin account."),
    ).toBe("At least one active super admin must remain available.");
  });

  it("requires explicit confirmation when granting finance or super admin roles", () => {
    const target = getAdminAccessRecords().find((record) => record.id === "adm-002");
    expect(target).toBeDefined();

    expect(
      validateAdminGovernanceAction(
        getAdminAccessRecords(),
        target!,
        "assign_role",
        "super_admin",
        "Promoting this admin into finance after the governance approval review.",
        "finance",
        false,
      ),
    ).toBe("Explicit confirmation is required before granting a sensitive admin role.");
  });

  it("limits invite controls to pending invites and role assignment to accepted accounts", () => {
    const pendingRecord = getAdminAccessRecords().find((record) => record.id === "adm-007");
    const activeRecord = getAdminAccessRecords().find((record) => record.id === "adm-002");
    const inactiveRecord = getAdminAccessRecords().find((record) => record.id === "adm-004");

    expect(getAvailableAdminGovernanceActions(pendingRecord!, "super_admin")).toContain("resend_invite");
    expect(getAvailableAdminGovernanceActions(pendingRecord!, "super_admin")).not.toContain("activate_admin");
    expect(getAvailableAdminGovernanceActions(pendingRecord!, "super_admin")).not.toContain("assign_role");
    expect(getAvailableAdminGovernanceActions(activeRecord!, "super_admin")).toContain("assign_role");
    expect(getAvailableAdminGovernanceActions(inactiveRecord!, "super_admin")).toContain("activate_admin");
  });
});
