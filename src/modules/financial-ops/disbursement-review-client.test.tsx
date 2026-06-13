import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DisbursementReviewClient } from "@/modules/financial-ops/disbursement-review-client";
import type { EligibleDisbursementSettlementListResult } from "@/modules/financial-ops/types";

function makeEligibleSettlements(): EligibleDisbursementSettlementListResult {
  return {
    results: [
      {
        id: "settle-001",
        settlementId: "settle-001",
        bookingReference: "BK-001",
        partnerName: "Safari Crest Residences",
        amount: 130890,
        currency: "NGN",
        status: "paid",
        disbursementState: "not_disbursed",
        label: "BK-001 · Safari Crest Residences · NGN 130,890.00 · paid · not disbursed",
        updatedAt: "2026-06-11T10:00:00Z",
      },
      {
        id: "settle-002",
        settlementId: "settle-002",
        bookingReference: "BK-002",
        partnerName: "Lagoon Suites",
        amount: 96000,
        currency: "NGN",
        status: "paid",
        disbursementState: "not_disbursed",
        label: "BK-002 · Lagoon Suites · NGN 96,000.00 · paid · not disbursed",
        updatedAt: "2026-06-11T11:00:00Z",
      },
    ],
    total: 2,
    page: 1,
    pageSize: 50,
    totalPages: 1,
  };
}

describe("DisbursementReviewClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  it("runs a selected disbursement from the dedicated screen", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: "disb-001",
          settlementId: "settle-001",
          bookingReference: "BK-001",
          provider: "flutterwave",
          providerReference: "FLW-001",
          amount: 130890,
          currency: "NGN",
          status: "initiated",
          retryCount: 0,
          initiatedAt: "2026-06-11T12:00:00Z",
          confirmedAt: null,
          failedAt: null,
          failureReason: null,
          cancellationOptionSelection: null,
          createdAt: "2026-06-11T12:00:00Z",
          updatedAt: "2026-06-11T12:00:00Z",
        },
      }),
    });

    render(
      <DisbursementReviewClient
        balanceCheck={{ currency: "NGN", platformBalance: 300000, pendingDisbursementTotal: 226890, isSufficient: true, balanceError: null }}
        balanceCheckError={null}
        eligibleSettlements={makeEligibleSettlements()}
        eligibleSettlementsError={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Run Disbursement" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/backend/financial-ops/disbursements/run",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("runs batch disbursement from the dedicated screen", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          processed: 2,
          succeeded: 2,
          failed: 0,
          results: [
            { settlementId: "settle-001", result: null },
            { settlementId: "settle-002", result: null },
          ],
        },
      }),
    });

    render(
      <DisbursementReviewClient
        balanceCheck={{ currency: "NGN", platformBalance: 300000, pendingDisbursementTotal: 226890, isSufficient: true, balanceError: null }}
        balanceCheckError={null}
        eligibleSettlements={makeEligibleSettlements()}
        eligibleSettlementsError={null}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Run Batch" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/backend/financial-ops/disbursements/run-batch",
        expect.objectContaining({ method: "POST" }),
      );
    });

    expect(await screen.findByText("Batch complete: processed 2, succeeded 2, failed 0.")).toBeInTheDocument();
  });

  it("shows empty state when no settlements are eligible", () => {
    render(
      <DisbursementReviewClient
        balanceCheck={{ currency: "NGN", platformBalance: 300000, pendingDisbursementTotal: 0, isSufficient: true, balanceError: null }}
        balanceCheckError={null}
        eligibleSettlements={{ results: [], total: 0, page: 1, pageSize: 50, totalPages: 1 }}
        eligibleSettlementsError={null}
      />,
    );

    expect(screen.getByText("No paid, undisbursed settlements are available right now.")).toBeInTheDocument();
  });
});
