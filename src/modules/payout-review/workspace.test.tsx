import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { getPayoutReviewRecords } from "@/modules/payout-review/data";
import { PayoutReviewWorkspace } from "@/modules/payout-review/workspace";

describe("PayoutReviewWorkspace", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("loads queue state from URL params", () => {
    window.history.replaceState(null, "", "/payout-review?status=pending&case=payout-002");

    render(<PayoutReviewWorkspace actor="Tunde Adebayo" initialRecords={getPayoutReviewRecords()} role="finance" />);

    expect(screen.getByLabelText("Payout verification status")).toHaveValue("pending");
    expect(screen.getAllByText("Pending mobile-money verification with ownership mismatch").length).toBeGreaterThan(0);
  });

  it("approves a pending payout method and updates the downstream settlement state", async () => {
    render(<PayoutReviewWorkspace actor="Tunde Adebayo" initialRecords={getPayoutReviewRecords()} role="finance" />);

    fireEvent.change(screen.getByLabelText("Payout review note"), {
      target: { value: "Ownership and account metadata are confirmed, so finance can release this payout method." },
    });
    fireEvent.change(screen.getByLabelText("Payout review reason code"), {
      target: { value: "ownership_confirmed" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Approve payout method" }));

    await waitFor(() => {
      expect(screen.getByText(/approved payout method for pending bank-account update after rapid payout change/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText("Settlement Ready").length).toBeGreaterThan(0);
  });

  it("shows masked payout data for super admin users", () => {
    render(<PayoutReviewWorkspace actor="Ada Okafor" initialRecords={getPayoutReviewRecords()} role="super_admin" />);

    expect(screen.getByText(/sensitive settlement account fields are masked for this role/i)).toBeInTheDocument();
    expect(screen.queryByText("0123454831")).not.toBeInTheDocument();
  });

  it("reverifies an already approved payout method from the admin queue", async () => {
    render(<PayoutReviewWorkspace actor="Tunde Adebayo" initialRecords={getPayoutReviewRecords()} role="finance" />);

    fireEvent.click(screen.getByText("Verified bank account under post-approval fraud review"));
    fireEvent.change(screen.getByLabelText("Payout review note"), {
      target: { value: "The new fraud pattern requires the verified payout method to return to review before settlement continues." },
    });
    fireEvent.change(screen.getByLabelText("Payout review reason code"), {
      target: { value: "rapid_account_change" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Trigger re-verification" }));

    await waitFor(() => {
      expect(screen.getByText(/sent payout method back to re-verification for verified bank account under post-approval fraud review/i)).toBeInTheDocument();
    });
  });
});
