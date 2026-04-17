import { adminNavItems, adminShellHighlights } from "@/modules/shell/navigation";

describe("admin shell navigation", () => {
  it("covers the shell root and all major admin sections", () => {
    expect(adminNavItems[0].href).toBe("/");
    expect(adminNavItems).toHaveLength(16);
    expect(adminNavItems.some((item) => item.href === "/verification-review")).toBe(true);
    expect(adminNavItems.some((item) => item.href === "/financial-ops")).toBe(true);
    expect(adminNavItems.some((item) => item.href === "/payout-review")).toBe(true);
  });

  it("provides shell highlight principles for the dashboard frame", () => {
    expect(adminShellHighlights).toHaveLength(4);
    expect(adminShellHighlights[0]).toContain("Global search");
    expect(adminShellHighlights.some((item) => item.includes("partner app"))).toBe(true);
  });
});
