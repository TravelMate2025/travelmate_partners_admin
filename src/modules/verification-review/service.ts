import { applyVerificationDecision, isVerificationDecisionAllowed } from "@/modules/verification-review/reducer";
import type {
  VerificationCase,
  VerificationDecisionPayload,
  VerificationDecisionResult,
} from "@/modules/verification-review/types";

function buildAuditRecord(payload: VerificationDecisionPayload): VerificationDecisionResult["auditRecord"] {
  return {
    eventId: `audit-${payload.caseId}-${payload.action}-${Date.now()}`,
    actor: payload.actor,
    caseId: payload.caseId,
    action: payload.action,
    summary: `${payload.actor} executed ${payload.action} for verification case ${payload.caseId}.`,
    status: "queued_for_backend",
  };
}

function buildPartnerNotification(
  targetCase: VerificationCase,
  payload: VerificationDecisionPayload,
): VerificationDecisionResult["partnerNotification"] {
  const templateMap = {
    approve: "verification_approved",
    reject: "verification_rejected",
    request_more_info: "verification_more_info",
    suspend: "lifecycle_suspended",
  } as const;

  return {
    partnerName: targetCase.partnerName,
    caseId: targetCase.id,
    channel: "email",
    template: templateMap[payload.action],
    deliveryStatus: "queued_for_backend",
    summary: targetCase.notificationSummary,
  };
}

export type VerificationReviewRepository = {
  submitDecision(cases: VerificationCase[], payload: VerificationDecisionPayload): Promise<VerificationDecisionResult>;
};

export const mockVerificationReviewRepository: VerificationReviewRepository = {
  async submitDecision(cases, payload) {
    const currentCase = cases.find((item) => item.id === payload.caseId);

    if (!currentCase) {
      throw new Error(`Verification case ${payload.caseId} was not found.`);
    }

    if (!isVerificationDecisionAllowed(currentCase, payload.action)) {
      throw new Error(`Action ${payload.action} is not allowed for verification case ${payload.caseId}.`);
    }

    const transitionCases = applyVerificationDecision(cases, payload);
    const transitionedCase = transitionCases.find((item) => item.id === payload.caseId);

    if (!transitionedCase) {
      throw new Error(`Verification case ${payload.caseId} was not found.`);
    }

    const auditRecord = buildAuditRecord(payload);
    const partnerNotification = buildPartnerNotification(transitionedCase, payload);
    const nextCases = transitionCases.map((item) =>
      item.id === payload.caseId
        ? {
            ...item,
            latestAuditRecord: auditRecord,
            latestPartnerNotification: partnerNotification,
          }
        : item,
    );

    return {
      cases: nextCases,
      auditRecord,
      partnerNotification,
    };
  },
};

async function readJson<T>(response: Response) {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

type Envelope<T> = { data: T; message?: string; error?: { message?: string } };

export const realVerificationReviewRepository: VerificationReviewRepository = {
  async submitDecision(_cases, payload) {
    const response = await fetch(`/api/backend/verification-cases/${payload.caseId}/decision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: payload.action,
        note: payload.note,
      }),
    });

    const body = await readJson<Envelope<VerificationDecisionResult>>(response);
    if (!response.ok || !body?.data) {
      throw new Error(body?.message ?? body?.error?.message ?? "Unable to submit verification decision.");
    }

    return {
      ...body.data,
      cases: body.data.cases.map((item) =>
        item.id === payload.caseId
          ? {
              ...item,
              latestAuditRecord: body.data.auditRecord,
              latestPartnerNotification: body.data.partnerNotification,
            }
          : item,
      ),
    };
  },
};
