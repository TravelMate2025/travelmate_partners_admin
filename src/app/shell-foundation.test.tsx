import { render, screen } from "@testing-library/react";

import DashboardPage from "@/app/page";
import PayoutReviewPage from "@/app/payout-review/page";
import { getAdminSession } from "@/modules/auth/session";

vi.mock("@/modules/auth/session", () => ({
  getAdminSession: vi.fn().mockResolvedValue(null),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("Flow 2.0 shell foundation", () => {
  it("renders the overview dashboard with shared primitives", async () => {
    vi.mocked(getAdminSession).mockResolvedValueOnce({
      user: {
        id: "1",
        name: "Super Admin",
        email: "superadmin@travelmate.test",
        role: "super_admin",
        team: "Platform Leadership",
        requiresMfa: true,
      },
      sessionId: "1",
      currentSessionId: 1,
      issuedAt: "2026-04-22T10:00:00.000Z",
      lastValidatedAt: "2026-04-22T10:01:00.000Z",
      deviceLabel: "en-US::Desktop Chrome",
      mfaSatisfied: true,
    });
    render(await DashboardPage());

    expect(screen.getAllByText("Operations Overview").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Open Review Drawer" })).toBeInTheDocument();
    expect(screen.getByText("Actionable queues")).toBeInTheDocument();
    expect(screen.getByText("Operational movement")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Open queue/i }).length).toBeGreaterThan(0);
  });

  it("renders scaffold pages inside the shared shell", async () => {
    vi.mocked(getAdminSession).mockResolvedValueOnce({
      user: {
        id: "9",
        name: "Finance Admin",
        email: "finance@travelmate.test",
        role: "finance",
        team: "Finance",
        requiresMfa: true,
      },
      sessionId: "9",
      currentSessionId: 9,
      issuedAt: "2026-04-22T10:00:00.000Z",
      lastValidatedAt: "2026-04-22T10:01:00.000Z",
      deviceLabel: "en-US::Desktop Chrome",
      mfaSatisfied: true,
    });

    render(await PayoutReviewPage());

    expect(screen.getAllByText("Payout Review").length).toBeGreaterThan(0);
    expect(screen.getByText("Review settlement-account submissions, masked payout details, risk flags, and settlement holds from one finance-governance route.")).toBeInTheDocument();
    expect(screen.getByText("Approve payout method")).toBeInTheDocument();
  });
});
