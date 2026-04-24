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

  it("handles invite, reactivation, and role change from the workspace", async () => {
    render(<AdminUsersWorkspace actor="Amina Bello" initialRecords={getAdminAccessRecords()} role="super_admin" />);

    fireEvent.change(screen.getByLabelText("Invite admin name"), { target: { value: "Lara Mensah" } });
    fireEvent.change(screen.getByLabelText("Invite admin email"), { target: { value: "lara.mensah@travelmate.test" } });
    fireEvent.change(screen.getByLabelText("Invite admin team"), { target: { value: "Verification Review" } });
    fireEvent.change(screen.getByLabelText("Invite admin note"), {
      target: { value: "Adding a new governance reviewer to support the compliance backlog." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Invite admin" }));

    await waitFor(() => {
      expect(screen.getByText(/invited lara mensah into the admin dashboard/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Maya Singh"));
    fireEvent.change(screen.getByLabelText("Admin governance note"), {
      target: { value: "MFA posture and workstation ownership were reviewed, so this admin can be reactivated." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Activate admin" }));

    await waitFor(() => {
      expect(screen.getByText(/activated the admin account for maya singh/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Target admin role"), { target: { value: "finance" } });
    fireEvent.click(screen.getByLabelText("Confirm finance or super admin grant"));
    fireEvent.change(screen.getByLabelText("Admin governance note"), {
      target: { value: "Reassigning this reviewer into finance after the governance approval review." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply role" }));

    await waitFor(() => {
      expect(screen.getByText(/changed maya singh to role finance/i)).toBeInTheDocument();
    });
  }, 10000);

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

  it("lets super admins delete deactivated admins and shows role permissions guidance", async () => {
    render(<AdminUsersWorkspace actor="Amina Bello" initialRecords={getAdminAccessRecords()} role="super_admin" />);

    fireEvent.click(screen.getByText("Maya Singh"));
    fireEvent.change(screen.getByLabelText("Admin governance note"), {
      target: { value: "Removing this deactivated admin account after access cleanup is complete." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Delete admin" }));

    await waitFor(() => {
      expect(screen.getByText(/deleted the inactive admin account for maya singh/i)).toBeInTheDocument();
    });

    expect(screen.queryByText("Maya Singh")).not.toBeInTheDocument();
    expect(screen.getByText("Role permissions reference")).toBeInTheDocument();
    expect(screen.getByText("Full governance authority across the admin platform.")).toBeInTheDocument();
  });
});
