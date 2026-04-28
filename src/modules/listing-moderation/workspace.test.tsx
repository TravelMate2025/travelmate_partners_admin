import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { getListingModerationRecords } from "@/modules/listing-moderation/data";
import { ListingModerationWorkspace } from "@/modules/listing-moderation/workspace";

describe("ListingModerationWorkspace", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("loads queue selection from URL state", () => {
    window.history.replaceState(null, "", "/moderation?kind=transfer&listing=listing-transfer-001&media=media-transfer-2");

    render(
      <ListingModerationWorkspace
        actor="Reviewer lane"
        initialRecords={getListingModerationRecords()}
        role="reviewer"
      />,
    );

    expect(screen.getByDisplayValue("transfer")).toBeInTheDocument();
    expect(screen.getAllByText("Accra Executive Airport Pickup").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Airport arrival meet-and-greet visual used on the transfer detail page.").length).toBeGreaterThan(0);
  });

  it("supports correction requests for pending listings", async () => {
    render(
      <ListingModerationWorkspace
        actor="Reviewer lane"
        initialRecords={getListingModerationRecords()}
        role="reviewer"
      />,
    );

    fireEvent.change(screen.getByDisplayValue("content quality"), {
      target: { value: "missing_details" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Capture moderation reason/i), {
      target: { value: "Please clarify amenities and route coverage before resubmitting." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send back for edits" }));

    await waitFor(() => {
      expect(screen.getAllByText("rejected").length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(/executed send_back/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Please clarify amenities and route coverage/i).length).toBeGreaterThan(0);
  });

  it("requires a moderation note for flag actions", async () => {
    render(
      <ListingModerationWorkspace
        actor="Operations Admin"
        initialRecords={getListingModerationRecords()}
        role="operations"
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/Capture moderation reason/i), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Flag" }));

    await waitFor(() => {
      expect(
        screen.getByText("Provide a moderation note when flagging or emergency-unpublishing a listing."),
      ).toBeInTheDocument();
    });
  });

  it("supports bulk flag actions for selected listings", async () => {
    render(
      <ListingModerationWorkspace
        actor="Operations Admin"
        initialRecords={getListingModerationRecords()}
        role="operations"
      />,
    );

    fireEvent.click(screen.getByLabelText("Select Accra Executive Airport Pickup"));
    fireEvent.change(screen.getByPlaceholderText(/Capture moderation reason/i), {
      target: { value: "Bulk compliance follow-up required." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Bulk flag selected" }));

    await waitFor(() => {
      expect(screen.getAllByText(/executed flag for 2 listings/i).length).toBeGreaterThan(0);
    });
  });

  it("supports bulk approval for multiple pending listings", async () => {
    render(
      <ListingModerationWorkspace
        actor="Operations Admin"
        initialRecords={getListingModerationRecords()}
        role="operations"
      />,
    );

    fireEvent.click(screen.getByLabelText("Select Accra Executive Airport Pickup"));
    fireEvent.change(screen.getByPlaceholderText(/Capture moderation reason/i), {
      target: { value: "Approved after final compliance check." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Bulk approve selected" }));

    await waitFor(() => {
      expect(screen.getAllByText(/executed approve for 2 listings/i).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("approved").length).toBeGreaterThan(0);
  });

  it("disables invalid bulk actions for mixed moderation states", () => {
    render(
      <ListingModerationWorkspace
        actor="Operations Admin"
        initialRecords={getListingModerationRecords()}
        role="operations"
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/Search listing, partner, or location/i), {
      target: { value: "River Lodge" },
    });
    fireEvent.click(screen.getByLabelText("Select Savannah Retreat River Lodge"));

    expect(screen.getByRole("button", { name: "Bulk approve selected" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Bulk reject selected" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Bulk emergency unpublish selected" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Bulk flag selected" })).toBeEnabled();
  });
});
