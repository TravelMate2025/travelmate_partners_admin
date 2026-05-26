import { ADMIN_API_SESSION_COOKIE, getAdminApiBaseUrl, getStoredAdminSession } from "@/modules/auth/session";
import type {
  FinancialOpsRecord,
  PlatformBalance,
  FailedPaymentAttempt,
  DisbursementListResult,
  DisbursementBalanceCheck,
  DisbursementRecord,
  BatchDisbursementResult,
} from "@/modules/financial-ops/types";

type Envelope<T> = { data?: T; message?: string; error?: { message?: string } };

export async function getFinancialOpsFromApi(
  page = 1,
  pageSize = 20,
): Promise<{
  records: FinancialOpsRecord[];
  total: number;
  page: number;
  pageSize: number;
  error: string | null;
}> {
  const session = await getStoredAdminSession();
  if (!session) {
    return { records: [], total: 0, page, pageSize, error: "Admin session is not available for financial operations." };
  }

  try {
    const response = await fetch(
      `${getAdminApiBaseUrl()}/admin/financial-ops/cases?page=${page}&page_size=${pageSize}`,
      {
        method: "GET",
        headers: {
          Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
        },
        cache: "no-store",
      },
    );
    const body = (await response.json().catch(() => null)) as Envelope<{
      records: FinancialOpsRecord[];
      total: number;
      page: number;
      pageSize: number;
    }> | null;
    if (!response.ok || !body?.data?.records) {
      return {
        records: [],
        total: 0,
        page,
        pageSize,
        error: body?.message ?? body?.error?.message ?? "Unable to load financial operations queue.",
      };
    }
    return {
      records: body.data.records,
      total: body.data.total ?? body.data.records.length,
      page: body.data.page ?? page,
      pageSize: body.data.pageSize ?? pageSize,
      error: null,
    };
  } catch {
    return { records: [], total: 0, page, pageSize, error: "Unable to load financial operations queue." };
  }
}

export async function getPlatformBalanceFromApi(currency = "NGN"): Promise<{
  balance: PlatformBalance | null;
  error: string | null;
}> {
  const session = await getStoredAdminSession();
  if (!session) {
    return { balance: null, error: "Admin session is not available." };
  }
  try {
    const response = await fetch(`${getAdminApiBaseUrl()}/admin/payments/balance?currency=${encodeURIComponent(currency)}`, {
      method: "GET",
      headers: { Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}` },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as Envelope<PlatformBalance> | null;
    if (!response.ok || !body?.data) {
      return { balance: null, error: body?.message ?? "Unable to load platform balance." };
    }
    return { balance: body.data, error: null };
  } catch {
    return { balance: null, error: "Unable to load platform balance." };
  }
}

export async function getFailedPaymentAttemptsFromApi(page = 1, pageSize = 20): Promise<{
  results: FailedPaymentAttempt[];
  total: number;
  error: string | null;
}> {
  const session = await getStoredAdminSession();
  if (!session) {
    return { results: [], total: 0, error: "Admin session is not available." };
  }
  try {
    const response = await fetch(
      `${getAdminApiBaseUrl()}/admin/payments/failed-attempts?page=${page}&pageSize=${pageSize}`,
      {
        method: "GET",
        headers: { Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}` },
        cache: "no-store",
      },
    );
    const body = (await response.json().catch(() => null)) as Envelope<{
      results: FailedPaymentAttempt[];
      total: number;
    }> | null;
    if (!response.ok || !body?.data) {
      return { results: [], total: 0, error: body?.message ?? "Unable to load failed payment attempts." };
    }
    return { results: body.data.results, total: body.data.total, error: null };
  } catch {
    return { results: [], total: 0, error: "Unable to load failed payment attempts." };
  }
}

