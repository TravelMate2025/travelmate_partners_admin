import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { DisbursementQueueClient } from "@/modules/financial-ops/disbursement-queue-client";
import type { DisbursementListResult } from "@/modules/financial-ops/types";

function makeData(): DisbursementListResult {
  return {
    results: [
      {
        id: "disb-001",
        settlementId: "settle-001",
        bookingReference: "BK-001",
        provider: "flutterwave",
        providerReference: "FLW-001",
        amount: 12000,
        currency: "NGN",
        status: "failed",
        retryCount: 0,
        initiatedAt: null,
        confirmedAt: null,
        failedAt: "2026-05-19T10:00:00Z",
        failureReason: "timeout",
        cancellationOptionSelection: null,
        createdAt: "2026-05-19T09:00:00Z",
        updatedAt: "2026-05-19T10:00:00Z",
      },
    ],
    total: 1,
    page: 1,
    pageSize: 50,
    totalPages: 1,
  };
}

describe("DisbursementQueueClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  it("runs single disbursement and shows success feedback", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: "disb-002",
          settlementId: "settle-xyz",
          bookingReference: "BK-XYZ",
          provider: "flutterwave",
          providerReference: "FLW-XYZ",
          amount: 22000,
          currency: "NGN",
          status: "initiated",
          retryCount: 0,
          initiatedAt: "2026-05-19T11:00:00Z",
          confirmedAt: null,
          failedAt: null,
          failureReason: null,
          cancellationOptionSelection: null,
          createdAt: "2026-05-19T11:00:00Z",
          updatedAt: "2026-05-19T11:00:00Z",
        },
      }),
    });

    render(<DisbursementQueueClient data={makeData()} error={null} />);

    fireEvent.change(screen.getByPlaceholderText("Settlement ID"), { target: { value: "settle-xyz" } });
    fireEvent.click(screen.getByRole("button", { name: "Run Disbursement" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/backend/financial-ops/disbursements/run",
        expect.objectContaining({ method: "POST" }),
      );
    });

    expect(await screen.findByText("Disbursement initiated for settle-xyz.")).toBeInTheDocument();
  });

  it("runs batch disbursement and shows summary feedback", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          processed: 2,
          succeeded: 2,
          failed: 0,
          results: [
            {
              result: {
                id: "disb-003",
                settlementId: "settle-003",
                bookingReference: "BK-003",
                provider: "flutterwave",
                providerReference: "FLW-003",
                amount: 10000,
                currency: "NGN",
                status: "initiated",
                retryCount: 0,
                initiatedAt: "2026-05-19T11:00:00Z",
                confirmedAt: null,
                failedAt: null,
                failureReason: null,
                cancellationOptionSelection: null,
                createdAt: "2026-05-19T11:00:00Z",
                updatedAt: "2026-05-19T11:00:00Z",
              },
            },
            { result: null },
          ],
        },
      }),
    });

    render(<DisbursementQueueClient data={makeData()} error={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Run Batch" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/backend/financial-ops/disbursements/run-batch",
        expect.objectContaining({ method: "POST" }),
      );
    });

    expect(await screen.findByText("Batch complete: processed 2, succeeded 2, failed 0.")).toBeInTheDocument();
  });
});
