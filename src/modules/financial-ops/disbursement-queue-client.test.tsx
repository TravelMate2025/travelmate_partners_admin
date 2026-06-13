import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DisbursementQueueClient } from "@/modules/financial-ops/disbursement-queue-client";

describe("DisbursementQueueClient", () => {
  it("links operators to the dedicated disbursement review screen", () => {
    render(<DisbursementQueueClient data={{ results: [], total: 0, page: 1, pageSize: 50, totalPages: 1 }} />);

    expect(screen.getByRole("link", { name: "Open disbursement review" })).toHaveAttribute(
      "href",
      "/financial-ops/disbursements",
    );
    expect(screen.getByText("Disbursement")).toBeInTheDocument();
    expect(
      screen.getByText("Disbursement now happens in the dedicated review screen, so this page stays focused on the broader finance overview."),
    ).toBeInTheDocument();
  });
});
