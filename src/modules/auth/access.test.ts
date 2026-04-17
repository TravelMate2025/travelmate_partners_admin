import { resolveAdminAccess } from "@/modules/auth/access";
import { createAdminSession } from "@/modules/auth/session";
import { findMockAdminByEmail } from "@/modules/auth/mock-admins";

describe("resolveAdminAccess", () => {
  it("redirects unauthenticated users to sign in for protected routes", () => {
    expect(resolveAdminAccess("/financial-ops", null)).toEqual({
      type: "redirect_login",
      nextPath: "/financial-ops",
    });
  });

  it("blocks non-finance roles from finance-controlled routes", () => {
    const admin = findMockAdminByEmail("ops@travelmate.test");
    expect(admin).not.toBeNull();

    const session = createAdminSession(admin!);
    expect(resolveAdminAccess("/payout-review", session)).toEqual({
      type: "redirect_forbidden",
      nextPath: "/payout-review",
      requiredRoles: ["finance", "super_admin"],
    });
  });

  it("allows finance roles onto finance-controlled routes", () => {
    const admin = findMockAdminByEmail("finance@travelmate.test");
    expect(admin).not.toBeNull();

    const session = createAdminSession(admin!);
    expect(resolveAdminAccess("/financial-ops", session)).toEqual({ type: "allow" });
  });
});
