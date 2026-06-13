/**
 * Tests for Phase 15 (120.2b) disbursement types and server fetch functions.
 */

import { vi } from "vitest";

vi.mock("@/modules/auth/session", () => ({
  getAdminApiBaseUrl: vi.fn().mockReturnValue("http://localhost:8000/api/v1"),
  getStoredAdminSession: vi.fn().mockResolvedValue({ backendSessionKey: "test-session-key" }),
  ADMIN_API_SESSION_COOKIE: "admin_session",
}));

import type {
  BatchDisbursementResult,
  DisbursementBalanceCheck,
  DisbursementListResult,
  DisbursementRecord,
  DisbursementStatus,
  EligibleDisbursementSettlementListResult,
} from "@/modules/financial-ops/types";

// ---------------------------------------------------------------------------
// Type-level shape tests (compile-time guard — runtime presence checks)
// ---------------------------------------------------------------------------

function makeDisbursementRecord(overrides: Partial<DisbursementRecord> = {}): DisbursementRecord {
  return {
    id: "disb-001",
    settlementId: "settle-001",
    bookingReference: "BK-001",
    provider: "flutterwave",
    providerReference: "FLW-9999",
    amount: 20000,
    currency: "NGN",
    status: "initiated",
    retryCount: 0,
    initiatedAt: "2026-05-19T10:00:00Z",
    confirmedAt: null,
    failedAt: null,
    failureReason: null,
    cancellationOptionSelection: null,
    createdAt: "2026-05-19T09:55:00Z",
    updatedAt: "2026-05-19T10:00:01Z",
    ...overrides,
  };
}

function makeDisbursementListResult(overrides: Partial<DisbursementListResult> = {}): DisbursementListResult {
  return {
    results: [makeDisbursementRecord()],
    total: 1,
    page: 1,
    pageSize: 50,
    totalPages: 1,
    ...overrides,
  };
}

function makeDisbursementBalanceCheck(overrides: Partial<DisbursementBalanceCheck> = {}): DisbursementBalanceCheck {
  return {
    currency: "NGN",
    platformBalance: 99000,
    pendingDisbursementTotal: 20000,
    isSufficient: true,
    balanceError: null,
    ...overrides,
  };
}

function makeBatchDisbursementResult(overrides: Partial<BatchDisbursementResult> = {}): BatchDisbursementResult {
  return {
    processed: 2,
    succeeded: 2,
    failed: 0,
    results: [
      { settlementId: "s-001", result: makeDisbursementRecord(), error: null },
      { settlementId: "s-002", result: makeDisbursementRecord({ id: "disb-002", settlementId: "s-002" }), error: null },
    ],
    ...overrides,
  };
}

