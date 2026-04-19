import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { getCommercialControlRecords } from "@/modules/commercial-controls/data";
import { CommercialControlsWorkspace } from "@/modules/commercial-controls/workspace";

describe("CommercialControlsWorkspace", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("loads commercial state from URL params", () => {
    window.history.replaceState(null, "", "/commercial-controls?scope=partner&rule=commercial-rule-003");

    render(
      <CommercialControlsWorkspace actor="Tunde Adebayo" initialRecords={getCommercialControlRecords()} role="finance" />,
    );

    expect(screen.getByDisplayValue("partner")).toBeInTheDocument();
    expect(screen.getAllByText("VoyageStack enterprise API partner override").length).toBeGreaterThan(0);
  });

  it("updates a commercial rule and shows audit feedback", async () => {
    render(
      <CommercialControlsWorkspace actor="Tunde Adebayo" initialRecords={getCommercialControlRecords()} role="finance" />,
    );

    fireEvent.change(screen.getByLabelText("Commission rate percent"), { target: { value: "16" } });
    fireEvent.change(screen.getByLabelText("Service fee flat amount"), { target: { value: "5" } });
    fireEvent.change(screen.getByPlaceholderText(/Capture pricing rationale/i), {
      target: { value: "Raised stay pricing controls after finance review and margin analysis." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update rule" }));

    await waitFor(() => {
      expect(screen.getAllByText(/updated commercial rule/i).length).toBeGreaterThan(0);
    });

    expect(screen.getByText(/Commission: 16%/i)).toBeInTheDocument();
    expect(screen.getByText(/Service fee: 3 USD/i)).toBeInTheDocument();
    expect(screen.getByText(/Audit detail: commission changed from 14 to 16 effective 2026-04-15/i)).toBeInTheDocument();
  });

  it("records manual adjustments and keeps history visible", async () => {
    render(
      <CommercialControlsWorkspace actor="Tunde Adebayo" initialRecords={getCommercialControlRecords()} role="finance" />,
    );

    fireEvent.change(screen.getByLabelText("Adjustment amount"), { target: { value: "180" } });
    fireEvent.change(screen.getByLabelText("Adjustment reason"), { target: { value: "Campaign recovery" } });
    fireEvent.change(screen.getByPlaceholderText(/Capture pricing rationale/i), {
      target: { value: "Recording campaign recovery after temporary service-fee concession cleanup." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Record adjustment" }));

    await waitFor(() => {
      expect(screen.getAllByText(/recorded a manual commercial adjustment/i).length).toBeGreaterThan(0);
    });

    expect(screen.getByText(/Lagos Stay Collective · credit · 180 USD/i)).toBeInTheDocument();
    expect(screen.getByText(/Audit detail: credit 180 USD for Lagos Stay Collective because Campaign recovery./i)).toBeInTheDocument();
  });

  it("renders explicit empty and filtered empty states", () => {
    const { unmount } = render(<CommercialControlsWorkspace actor="Tunde Adebayo" initialRecords={[]} role="finance" />);

    expect(screen.getByText("Commercial controls are empty")).toBeInTheDocument();

    unmount();

    render(
      <CommercialControlsWorkspace actor="Tunde Adebayo" initialRecords={getCommercialControlRecords()} role="finance" />,
    );

    fireEvent.change(screen.getByPlaceholderText(/Search rule, region, or commercial summary/i), { target: { value: "no rule like this" } });

    expect(screen.getAllByText("No commercial controls match this view").length).toBeGreaterThan(0);
    expect(screen.getByText("Clear or relax the current filters to continue reviewing marketplace fee configuration.")).toBeInTheDocument();
  });
});
