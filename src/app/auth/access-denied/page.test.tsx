import { render, screen } from "@testing-library/react";

import AccessDeniedPage from "@/app/auth/access-denied/page";
import { getAdminSession } from "@/modules/auth/session";

vi.mock("@/modules/auth/session", () => ({
  getAdminSession: vi.fn().mockResolvedValue(null),
}));

describe("AccessDeniedPage", () => {
  it("shows the requested route summary and required roles", async () => {
    vi.mocked(getAdminSession).mockResolvedValueOnce({
      user: {
        id: "5",
        name: "Operations Admin",
        email: "ops@travelmate.test",
        role: "operations",
        team: "Operations",
        requiresMfa: true,
      },
      sessionId: "5",
      currentSessionId: 5,
      issuedAt: "2026-04-22T10:00:00.000Z",
      lastValidatedAt: "2026-04-22T10:01:00.000Z",
      deviceLabel: "en-US::Desktop Chrome",
      mfaSatisfied: true,
    });

    render(
      await AccessDeniedPage({
        searchParams: Promise.resolve({
          next: "/financial-ops",
        }),
      }),
    );

    expect(screen.getByText("Financial Operations")).toBeInTheDocument();
    expect(screen.getByText(/Required roles: finance, super_admin/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Retry route" })).toHaveAttribute("href", "/financial-ops");
  });
});
