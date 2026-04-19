import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { getApiMonitoringRecords } from "@/modules/api-monitoring/data";
import { ApiMonitoringWorkspace } from "@/modules/api-monitoring/workspace";

describe("ApiMonitoringWorkspace", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("loads monitoring state from URL params", () => {
    window.history.replaceState(null, "", "/api-monitoring?category=rate_limit&record=api-anomaly-002");

    render(
      <ApiMonitoringWorkspace
        actor="Operations Admin"
        initialRecords={getApiMonitoringRecords()}
        role="operations"
      />,
    );

    expect(screen.getByDisplayValue("rate limit")).toBeInTheDocument();
    expect(screen.getAllByText("Rate-limit violation burst on partner export").length).toBeGreaterThan(0);
  });

  it("acknowledges alerts and moves them into investigation", async () => {
    render(
      <ApiMonitoringWorkspace
        actor="Operations Admin"
        initialRecords={getApiMonitoringRecords()}
        role="operations"
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/Capture investigation context/i), {
      target: { value: "Starting investigation on sustained latency spike." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Acknowledge alert" }));

    await waitFor(() => {
      expect(screen.getAllByText(/acknowledged API monitoring alert/i).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("investigating").length).toBeGreaterThan(0);
  });

  it("queues client containment from a critical anomaly", async () => {
    render(
      <ApiMonitoringWorkspace
        actor="Operations Admin"
        initialRecords={getApiMonitoringRecords()}
        role="operations"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Rate-limit violation burst on partner export/i }));
    fireEvent.change(screen.getByPlaceholderText(/Capture investigation context/i), {
      target: { value: "Containment handoff prepared for repeated export abuse." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Queue client containment" }));

    await waitFor(() => {
      expect(screen.getAllByText(/queued client containment/i).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("contained").length).toBeGreaterThan(0);
  });

  it("renders explicit empty and no-match states", () => {
    const { unmount } = render(<ApiMonitoringWorkspace actor="Operations Admin" initialRecords={[]} role="operations" />);

    expect(screen.getByText("API monitoring queue is empty")).toBeInTheDocument();

    unmount();
    render(
      <ApiMonitoringWorkspace
        actor="Operations Admin"
        initialRecords={getApiMonitoringRecords()}
        role="operations"
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/Search anomaly/i), {
      target: { value: "No anomaly like this" },
    });

    expect(screen.getAllByText("No API monitoring alerts match this view").length).toBeGreaterThan(0);
    expect(screen.getByText("Clear or relax the current filters to continue investigating live monitoring signals.")).toBeInTheDocument();
    expect(screen.queryByText("Selected API anomaly was not found")).not.toBeInTheDocument();
  });

  it("surfaces incident outcomes and client-governance linkage", async () => {
    render(
      <ApiMonitoringWorkspace
        actor="Operations Admin"
        initialRecords={getApiMonitoringRecords()}
        role="operations"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Rate-limit violation burst on partner export/i }));
    expect(screen.getByText("incident open")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open API client governance record" })).toHaveAttribute(
      "href",
      "/api-clients?client=api-client-002",
    );

    fireEvent.click(screen.getAllByRole("button", { name: /Error burst on booking read access/i })[0]);
    fireEvent.change(screen.getByPlaceholderText(/Capture investigation context/i), {
      target: { value: "Incident escalation prepared for booking webhook abuse." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Open incident" }));

    await waitFor(() => {
      expect(screen.getAllByText(/opened an incident from API monitoring alert/i).length).toBeGreaterThan(0);
    });

    expect(screen.getByText("incident open")).toBeInTheDocument();
    expect(screen.getByText(/Last linked action: open incident/i)).toBeInTheDocument();
  });
});
