import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { getCatalogIssueRecords, getTaxonomyRuleRecords } from "@/modules/catalog-controls/data";
import { CatalogControlsWorkspace } from "@/modules/catalog-controls/workspace";

describe("CatalogControlsWorkspace", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("loads quality queue state from URL params", () => {
    window.history.replaceState(
      null,
      "",
      "/catalog-controls?issue=taxonomy&kind=transfer&record=catalog-issue-002",
    );

    render(
      <CatalogControlsWorkspace
        actor="Operations Admin"
        initialRecords={getCatalogIssueRecords()}
        initialRules={getTaxonomyRuleRecords()}
        role="operations"
      />,
    );

    expect(screen.getByDisplayValue("taxonomy")).toBeInTheDocument();
    expect(screen.getByDisplayValue("transfer")).toBeInTheDocument();
    expect(screen.getAllByText("Accra Gold Line Executive Shuttle").length).toBeGreaterThan(0);
  });

  it("resolves taxonomy issues through the review workspace", async () => {
    render(
      <CatalogControlsWorkspace
        actor="Operations Admin"
        initialRecords={getCatalogIssueRecords()}
        initialRules={getTaxonomyRuleRecords()}
        role="operations"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Accra Gold Line Executive Shuttle/i }));
    fireEvent.change(screen.getByPlaceholderText(/Capture the correction/i), {
      target: { value: "Normalized transfer labels to approved catalog taxonomy." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Standardize taxonomy" }));

    await waitFor(() => {
      expect(screen.getAllByText(/standardized taxonomy/i).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("resolved").length).toBeGreaterThan(0);
  });

  it("supports taxonomy rule updates and explicit loading state handling", async () => {
    const { rerender } = render(
      <CatalogControlsWorkspace
        actor="Operations Admin"
        initialRecords={getCatalogIssueRecords()}
        initialRules={getTaxonomyRuleRecords()}
        role="operations"
        surfaceState={{
          status: "loading",
          title: "Loading catalog controls",
          description: "Preparing quality signals and taxonomy rules.",
        }}
      />,
    );

    expect(screen.getByText("Loading catalog controls")).toBeInTheDocument();

    rerender(
      <CatalogControlsWorkspace
        actor="Operations Admin"
        initialRecords={getCatalogIssueRecords()}
        initialRules={getTaxonomyRuleRecords()}
        role="operations"
      />,
    );

    fireEvent.change(screen.getByDisplayValue("Executive SUV"), {
      target: { value: "Executive Crossover" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save taxonomy rule" }));

    await waitFor(() => {
      expect(screen.getAllByText(/updated taxonomy rule/i).length).toBeGreaterThan(0);
    });
    expect(screen.getByDisplayValue("Executive Crossover")).toBeInTheDocument();
  });
});
