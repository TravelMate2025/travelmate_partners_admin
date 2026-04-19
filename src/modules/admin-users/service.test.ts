import { getAdminAccessRecords } from "@/modules/admin-users/data";
import { mockAdminUsersRepository } from "@/modules/admin-users/service";

describe("admin-users service", () => {
  it("invites an admin, activates the invite, and updates the role policy", async () => {
    const invited = await mockAdminUsersRepository.inviteAdmin(
      getAdminAccessRecords(),
      {
        name: "Lara Mensah",
        email: "lara.mensah@travelmate.test",
        team: "Governance",
        role: "reviewer",
        requiresMfa: true,
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
        adminId: invited.createdRecord.id,
        action: "activate_admin",
        actor: "Amina Bello",
        note: "Invite was accepted, MFA was completed, and the account can now be activated.",
      },
      "super_admin",
    );

    expect(activated.updatedRecord.status).toBe("active");
    expect(activated.updatedRecord.inviteState).toBe("accepted");

    const roleChanged = await mockAdminUsersRepository.applyAction(
      activated.records,
      {
        adminId: invited.createdRecord.id,
        action: "assign_role",
        actor: "Amina Bello",
        note: "Reassigning this reviewer into finance after the governance approval review.",
        targetRole: "finance",
        confirmSensitiveGrant: true,
      },
      "super_admin",
    );

    expect(roleChanged.updatedRecord.role).toBe("finance");
    expect(roleChanged.updatedRecord.permissionPolicies.some((policy) => policy.title.toLowerCase().includes("finance"))).toBe(true);
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

    expect(revoked.updatedRecord.status).toBe("revoked");

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

    expect(deactivated.updatedRecord.status).toBe("inactive");
    expect(deactivated.auditRecord.summary).toContain("deactivated the admin account");
  });
});
