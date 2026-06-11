import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { getFinancialOpsRecords } from "@/modules/financial-ops/data";
import { FinancialOpsWorkspace } from "@/modules/financial-ops/workspace";

describe("FinancialOpsWorkspace", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("loads settlement queue state from URL params", () => {
    window.history.replaceState(null, "", "/financial-ops?run=failed&case=fin-001");

    render(<FinancialOpsWorkspace actor="Tunde Adebayo" initialRecords={getFinancialOpsRecords()} role="finance" />);

    expect(screen.getByLabelText("Admin settlement run status")).toHaveValue("failed");
    expect(screen.getAllByText("Settlement run failed for Nairobi premium-stay payout batch").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Payment Succeeded").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Service Completed").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/API booking request/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Trace summary/i).length).toBeGreaterThan(0);
  });

  it("handles settlement retry and reconciliation with audit feedback", async () => {
    render(<FinancialOpsWorkspace actor="Tunde Adebayo" initialRecords={getFinancialOpsRecords()} role="finance" />);

    fireEvent.change(screen.getByLabelText("Financial operations note"), {
      target: { value: "Retrying the payout batch after documenting the reconciliation exception." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Retry settlement run" }));

    await waitFor(() => {
      expect(screen.getAllByText(/queued a settlement retry/i).length).toBeGreaterThan(0);
    });

    fireEvent.change(screen.getByLabelText("Financial operations note"), {
      target: { value: "Balancing the settlement delta now that the failed batch has been reviewed." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reconcile case" }));

    await waitFor(() => {
      expect(screen.getByText(/reconciled settlement run failed for nairobi premium-stay payout batch/i)).toBeInTheDocument();
    });
  });

  it("handles refund follow-up and recovery from the finance workspace", async () => {
    render(<FinancialOpsWorkspace actor="Tunde Adebayo" initialRecords={getFinancialOpsRecords()} role="finance" />);

    fireEvent.click(screen.getByText("Refund follow-up pending for cancelled airport transfer"));
    fireEvent.change(screen.getByLabelText("Financial operations note"), {
      target: { value: "Queueing partner refund follow-up before finance closes the reverse settlement trail." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Notify partner refund" }));

    await waitFor(() => {
      expect(screen.getByText(/queued refund follow-up for refund follow-up pending for cancelled airport transfer/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Financial operations note"), {
      target: { value: "Recording refund recovery after partner acknowledgement and finance confirmation." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Record refund recovery" }));

    await waitFor(() => {
      expect(screen.getByText(/recorded refund recovery for refund follow-up pending for cancelled airport transfer/i)).toBeInTheDocument();
    });
  });

  it("generates a settlement statement for a completed payout", async () => {
    render(<FinancialOpsWorkspace actor="Tunde Adebayo" initialRecords={getFinancialOpsRecords()} role="finance" />);

    fireEvent.click(screen.getByText("Completed payout ready for partner statement delivery"));
    fireEvent.change(screen.getByLabelText("Financial operations note"), {
      target: { value: "Generating the partner settlement statement for the completed weekly payout." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate statement" }));

    await waitFor(() => {
      expect(screen.getByText(/generated a settlement statement for completed payout ready for partner statement delivery/i)).toBeInTheDocument();
    });
  });
});
