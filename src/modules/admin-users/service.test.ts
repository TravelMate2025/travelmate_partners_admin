import { getAdminAccessRecords } from "@/modules/admin-users/data";
import { mockAdminUsersRepository } from "@/modules/admin-users/service";

describe("admin-users service", () => {
  it("invites an admin, reactivates an inactive admin, and updates the role policy", async () => {
    const invited = await mockAdminUsersRepository.inviteAdmin(
      getAdminAccessRecords(),
      {
        name: "Lara Mensah",
        email: "lara.mensah@travelmate.test",
        team: "Verification Review",
        role: "reviewer",
        note: "Adding a new governance reviewer to support the compliance backlog.",
        confirmSensitiveGrant: false,
      },
      "Amina Bello",
      "super_admin",
    );

    expect(invited.createdRecord.status).toBe("pending_invite");

    const activated = await mockAdminUsersRepository.applyAction(
      invited.records,
      {
        adminId: "adm-004",
        action: "activate_admin",
        actor: "Amina Bello",
        note: "MFA posture and workstation ownership were reviewed, so this admin can be reactivated.",
      },
      "super_admin",
    );

    expect(activated.updatedRecord?.status).toBe("active");
    expect(activated.updatedRecord?.inviteState).toBe("accepted");

    const roleChanged = await mockAdminUsersRepository.applyAction(
      activated.records,
      {
        adminId: "adm-004",
        action: "assign_role",
        actor: "Amina Bello",
        note: "Reassigning this reviewer into finance after the governance approval review.",
        targetRole: "finance",
        confirmSensitiveGrant: true,
      },
      "super_admin",
    );

    expect(roleChanged.updatedRecord?.role).toBe("finance");
    expect(roleChanged.updatedRecord?.permissionPolicies.some((policy) => policy.title.toLowerCase().includes("finance"))).toBe(true);
  });

  it("revokes a pending invite and deactivates an active admin", async () => {
    const revoked = await mockAdminUsersRepository.applyAction(
      getAdminAccessRecords(),
      {
        adminId: "adm-007",
        action: "revoke_invite",
        actor: "Amina Bello",
        note: "The invite should be withdrawn until the hiring approval is finalized.",
      },
      "super_admin",
    );

    expect(revoked.updatedRecord?.status).toBe("revoked");

    const deactivated = await mockAdminUsersRepository.applyAction(
      getAdminAccessRecords(),
      {
        adminId: "adm-002",
        action: "deactivate_admin",
        actor: "Amina Bello",
        note: "The operations workstation ownership changed, so the account is being paused pending reassignment.",
      },
      "super_admin",
    );

    expect(deactivated.updatedRecord?.status).toBe("inactive");
    expect(deactivated.auditRecord.summary).toContain("deactivated the admin account");
  });

  it("deletes an inactive admin from the workspace dataset", async () => {
    const deleted = await mockAdminUsersRepository.applyAction(
      getAdminAccessRecords(),
      {
        adminId: "adm-004",
        action: "delete_admin",
        actor: "Amina Bello",
        note: "Removing this deactivated admin account after access cleanup is complete.",
      },
      "super_admin",
    );

    expect(deleted.updatedRecord).toBeNull();
    expect(deleted.deletedRecordId).toBe("adm-004");
    expect(deleted.records.some((record) => record.id === "adm-004")).toBe(false);
    expect(deleted.auditRecord.summary).toContain("deleted the inactive admin account");
  });
});
