import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { getApiClientRecords } from "@/modules/api-clients/data";
import { ApiClientsWorkspace } from "@/modules/api-clients/workspace";

describe("ApiClientsWorkspace", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("loads queue state from URL params", () => {
    window.history.replaceState(null, "", "/api-clients?status=approved&client=api-client-002");

    render(
      <ApiClientsWorkspace
        actor="Operations Admin"
        initialRecords={getApiClientRecords()}
        role="operations"
      />,
    );

    expect(screen.getByDisplayValue("approved")).toBeInTheDocument();
    expect(screen.getAllByText("RouteFlow Integrations").length).toBeGreaterThan(0);
  });

  it("starts review then approves pending API clients", async () => {
    render(
      <ApiClientsWorkspace
        actor="Operations Admin"
        initialRecords={getApiClientRecords()}
        role="operations"
      />,
    );

    fireEvent.change(screen.getByDisplayValue("growth"), {
      target: { value: "starter" },
    });
    fireEvent.change(screen.getByDisplayValue("120"), {
      target: { value: "120" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Capture approval context/i), {
      target: { value: "Approved after enterprise-travel procurement validation." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start review" }));
    await waitFor(() => {
      expect(screen.getAllByText(/started API client review/i).length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getByRole("button", { name: "Approve client" }));

    await waitFor(() => {
      expect(screen.getAllByText(/approved API client/i).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("approved").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Approve client" })).toBeInTheDocument();
  });

  it("issues keys for approved clients", async () => {
    render(
      <ApiClientsWorkspace
        actor="Operations Admin"
        initialRecords={getApiClientRecords()}
        role="operations"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /RouteFlow Integrations/i }));
    fireEvent.change(screen.getByDisplayValue("60"), {
      target: { value: "80" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Issue key" }));

    await waitFor(() => {
      expect(screen.getAllByText(/issued an API key/i).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("active").length).toBeGreaterThan(0);
  });

  it("regenerates keys for active clients", async () => {
    render(
      <ApiClientsWorkspace
        actor="Operations Admin"
        initialRecords={getApiClientRecords()}
        role="operations"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /SkyPath Consolidators/i }));
    fireEvent.click(screen.getByRole("button", { name: "Regenerate key" }));

    await waitFor(() => {
      expect(screen.getAllByText(/regenerated the API key/i).length).toBeGreaterThan(0);
    });
    expect(screen.getByText("Key regenerated")).toBeInTheDocument();
  });

  it("shows only eligible plan choices for pending applications", async () => {
    render(
      <ApiClientsWorkspace
        actor="Operations Admin"
        initialRecords={getApiClientRecords()}
        role="operations"
      />,
    );

    const planBand = await screen.findByText("Plan and quota");
    const detailPanel = planBand.closest("article");
    expect(detailPanel).not.toBeNull();
    const planSelect = within(detailPanel as HTMLElement).getByDisplayValue("growth");

    expect(within(planSelect).getByRole("option", { name: "starter" })).toBeEnabled();
    expect(within(planSelect).getByRole("option", { name: "growth" })).toBeEnabled();
    expect(within(planSelect).getByRole("option", { name: "enterprise" })).toBeDisabled();
  });
});