function makeEligibleDisbursementSettlementListResult(
  overrides: Partial<EligibleDisbursementSettlementListResult> = {},
): EligibleDisbursementSettlementListResult {
  return {
    results: [
      {
        id: "settle-eligible-001",
        settlementId: "settle-eligible-001",
        bookingReference: "BK-ELIGIBLE-001",
        partnerName: "Safari Crest Residences",
        amount: 130890,
        currency: "NGN",
        status: "paid",
        disbursementState: "not_disbursed",
        label: "BK-ELIGIBLE-001 · Safari Crest Residences · NGN 130,890.00 · paid · not disbursed",
        updatedAt: "2026-06-11T10:00:00Z",
      },
    ],
    total: 1,
    page: 1,
    pageSize: 50,
    totalPages: 1,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// DisbursementStatus: all valid values
// ---------------------------------------------------------------------------

describe("DisbursementStatus type values", () => {
  const validStatuses: DisbursementStatus[] = [
    "queued",
    "initiated",
    "processing",
    "success",
    "failed",
    "cancelled",
  ];

  it("covers all 6 status values", () => {
    expect(validStatuses).toHaveLength(6);
    expect(validStatuses).toContain("queued");
    expect(validStatuses).toContain("initiated");
    expect(validStatuses).toContain("processing");
    expect(validStatuses).toContain("success");
    expect(validStatuses).toContain("failed");
    expect(validStatuses).toContain("cancelled");
  });
});

// ---------------------------------------------------------------------------
// DisbursementRecord shape
// ---------------------------------------------------------------------------

describe("DisbursementRecord", () => {
  it("has required fields", () => {
    const record = makeDisbursementRecord();
    expect(record.id).toBeDefined();
    expect(record.settlementId).toBeDefined();
    expect(record.bookingReference).toBeDefined();
    expect(record.provider).toBe("flutterwave");
    expect(record.amount).toBeGreaterThan(0);
    expect(record.currency).toBe("NGN");
    expect(record.status).toBe("initiated");
  });

  it("allows null timestamps", () => {
    const record = makeDisbursementRecord({ confirmedAt: null, failedAt: null, failureReason: null });
    expect(record.confirmedAt).toBeNull();
    expect(record.failedAt).toBeNull();
    expect(record.failureReason).toBeNull();
  });

  it("can represent a failed disbursement", () => {
    const record = makeDisbursementRecord({
      status: "failed",
      failedAt: "2026-05-19T10:05:00Z",
      failureReason: "Account closed",
    });
    expect(record.status).toBe("failed");
    expect(record.failureReason).toBe("Account closed");
    expect(record.failedAt).toBe("2026-05-19T10:05:00Z");
  });
});

// ---------------------------------------------------------------------------
// DisbursementListResult shape
// ---------------------------------------------------------------------------

describe("DisbursementListResult", () => {
  it("wraps disbursement records with pagination metadata", () => {
    const result = makeDisbursementListResult({ total: 10, page: 2, pageSize: 5, totalPages: 2 });
    expect(result.total).toBe(10);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(5);
    expect(result.totalPages).toBe(2);
    expect(Array.isArray(result.results)).toBe(true);
  });

  it("can have empty results", () => {
    const result = makeDisbursementListResult({ results: [], total: 0, totalPages: 1 });
    expect(result.results).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// DisbursementBalanceCheck shape
// ---------------------------------------------------------------------------

describe("DisbursementBalanceCheck", () => {
  it("returns sufficient=true when balance covers pending total", () => {
    const check = makeDisbursementBalanceCheck({ platformBalance: 50000, pendingDisbursementTotal: 20000 });
    expect(check.isSufficient).toBe(true);
  });

  it("returns sufficient=false when balance is less than pending", () => {
    const check = makeDisbursementBalanceCheck({ platformBalance: 5000, pendingDisbursementTotal: 20000, isSufficient: false });
    expect(check.isSufficient).toBe(false);
  });

  it("allows null platformBalance and isSufficient when balance fetch fails", () => {
    const check = makeDisbursementBalanceCheck({
      platformBalance: null,
      isSufficient: null,
      balanceError: "Flutterwave balance endpoint error",
    });
    expect(check.platformBalance).toBeNull();
    expect(check.isSufficient).toBeNull();
    expect(check.balanceError).toBe("Flutterwave balance endpoint error");
  });
});

// ---------------------------------------------------------------------------
// BatchDisbursementResult shape
// ---------------------------------------------------------------------------

describe("BatchDisbursementResult", () => {
  it("reports processed/succeeded/failed counts", () => {
    const result = makeBatchDisbursementResult({ processed: 3, succeeded: 2, failed: 1 });
    expect(result.processed).toBe(3);
    expect(result.succeeded).toBe(2);
    expect(result.failed).toBe(1);
  });

  it("includes per-settlement results with error field", () => {
    const result = makeBatchDisbursementResult({
      results: [
        { settlementId: "s-001", result: makeDisbursementRecord(), error: null },
        { settlementId: "s-002", result: null, error: "Verified account not found." },
      ],
      processed: 2,
      succeeded: 1,
      failed: 1,
    });
    expect(result.results[0].error).toBeNull();
    expect(result.results[1].result).toBeNull();
    expect(result.results[1].error).toBe("Verified account not found.");
  });
});

// ---------------------------------------------------------------------------
// Server function return-type contracts (mock fetch)
// ---------------------------------------------------------------------------

describe("getDisbursementsFromApi", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("returns data on success", async () => {
    const listResult = makeDisbursementListResult();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: listResult }),
    });

    const { getDisbursementsFromApi } = await import("@/modules/financial-ops/server");
    const result = await getDisbursementsFromApi(1, 50);
    expect(result.error).toBeNull();
    expect(result.data?.total).toBe(1);
  });

  it("returns error when fetch fails", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network down"));

    const { getDisbursementsFromApi } = await import("@/modules/financial-ops/server");
    const result = await getDisbursementsFromApi();
    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });
});

