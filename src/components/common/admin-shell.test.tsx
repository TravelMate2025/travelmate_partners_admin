import { render, screen } from "@testing-library/react";

import { AdminShell } from "@/components/common/admin-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/moderation",
}));

vi.mock("@/modules/auth/actions", () => ({
  signOutAction: vi.fn(),
}));

describe("AdminShell", () => {
  it("renders navigation, topbar search, and children", () => {
    render(
      <AdminShell
        description="Operational shell for admin routes."
        title="Listing Moderation"
      >
        <div>child content</div>
      </AdminShell>,
    );

    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search partner, listing, settlement, queue..."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Manage session" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.getAllByText("Listing Moderation").length).toBeGreaterThan(0);
    expect(screen.getByText("child content")).toBeInTheDocument();
    expect(screen.getAllByText("Moderation").length).toBeGreaterThan(0);
  });
});
