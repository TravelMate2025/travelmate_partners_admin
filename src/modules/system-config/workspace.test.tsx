import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { getSystemConfigRecords } from "@/modules/system-config/data";
import { SystemConfigWorkspace } from "@/modules/system-config/workspace";

describe("SystemConfigWorkspace", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("renders the first record and shows detail panel heading", () => {
    render(<SystemConfigWorkspace actor="Amina Bello" initialRecords={getSystemConfigRecords()} role="super_admin" />);

    expect(screen.getByText("Configuration Detail")).toBeInTheDocument();
    expect(screen.getAllByText(getSystemConfigRecords()[0].name).length).toBeGreaterThan(0);
  });

  it("loads URL state: section=toggles and item=sysc-010", () => {
    window.history.replaceState(null, "", "/system-config?section=toggles&item=sysc-010");

    render(<SystemConfigWorkspace actor="Amina Bello" initialRecords={getSystemConfigRecords()} role="super_admin" />);

    expect(screen.getByLabelText("Configuration section")).toHaveValue("toggles");
    expect(screen.getAllByText("Partner Bulk Upload").length).toBeGreaterThan(0);
  });

  it("loads URL state: section=regions and item=sysc-019", () => {
    window.history.replaceState(null, "", "/system-config?section=regions&item=sysc-019");

    render(<SystemConfigWorkspace actor="Amina Bello" initialRecords={getSystemConfigRecords()} role="super_admin" />);

    expect(screen.getByLabelText("Configuration section")).toHaveValue("regions");
    expect(screen.getAllByText("Nairobi").length).toBeGreaterThan(0);
  });

  it("filters by section=regions to show only region items", () => {
    render(<SystemConfigWorkspace actor="Amina Bello" initialRecords={getSystemConfigRecords()} role="super_admin" />);

    fireEvent.change(screen.getByLabelText("Configuration section"), { target: { value: "regions" } });

    expect(screen.getAllByText("Kenya").length).toBeGreaterThan(0);
    expect(screen.queryByText("WiFi")).not.toBeInTheDocument();
  });

  it("filters by section=templates to show only moderation template items", () => {
    render(<SystemConfigWorkspace actor="Amina Bello" initialRecords={getSystemConfigRecords()} role="super_admin" />);

    fireEvent.change(screen.getByLabelText("Configuration section"), { target: { value: "templates" } });

    expect(screen.getAllByText(/Listing Rejected/).length).toBeGreaterThan(0);
    expect(screen.queryByText("WiFi")).not.toBeInTheDocument();
  });

  it("filters by section=content to show only static content items", () => {
    render(<SystemConfigWorkspace actor="Amina Bello" initialRecords={getSystemConfigRecords()} role="super_admin" />);

    fireEvent.change(screen.getByLabelText("Configuration section"), { target: { value: "content" } });

    expect(screen.getAllByText(/Partner Terms of Service/).length).toBeGreaterThan(0);
    expect(screen.queryByText("WiFi")).not.toBeInTheDocument();
  });

  it("super_admin can publish a draft taxonomy item", async () => {
    render(<SystemConfigWorkspace actor="Amina Bello" initialRecords={getSystemConfigRecords()} role="super_admin" />);

    fireEvent.click(screen.getByText("Airport Parking"));
    fireEvent.change(screen.getByLabelText("Operator note"), {
      target: { value: "Airport parking amenity reviewed and cleared for partner use." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Publish taxonomy item" }));

    await waitFor(() => {
      expect(screen.getAllByText(/queued config change for backend propagation/i).length).toBeGreaterThan(0);
    });
  });

  it("super_admin can activate a draft service region", async () => {
    render(<SystemConfigWorkspace actor="Amina Bello" initialRecords={getSystemConfigRecords()} role="super_admin" />);

    fireEvent.change(screen.getByLabelText("Configuration section"), { target: { value: "regions" } });
    fireEvent.click(screen.getByText("Nairobi CBD"));
    fireEvent.change(screen.getByLabelText("Operator note"), {
      target: { value: "Supply team signed off. Nairobi CBD service area ready to go live." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Activate region" }));

    await waitFor(() => {
      expect(screen.getAllByText(/queued config change for backend propagation/i).length).toBeGreaterThan(0);
    });
  });

  it("super_admin can publish a draft moderation template", async () => {
    render(<SystemConfigWorkspace actor="Amina Bello" initialRecords={getSystemConfigRecords()} role="super_admin" />);

    fireEvent.change(screen.getByLabelText("Configuration section"), { target: { value: "templates" } });
    fireEvent.click(screen.getByText("Listing: Send Back for Corrections"));
    fireEvent.change(screen.getByLabelText("Operator note"), {
      target: { value: "Moderation team reviewed and approved send-back template." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Publish template" }));

    await waitFor(() => {
      expect(screen.getAllByText(/queued config change for backend propagation/i).length).toBeGreaterThan(0);
    });
  });

  it("super_admin can publish draft static content", async () => {
    render(<SystemConfigWorkspace actor="Amina Bello" initialRecords={getSystemConfigRecords()} role="super_admin" />);

    fireEvent.change(screen.getByLabelText("Configuration section"), { target: { value: "content" } });
    fireEvent.click(screen.getByText("Platform Maintenance Schedule Update"));
    fireEvent.change(screen.getByLabelText("Operator note"), {
      target: { value: "Ops team approved maintenance announcement for partner distribution." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Publish content" }));

    await waitFor(() => {
      expect(screen.getAllByText(/queued config change for backend propagation/i).length).toBeGreaterThan(0);
    });
  });

  it("operations cannot see publish or activate buttons", () => {
    render(<SystemConfigWorkspace actor="David Cole" initialRecords={getSystemConfigRecords()} role="operations" />);

    fireEvent.click(screen.getByText("Airport Parking"));

    expect(screen.queryByRole("button", { name: "Publish taxonomy item" })).not.toBeInTheDocument();
    expect(screen.getByText("No actions available for this item with the current role.")).toBeInTheDocument();
  });

  it("shows dependency block message when archiving an in-use template", async () => {
    render(<SystemConfigWorkspace actor="Amina Bello" initialRecords={getSystemConfigRecords()} role="super_admin" />);

    fireEvent.change(screen.getByLabelText("Configuration section"), { target: { value: "templates" } });
    fireEvent.click(screen.getByText("Listing Rejected: Insufficient Photos"));
    fireEvent.change(screen.getByLabelText("Operator note"), {
      target: { value: "Attempting to archive this active template." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));

    await waitFor(() => {
      expect(screen.getByText(/referenced by 47 active moderation workflows/i)).toBeInTheDocument();
    });
  });

  it("renders empty state when no records are provided", () => {
    render(<SystemConfigWorkspace actor="Amina Bello" initialRecords={[]} role="super_admin" />);

    expect(screen.getByText("Configuration workspace is empty")).toBeInTheDocument();
  });

  it("renders empty filter state with reset option", () => {
    render(<SystemConfigWorkspace actor="Amina Bello" initialRecords={getSystemConfigRecords()} role="super_admin" />);

    fireEvent.change(screen.getByLabelText("Search configuration items"), { target: { value: "xyznonexistent" } });

    expect(screen.getAllByText("No items match this view").length).toBeGreaterThan(0);
  });
});
