import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { getVerificationCases } from "@/modules/verification-review/data";
import { VerificationReviewWorkspace } from "@/modules/verification-review/workspace";

describe("VerificationReviewWorkspace", () => {
  it("shows a backend-shaped submitted document packet with preview metadata", () => {
    render(<VerificationReviewWorkspace actor="Reviewer lane" initialCases={getVerificationCases()} />);

    expect(screen.getAllByText("amina-yusuf-passport.pdf").length).toBeGreaterThan(0);
    expect(screen.getByText(/Primary passport page and signature page/i)).toBeInTheDocument();
    expect(screen.getByText("/api/backend/verification-cases/verify-001/documents/doc-1/download")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Preview secure file" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Download secure file" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Business registration/i }));

    expect(screen.getAllByText("north-harbour-registration-scan.pdf").length).toBeGreaterThan(0);
    expect(screen.getByText(/Secondary manual check needed because the registrar stamp is partially obscured/i)).toBeInTheDocument();
  });

  it("allows reviewers to approve a verification case and updates lifecycle output", async () => {
    render(<VerificationReviewWorkspace actor="Reviewer lane" initialCases={getVerificationCases()} />);

    fireEvent.change(screen.getByPlaceholderText(/Add approval rationale/i), {
      target: { value: "Documents match onboarding profile." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Approve verification" }));

    await waitFor(() => {
      expect(screen.getAllByText("approved").length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("verified").length).toBeGreaterThan(0);
    expect(screen.getByText("Partner is notified of approval and partner lifecycle advances to verified.")).toBeInTheDocument();
    expect(screen.getByText(/Audit prep:/)).toBeInTheDocument();
    expect(screen.getByText(/verification_approved/i)).toBeInTheDocument();
    expect(screen.getByText(/no open follow-up/i)).toBeInTheDocument();
  });

  it("connects action availability to the selected case state", () => {
    render(<VerificationReviewWorkspace actor="Reviewer lane" initialCases={getVerificationCases()} />);

    fireEvent.click(screen.getByRole("button", { name: /Maya Patel/i }));

    expect(screen.getByRole("button", { name: "Approve verification" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reject verification" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Request more info" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Suspend lifecycle" })).toBeEnabled();
    expect(screen.getByText(/Latest review event: Verification approved/i)).toBeInTheDocument();
    expect(screen.getByText(/All submitted documents are currently clear./i)).toBeInTheDocument();
    expect(screen.getAllByText("maya-patel-passport.pdf").length).toBeGreaterThan(0);
  });
});
