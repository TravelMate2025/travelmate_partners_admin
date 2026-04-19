import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { getSupportIncidentRecords } from "@/modules/support-incidents/data";
import { SupportIncidentsWorkspace } from "@/modules/support-incidents/workspace";

describe("SupportIncidentsWorkspace", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("loads queue and selected case state from URL params", () => {
    window.history.replaceState(null, "", "/support-incidents?queue=financial_followup&case=sup-002");

    render(<SupportIncidentsWorkspace actor="Maya Singh" initialRecords={getSupportIncidentRecords()} role="support" />);

    expect(screen.getByLabelText("Support case queue")).toHaveValue("financial_followup");
    expect(screen.getAllByText("Refund dispute linked to cancelled airport transfer").length).toBeGreaterThan(0);
  });

  it("handles incident creation, escalation, and resolution from the workspace", async () => {
    render(<SupportIncidentsWorkspace actor="Maya Singh" initialRecords={getSupportIncidentRecords()} role="support" />);

    fireEvent.change(screen.getByLabelText("Support internal note"), {
      target: { value: "Flagging an incident because unlock recovery is still failing for the partner." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Flag incident" }));

    await waitFor(() => {
      expect(screen.getByText(/flagged an incident on/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Support internal note"), {
      target: { value: "Escalating this account-access case to operations for unlock recovery review." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Escalate case" }));

    await waitFor(() => {
      expect(screen.getByText(/escalated partner cannot reopen locked account/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Support internal note"), {
      target: { value: "Partner access restored and incident trail can now be closed safely." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Resolve case" }));

    await waitFor(() => {
      expect(screen.getByText(/resolved partner cannot reopen locked account/i)).toBeInTheDocument();
    });
  });

  it("records a safe diagnostics snapshot", async () => {
    render(<SupportIncidentsWorkspace actor="Maya Singh" initialRecords={getSupportIncidentRecords()} role="support" />);

    fireEvent.change(screen.getByLabelText("Support internal note"), {
      target: { value: "Running safe diagnostics to confirm the refund workflow status for support follow-up." },
    });
    fireEvent.click(screen.getByText("Refund dispute linked to cancelled airport transfer"));
    fireEvent.click(screen.getByRole("button", { name: "Run safe diagnostics" }));

    await waitFor(() => {
      expect(screen.getAllByText(/No sensitive credentials or raw financial data were exposed/i).length).toBeGreaterThan(0);
    });
  });

  it("shows read-only posture for finance role", () => {
    render(<SupportIncidentsWorkspace actor="Tunde Adebayo" initialRecords={getSupportIncidentRecords()} role="finance" />);

    expect(screen.getByText("No case actions are available for this role.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Resolve case" })).not.toBeInTheDocument();
  });
});
