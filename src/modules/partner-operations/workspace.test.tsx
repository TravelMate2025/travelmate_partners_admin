import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { getPartnerRecords } from "@/modules/partner-operations/data";
import { PartnerOperationsWorkspace } from "@/modules/partner-operations/workspace";

describe("PartnerOperationsWorkspace", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("filters partner records by search query", () => {
    render(<PartnerOperationsWorkspace actor="Operations Admin" initialRecords={getPartnerRecords()} role="operations" />);

    fireEvent.change(screen.getByPlaceholderText(/Search partner, business, or email/i), {
      target: { value: "Savannah" },
    });

    expect(screen.getByRole("button", { name: /Maya Patel/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Amina Yusuf/i })).not.toBeInTheDocument();
  });

  it("saves metadata updates for permitted roles", async () => {
    render(<PartnerOperationsWorkspace actor="Operations Admin" initialRecords={getPartnerRecords()} role="operations" />);

    fireEvent.change(screen.getByDisplayValue("West Africa Supply"), {
      target: { value: "Strategic Coverage Team" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save metadata" }));

    await waitFor(() => {
      expect(screen.getByText(/executed update_metadata/i)).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue("Strategic Coverage Team")).toBeInTheDocument();
    expect(screen.getByText("Metadata updated")).toBeInTheDocument();
  });

  it("applies restore when the selected partner is archived and role allows it", async () => {
    render(<PartnerOperationsWorkspace actor="Operations Admin" initialRecords={getPartnerRecords()} role="operations" />);

    fireEvent.click(screen.getByRole("button", { name: /Maya Patel/i }));
    fireEvent.click(screen.getByRole("button", { name: "Restore account" }));

    await waitFor(() => {
      expect(screen.getAllByText("active").length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/executed restore/i)).toBeInTheDocument();
    expect(screen.getByText("Account restored")).toBeInTheDocument();
  });

  it("restores shareable filter and selection state from the URL", () => {
    window.history.replaceState(null, "", "/partners?q=Savannah&region=Nairobi&partner=partner-003");

    render(<PartnerOperationsWorkspace actor="Operations Admin" initialRecords={getPartnerRecords()} role="operations" />);

    expect(screen.getByDisplayValue("Savannah")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Nairobi")).toBeInTheDocument();
    expect(screen.getAllByText("Savannah Retreat Collections").length).toBeGreaterThan(0);
  });

  it("renders explicit empty and no-match states", () => {
    const { unmount } = render(<PartnerOperationsWorkspace actor="Operations Admin" initialRecords={[]} role="operations" />);

    expect(screen.getByText("Partner directory is empty")).toBeInTheDocument();

    unmount();
    render(<PartnerOperationsWorkspace actor="Operations Admin" initialRecords={getPartnerRecords()} role="operations" />);

    fireEvent.change(screen.getByPlaceholderText(/Search partner, business, or email/i), {
      target: { value: "No such partner" },
    });

    expect(screen.getByText("No partners match this view")).toBeInTheDocument();
    expect(screen.getByText("No partner selected from this filter set")).toBeInTheDocument();
  });

  it("shows structured operating coverage and payout setup in the detail panel", () => {
    render(<PartnerOperationsWorkspace actor="Operations Admin" initialRecords={getPartnerRecords()} role="operations" />);

    expect(screen.getByText("Operating coverage")).toBeInTheDocument();
    expect(screen.getByText("Payout setup")).toBeInTheDocument();
    expect(screen.getByText("Lagos State")).toBeInTheDocument();
    expect(screen.getByText("Bank transfer")).toBeInTheDocument();
    expect(screen.getByText("Eligible after service completion")).toBeInTheDocument();
  });
});
