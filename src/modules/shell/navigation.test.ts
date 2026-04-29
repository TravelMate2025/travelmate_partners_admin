import { adminNavItems, adminShellHighlights, getRoleAwareAdminNavItems } from "@/modules/shell/navigation";

describe("admin shell navigation", () => {
  it("covers the shell root and all major admin sections", () => {
    expect(adminNavItems[0].href).toBe("/");
    expect(adminNavItems).toHaveLength(17);
    expect(adminNavItems.some((item) => item.href === "/verification-review")).toBe(true);
    expect(adminNavItems.some((item) => item.href === "/financial-ops")).toBe(true);
    expect(adminNavItems.some((item) => item.href === "/fx-rates")).toBe(true);
    expect(adminNavItems.some((item) => item.href === "/payout-review")).toBe(true);
  });

  it("provides shell highlight principles for the dashboard frame", () => {
    expect(adminShellHighlights).toHaveLength(4);
    expect(adminShellHighlights[0]).toContain("Global search");
    expect(adminShellHighlights.some((item) => item.includes("partner app"))).toBe(true);
  });

  it("marks locked routes for roles that lack access", () => {
    const operationsNav = getRoleAwareAdminNavItems("operations");
    const financeOps = operationsNav.find((item) => item.href === "/financial-ops");
    const notifications = operationsNav.find((item) => item.href === "/notifications");

    expect(financeOps).toMatchObject({
      accessible: false,
      destinationHref: "/auth/access-denied?next=%2Ffinancial-ops&required=finance%2Csuper_admin",
      restrictionNote: "Requires finance or super admin",
    });
    expect(notifications).toMatchObject({
      accessible: true,
      destinationHref: "/notifications",
    });
  });
});
