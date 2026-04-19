import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { getAdminAccessRecords } from "@/modules/admin-users/data";
import { AdminUsersWorkspace } from "@/modules/admin-users/workspace";

describe("AdminUsersWorkspace", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("loads admin governance queue state from URL params", () => {
    window.history.replaceState(null, "", "/admin-users?status=pending_invite&admin=adm-007");

    render(<AdminUsersWorkspace actor="Amina Bello" initialRecords={getAdminAccessRecords()} role="super_admin" />);

    expect(screen.getByLabelText("Admin account status")).toHaveValue("pending_invite");
    expect(screen.getAllByText("Jordan Nwosu").length).toBeGreaterThan(0);
  });

  it("handles invite, activation, and role change from the workspace", async () => {
    render(<AdminUsersWorkspace actor="Amina Bello" initialRecords={getAdminAccessRecords()} role="super_admin" />);

    fireEvent.change(screen.getByLabelText("Invite admin name"), { target: { value: "Lara Mensah" } });
    fireEvent.change(screen.getByLabelText("Invite admin email"), { target: { value: "lara.mensah@travelmate.test" } });
    fireEvent.change(screen.getByLabelText("Invite admin team"), { target: { value: "Governance" } });
    fireEvent.change(screen.getByLabelText("Invite admin note"), {
      target: { value: "Adding a new governance reviewer to support the compliance backlog." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Invite admin" }));

    await waitFor(() => {
      expect(screen.getByText(/invited lara mensah into the admin dashboard/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Admin governance note"), {
      target: { value: "Invite was accepted, MFA was completed, and the account can now be activated." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Activate admin" }));

    await waitFor(() => {
      expect(screen.getByText(/activated the admin account for lara mensah/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Target admin role"), { target: { value: "finance" } });
    fireEvent.click(screen.getByLabelText("Confirm finance or super admin grant"));
    fireEvent.change(screen.getByLabelText("Admin governance note"), {
      target: { value: "Reassigning this reviewer into finance after the governance approval review." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply role" }));

    await waitFor(() => {
      expect(screen.getByText(/changed lara mensah to role finance/i)).toBeInTheDocument();
    });
  });

  it("shows governance errors when sensitive role confirmation is missing", async () => {
    render(<AdminUsersWorkspace actor="Amina Bello" initialRecords={getAdminAccessRecords()} role="super_admin" />);

    fireEvent.change(screen.getByLabelText("Target admin role"), { target: { value: "finance" } });
    fireEvent.change(screen.getByLabelText("Admin governance note"), {
      target: { value: "Promoting this admin into finance after the governance approval review." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply role" }));

    await waitFor(() => {
      expect(screen.getByText(/explicit confirmation is required before granting a sensitive admin role/i)).toBeInTheDocument();
    });
  });
});