describe("getDisbursementBalanceCheckFromApi", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("returns balance check data on success", async () => {
    const balanceCheck = makeDisbursementBalanceCheck();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: balanceCheck }),
    });

    const { getDisbursementBalanceCheckFromApi } = await import("@/modules/financial-ops/server");
    const result = await getDisbursementBalanceCheckFromApi("NGN");
    expect(result.error).toBeNull();
    expect(result.data?.isSufficient).toBe(true);
  });

  it("returns error on non-ok response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ message: "Forbidden" }),
    });

    const { getDisbursementBalanceCheckFromApi } = await import("@/modules/financial-ops/server");
    const result = await getDisbursementBalanceCheckFromApi();
    expect(result.data).toBeNull();
    expect(result.error).toBe("Forbidden");
  });
});

describe("getEligibleDisbursementSettlementsFromApi", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("returns eligible settlements on success", async () => {
    const listResult = makeEligibleDisbursementSettlementListResult();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: listResult }),
    });

    const { getEligibleDisbursementSettlementsFromApi } = await import("@/modules/financial-ops/server");
    const result = await getEligibleDisbursementSettlementsFromApi(1, 50);
    expect(result.error).toBeNull();
    expect(result.data?.total).toBe(1);
    expect(result.data?.results[0].label).toContain("not disbursed");
  });

  it("returns error when fetch fails", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network down"));

    const { getEligibleDisbursementSettlementsFromApi } = await import("@/modules/financial-ops/server");
    const result = await getEligibleDisbursementSettlementsFromApi();
    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// DisbursementRecord.retryCount field (120.3b)
// ---------------------------------------------------------------------------

describe("DisbursementRecord retryCount", () => {
  it("defaults to 0 for a new disbursement", () => {
    const record = makeDisbursementRecord();
    expect(record.retryCount).toBe(0);
  });

  it("can represent a disbursement that has been retried", () => {
    const record = makeDisbursementRecord({ retryCount: 2, status: "failed" });
    expect(record.retryCount).toBe(2);
    expect(record.status).toBe("failed");
  });

  it("can represent a cancelled disbursement after max retries", () => {
    const record = makeDisbursementRecord({
      retryCount: 3,
      status: "cancelled",
      failureReason: "Disbursement cancelled after 3 retry attempt(s). Manual resolution required.",
    });
    expect(record.retryCount).toBe(3);
    expect(record.status).toBe("cancelled");
    expect(record.failureReason).toContain("Manual resolution required");
  });
});

// ---------------------------------------------------------------------------
// retryDisbursementFromApi (120.3b)
// ---------------------------------------------------------------------------

describe("retryDisbursementFromApi", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("returns updated disbursement record on success", async () => {
    const retried = makeDisbursementRecord({ status: "initiated", retryCount: 1, providerReference: "FLW-RETRY" });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: retried }),
    });

    const { retryDisbursementFromApi } = await import("@/modules/financial-ops/server");
    const result = await retryDisbursementFromApi("settle-001");
    expect(result.error).toBeNull();
    expect(result.data?.status).toBe("initiated");
    expect(result.data?.retryCount).toBe(1);
  });

  it("returns error when session unavailable", async () => {
    vi.mocked(
      (await import("@/modules/auth/session")).getStoredAdminSession
    ).mockResolvedValueOnce(null as never);

    const { retryDisbursementFromApi } = await import("@/modules/financial-ops/server");
    const result = await retryDisbursementFromApi("settle-001");
    expect(result.data).toBeNull();
    expect(result.error).toContain("session");
  });

  it("returns error on non-ok response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: "Settlement not in retryable state." }),
    });

    const { retryDisbursementFromApi } = await import("@/modules/financial-ops/server");
    const result = await retryDisbursementFromApi("settle-001");
    expect(result.data).toBeNull();
    expect(result.error).toBe("Settlement not in retryable state.");
  });

  it("returns error on fetch failure", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network down"));

    const { retryDisbursementFromApi } = await import("@/modules/financial-ops/server");
    const result = await retryDisbursementFromApi("settle-001");
    expect(result.data).toBeNull();
    expect(result.error).toContain("retry");
  });
});
