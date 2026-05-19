import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { getInitialReportExports } from "@/modules/reports/data";
import { ReportsWorkspace } from "@/modules/reports/workspace";

describe("ReportsWorkspace", () => {
  it("updates analytics when filters change and exports filtered context", async () => {
    render(<ReportsWorkspace actor="Amina Bello" initialExports={getInitialReportExports()} />);

    fireEvent.change(screen.getByLabelText("Report region"), { target: { value: "east_africa" } });
    fireEvent.change(screen.getByLabelText("Report timeframe"), { target: { value: "90d" } });
    fireEvent.click(screen.getByLabelText(/Verification funnel/i));
    fireEvent.click(screen.getByLabelText(/Listing conversion/i));
    fireEvent.click(screen.getByLabelText(/Supply mix/i));
    fireEvent.click(screen.getByLabelText(/Booking activity/i));
    fireEvent.click(screen.getByRole("button", { name: "Export report" }));

    await waitFor(() => {
      expect(screen.getAllByText(/exported analytics report/i).length).toBeGreaterThan(0);
    });

    expect(screen.getByText("East Africa")).toBeInTheDocument();
    expect(screen.getAllByText(/travelmate-report-east_africa-90d.csv/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/East Africa reporting snapshot · 2 sections/i)).toBeInTheDocument();
    expect(screen.getByText(/Sections: Partner growth, API adoption/i)).toBeInTheDocument();
  });
});
