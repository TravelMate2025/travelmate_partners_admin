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

  it("shows a local draft when no records are returned and keeps filter empty state", () => {
    const { unmount } = render(<NotificationsWorkspace actor="Maya Singh" initialRecords={[]} role="support" />);
    expect(screen.getAllByText("Partner message draft").length).toBeGreaterThan(0);

    unmount();
    render(<NotificationsWorkspace actor="Maya Singh" initialRecords={getNotificationRecords()} role="support" />);
    fireEvent.change(screen.getByPlaceholderText(/Search title, summary, or actor/i), {
      target: { value: "nothing like this" },
    });

    expect(screen.getAllByText("No messages match this view").length).toBeGreaterThan(0);
    expect(screen.getByText("Clear or relax the current filters to continue reviewing partner communications.")).toBeInTheDocument();
  });

  it("locks targeting controls in appeal response compose flow", async () => {
    window.history.replaceState(
      null,
      "",
      "/notifications?compose=1&composeSource=appeal&audience=partner&partnerId=partner-1&title=Appeal+Response&body=This+is+a+sufficiently+long+appeal+response+message.&note=Documented+appeal+response+context+for+audit.",
    );
    render(<NotificationsWorkspace actor="Maya Singh" initialRecords={getNotificationRecords()} role="support" />);

    expect(screen.getAllByLabelText("Message type")[1]).toBeDisabled();
    expect(screen.getAllByLabelText("Message type")[1]).toHaveValue("direct");
    expect(screen.getByLabelText("Audience segment")).toBeDisabled();
    expect(screen.getByLabelText("Audience segment")).toHaveValue("partner");
    expect(screen.getByLabelText("Target partner")).toBeDisabled();
    expect(screen.getByText(/Appeal response mode locks message targeting to the selected partner./i)).toBeInTheDocument();
  });

  it("does not inherit selected broadcast when entering appeal compose flow", async () => {
    window.history.replaceState(
      null,
      "",
      "/notifications?kind=broadcast&message=notification-001&compose=1&composeSource=appeal&audience=partner&partnerId=partner-1&title=Appeal+Response&body=This+is+a+sufficiently+long+appeal+response+message.&note=Documented+appeal+response+context+for+audit.",
    );
    render(<NotificationsWorkspace actor="Maya Singh" initialRecords={getNotificationRecords()} role="support" />);

    expect(screen.getAllByLabelText("Message type")[1]).toHaveValue("direct");
    expect(screen.getByLabelText("Audience segment")).toHaveValue("partner");
    expect(screen.getByLabelText("Target partner")).toHaveValue("partner-1");
  });

  it("creates and selects a fresh draft from partner messages tab", async () => {
    render(<NotificationsWorkspace actor="Maya Singh" initialRecords={getNotificationRecords()} role="support" />);

    fireEvent.click(screen.getByRole("button", { name: "Partner Messages" }));
    fireEvent.click(screen.getByRole("button", { name: "New Message Draft" }));

    expect(screen.getByText("Untitled draft")).toBeInTheDocument();
    expect(screen.getByText("Draft mode: this message has not been sent yet.")).toBeInTheDocument();
    expect(screen.getByLabelText("Notification title")).toHaveValue("");
    expect(screen.getByLabelText("Notification body")).toHaveValue("");
    expect(screen.queryByPlaceholderText("partner-id-1, partner-id-2")).not.toBeInTheDocument();
  });

  it("sanitizes unsafe partnerId URL values and does not surface them in partner select", async () => {
    window.history.replaceState(
      null,
      "",
      "/notifications?compose=1&composeSource=appeal&audience=partner&partnerId=ui%20flows%2C%20onboarding%20etc&title=Appeal+Response&body=This+is+a+sufficiently+long+appeal+response+message.&note=Documented+appeal+response+context+for+audit.",
    );
    render(<NotificationsWorkspace actor="Maya Singh" initialRecords={getNotificationRecords()} role="support" />);

    expect(screen.getByLabelText("Target partner")).toHaveValue("");
    expect(screen.queryByText(/ui flows, onboarding etc/i)).not.toBeInTheDocument();
  });

  it("hides partner selector for verified_partners audience and shows segment guidance", async () => {
    render(<NotificationsWorkspace actor="Maya Singh" initialRecords={getNotificationRecords()} role="support" />);

    expect(screen.getByLabelText("Audience segment")).toHaveValue("verified_partners");
    expect(screen.queryByLabelText("Target partner")).not.toBeInTheDocument();
    expect(screen.getByText("Audience is resolved automatically from the selected segment.")).toBeInTheDocument();
  });
});
