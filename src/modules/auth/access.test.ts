import { buildForbiddenAccessPath, getAdminRouteDefinition, resolveAdminAccess } from "@/modules/auth/access";
import type { AdminSession } from "@/modules/auth/types";

function createSession(role: AdminSession["user"]["role"], email = "admin@example.com"): AdminSession {
  return {
    user: {
      id: "1",
      name: "Admin User",
      email,
      role,
      team: "Platform",
      requiresMfa: role !== "support",
    },
    sessionId: "1",
    currentSessionId: 1,
    issuedAt: "2026-04-22T00:00:00.000Z",
    lastValidatedAt: "2026-04-22T00:00:00.000Z",
    deviceLabel: "en-US::Browser",
    mfaSatisfied: true,
  };
}

describe("resolveAdminAccess", () => {
  it("redirects unauthenticated users to sign in for protected routes", () => {
    expect(resolveAdminAccess("/financial-ops", null)).toEqual({
      type: "redirect_login",
      nextPath: "/financial-ops",
    });
  });

  it("blocks non-finance roles from finance-controlled routes", () => {
    const session = createSession("operations");
    expect(resolveAdminAccess("/payout-review", session)).toEqual({
      type: "redirect_forbidden",
      nextPath: "/payout-review",
      requiredRoles: ["finance", "super_admin"],
    });
  });

  it("blocks non-super-admin roles from admin governance routes", () => {
    const session = createSession("operations");
    expect(resolveAdminAccess("/admin-users", session)).toEqual({
      type: "redirect_forbidden",
      nextPath: "/admin-users",
      requiredRoles: ["super_admin"],
    });
  });

  it("allows finance roles onto finance-controlled routes", () => {
    const session = createSession("finance");
    expect(resolveAdminAccess("/financial-ops", session)).toEqual({ type: "allow" });
  });

  it("allows super admins onto admin governance routes", () => {
    const session = createSession("super_admin");
    expect(resolveAdminAccess("/admin-users", session)).toEqual({ type: "allow" });
  });

  it("describes restricted routes from the shared route registry", () => {
    expect(getAdminRouteDefinition("/system-config")).toMatchObject({
      label: "System Config",
      roles: ["super_admin", "operations"],
    });
  });

  it("builds forbidden redirects with required role context", () => {
    expect(buildForbiddenAccessPath("/financial-ops")).toBe(
      "/auth/access-denied?next=%2Ffinancial-ops&required=finance%2Csuper_admin",
    );
  });
});
