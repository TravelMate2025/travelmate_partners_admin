import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LocalitySuggestionsWorkspace } from "@/modules/locality-suggestions/workspace";

const baseSuggestion = {
  id: "loc-1",
  partnerId: "partner-1",
  country: "Nigeria",
  state: "Edo",
  city: "Unknown City",
  area: "Unknown City",
  subArea: "",
  latitude: null,
  longitude: null,
  normalizedSlug: "nigeria/edo/unknown-city/unknown-city",
  status: "pending" as const,
  reviewNote: "Auto-created from listing city outside canonical catalog.",
  reviewedBy: null,
  reviewedAt: null,
  createdAt: "2026-06-18T08:30:00Z",
  updatedAt: "2026-06-18T08:30:00Z",
  duplicateCityHints: ["Uselu"],
};

describe("LocalitySuggestionsWorkspace", () => {
  it("renders the submitted city in the admin queue", () => {
    render(<LocalitySuggestionsWorkspace initialRecords={[baseSuggestion]} />);

    expect(screen.getByText("Pending city suggestions")).toBeInTheDocument();
    expect(screen.getAllByText("Unknown City").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Edo · Nigeria/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Approved cities in scope/i)).toBeInTheDocument();
    expect(screen.getByText(/Type to search approved cities in this state\/region/i)).toBeInTheDocument();
  });

  it("allows reviewing the selected city suggestion", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchSpy);

    render(<LocalitySuggestionsWorkspace initialRecords={[baseSuggestion]} />);

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/backend/locality-suggestions/loc-1/decision",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    vi.unstubAllGlobals();
  });

  it("allows merging an area suggestion under an already approved city", async () => {
    const fetchSpy = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: ["Ajah"] }),
    });
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchSpy);

    render(
      <LocalitySuggestionsWorkspace
        initialRecords={[
          {
            ...baseSuggestion,
            id: "loc-2",
            city: "Ajah",
            area: "Oke Ira",
            normalizedSlug: "nigeria/edo/ajah/oke-ira",
          },
        ]}
      />,
    );

    fireEvent.click(screen.getAllByText("Ajah")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Merge" }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/backend/locality-suggestions/loc-2/decision",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    vi.unstubAllGlobals();
  });

  it("loads canonical cities for the selected scope", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: ["Benin City", "Auchi"] }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    render(<LocalitySuggestionsWorkspace initialRecords={[baseSuggestion]} />);

    fireEvent.change(screen.getByPlaceholderText("Search approved cities"), { target: { value: "be" } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/api/backend/locality-catalog/cities?country=Nigeria&state=Edo&q=be"),
        expect.objectContaining({ method: "GET" }),
      );
    });

    expect(await screen.findByText("Benin City")).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
