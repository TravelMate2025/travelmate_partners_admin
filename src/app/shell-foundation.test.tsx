import { render, screen } from "@testing-library/react";

import DashboardPage from "@/app/page";
import PayoutReviewPage from "@/app/payout-review/page";

vi.mock("@/modules/auth/session", () => ({
  getAdminSession: vi.fn().mockResolvedValue(null),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("Flow 2.0 shell foundation", () => {
  it("renders the overview dashboard with shared primitives", async () => {
    render(await DashboardPage());

    expect(screen.getAllByText("Operations Overview").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Open Review Drawer" })).toBeInTheDocument();
    expect(screen.getByText("Actionable queues")).toBeInTheDocument();
    expect(screen.getByText("Operational movement")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Open queue/i }).length).toBeGreaterThan(0);
  });

  it("renders scaffold pages inside the shared shell", () => {
    render(<PayoutReviewPage />);

    expect(screen.getAllByText("Payout Review").length).toBeGreaterThan(0);
    expect(screen.getByText("Payout review scaffold")).toBeInTheDocument();
    expect(screen.getByText("Review payout cases")).toBeInTheDocument();
  });
});
