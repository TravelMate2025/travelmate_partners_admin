import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { getNotificationRecords } from "@/modules/notifications/data";
import { NotificationsWorkspace } from "@/modules/notifications/workspace";

describe("NotificationsWorkspace", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("loads message state from URL params", () => {
    window.history.replaceState(null, "", "/notifications?kind=broadcast&message=notification-001");

    render(<NotificationsWorkspace actor="Maya Singh" initialRecords={getNotificationRecords()} role="support" />);

    expect(screen.getAllByLabelText("Message type")[1]).toHaveValue("broadcast");
    expect(screen.getAllByText("Updated payout statement timeline for verified partners").length).toBeGreaterThan(0);
  });

  it("sends a partner-facing message and shows delivery metadata", async () => {
    render(<NotificationsWorkspace actor="Maya Singh" initialRecords={getNotificationRecords()} role="support" />);

    fireEvent.change(screen.getByLabelText("Notification title"), {
      target: { value: "Verified partner payout timeline notice" },
    });
    fireEvent.change(screen.getByLabelText("Notification body"), {
      target: { value: "Statements now arrive every Tuesday by 10:00 UTC. Review your dashboard for the updated payout schedule." },
    });
    fireEvent.change(screen.getByPlaceholderText(/Capture why this message is being sent/i), {
      target: { value: "Sending after finance confirmed the revised payout timeline for verified partners." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => {
      expect(screen.getAllByText(/queued partner notification/i).length).toBeGreaterThan(0);
    });

    expect(screen.getByText(/Delivery handoff:/i)).toBeInTheDocument();
    expect(screen.getByText(/Estimated audience size: 184 partners./i)).toBeInTheDocument();
  });

  it("prevents finance users from choosing broadcast messages", () => {
    render(<NotificationsWorkspace actor="Tunde Adebayo" initialRecords={getNotificationRecords()} role="finance" />);

    expect(screen.getAllByRole("option", { name: "broadcast" })[1]).toBeDisabled();
  });

  it("renders explicit empty states", () => {
    const { unmount } = render(<NotificationsWorkspace actor="Maya Singh" initialRecords={[]} role="support" />);
    expect(screen.getByText("Messaging workspace is empty")).toBeInTheDocument();

    unmount();
    render(<NotificationsWorkspace actor="Maya Singh" initialRecords={getNotificationRecords()} role="support" />);
    fireEvent.change(screen.getByPlaceholderText(/Search title, summary, or actor/i), {
      target: { value: "nothing like this" },
    });

    expect(screen.getAllByText("No messages match this view").length).toBeGreaterThan(0);
    expect(screen.getByText("Clear or relax the current filters to continue reviewing partner communications.")).toBeInTheDocument();
  });
});