export async function getDisbursementsFromApi(page = 1, pageSize = 50): Promise<{
  data: DisbursementListResult | null;
  error: string | null;
}> {
  const session = await getStoredAdminSession();
  if (!session) {
    return { data: null, error: "Admin session is not available." };
  }
  try {
    const response = await fetch(
      `${getAdminApiBaseUrl()}/admin/financial-ops/disbursements?page=${page}&pageSize=${pageSize}`,
      {
        method: "GET",
        headers: { Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}` },
        cache: "no-store",
      },
    );
    const body = (await response.json().catch(() => null)) as Envelope<DisbursementListResult> | null;
    if (!response.ok || !body?.data) {
      return { data: null, error: body?.message ?? "Unable to load disbursements." };
    }
    return { data: body.data, error: null };
  } catch {
    return { data: null, error: "Unable to load disbursements." };
  }
}

export async function getDisbursementBalanceCheckFromApi(currency = "NGN"): Promise<{
  data: DisbursementBalanceCheck | null;
  error: string | null;
}> {
  const session = await getStoredAdminSession();
  if (!session) {
    return { data: null, error: "Admin session is not available." };
  }
  try {
    const response = await fetch(
      `${getAdminApiBaseUrl()}/admin/financial-ops/disbursements/balance-check?currency=${encodeURIComponent(currency)}`,
      {
        method: "GET",
        headers: { Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}` },
        cache: "no-store",
      },
    );
    const body = (await response.json().catch(() => null)) as Envelope<DisbursementBalanceCheck> | null;
    if (!response.ok || !body?.data) {
      return { data: null, error: body?.message ?? "Unable to load disbursement balance check." };
    }
    return { data: body.data, error: null };
  } catch {
    return { data: null, error: "Unable to load disbursement balance check." };
  }
}

export async function runDisbursementFromApi(settlementId: string): Promise<{
  data: DisbursementRecord | null;
  error: string | null;
}> {
  const session = await getStoredAdminSession();
  if (!session) {
    return { data: null, error: "Admin session is not available." };
  }
  try {
    const response = await fetch(`${getAdminApiBaseUrl()}/admin/financial-ops/disbursements/run`, {
      method: "POST",
      headers: {
        Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ settlementId }),
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as Envelope<DisbursementRecord> | null;
    if (!response.ok || !body?.data) {
      return { data: null, error: body?.message ?? "Disbursement run failed." };
    }
    return { data: body.data, error: null };
  } catch {
    return { data: null, error: "Disbursement run failed." };
  }
}

export async function retryDisbursementFromApi(settlementId: string): Promise<{
  data: DisbursementRecord | null;
  error: string | null;
}> {
  const session = await getStoredAdminSession();
  if (!session) {
    return { data: null, error: "Admin session is not available." };
  }
  try {
    const response = await fetch(
      `${getAdminApiBaseUrl()}/admin/financial-ops/disbursements/${encodeURIComponent(settlementId)}/retry`,
      {
        method: "POST",
        headers: {
          Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
        cache: "no-store",
      },
    );
    const body = (await response.json().catch(() => null)) as Envelope<DisbursementRecord> | null;
    if (!response.ok || !body?.data) {
      return { data: null, error: body?.message ?? "Disbursement retry failed." };
    }
    return { data: body.data, error: null };
  } catch {
    return { data: null, error: "Disbursement retry failed." };
  }
}

export async function runBatchDisbursementFromApi(): Promise<{
  data: BatchDisbursementResult | null;
  error: string | null;
}> {
  const session = await getStoredAdminSession();
  if (!session) {
    return { data: null, error: "Admin session is not available." };
  }
  try {
    const response = await fetch(`${getAdminApiBaseUrl()}/admin/financial-ops/disbursements/run-batch`, {
      method: "POST",
      headers: {
        Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as Envelope<BatchDisbursementResult> | null;
    if (!response.ok || !body?.data) {
      return { data: null, error: body?.message ?? "Batch disbursement run failed." };
    }
    return { data: body.data, error: null };
  } catch {
    return { data: null, error: "Batch disbursement run failed." };
  }
}
