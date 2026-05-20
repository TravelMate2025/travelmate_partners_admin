"use client";

import { useMemo, useState } from "react";

import { SurfaceState } from "@/components/common/surface-state";
import { StatusBadge } from "@/components/common/status-badge";
import { isVerificationDecisionAllowed } from "@/modules/verification-review/reducer";
import { VerificationCaseDetail } from "@/modules/verification-review/detail-panel";
import {
  mockVerificationReviewRepository,
  realVerificationReviewRepository,
} from "@/modules/verification-review/service";
import type {
  VerificationCase,
  VerificationDecisionAction,
} from "@/modules/verification-review/types";

function toneForRisk(risk: VerificationCase["riskLevel"]) {
  if (risk === "high") return "danger" as const;
  if (risk === "medium") return "warning" as const;
  return "success" as const;
}

function toneForVerification(status: VerificationCase["verificationStatus"]) {
  if (status === "approved") return "success" as const;
  if (status === "rejected") return "danger" as const;
  if (status === "in_review") return "info" as const;
  return "warning" as const;
}

function toneForLifecycle(state: VerificationCase["lifecycleState"]) {
  if (state === "verified") return "success" as const;
  if (state === "suspended") return "danger" as const;
  if (state === "rejected") return "danger" as const;
  return "neutral" as const;
}

export function VerificationReviewWorkspace({
  initialCases,
  actor,
  mode = "mock",
}: {
  initialCases: VerificationCase[];
  actor: string;
  mode?: "mock" | "real";
}) {
  const sortedInitialCases = useMemo(
    () =>
      [...initialCases].sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      ),
    [initialCases],
  );
  const [cases, setCases] = useState(sortedInitialCases);
  const [selectedId, setSelectedId] = useState(sortedInitialCases[0]?.id ?? "");
  const [note, setNote] = useState(sortedInitialCases[0]?.noteDraft ?? "");
  const [pendingAction, setPendingAction] = useState<VerificationDecisionAction | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState(sortedInitialCases[0]?.documents[0]?.id ?? "");

  const selectedCase = useMemo(
    () => cases.find((item) => item.id === selectedId) ?? cases[0],
    [cases, selectedId],
  );
  const activeDocument =
    selectedCase?.documents.find((document) => document.id === activeDocumentId) ?? selectedCase?.documents[0] ?? null;
  const documentException = Boolean(selectedCase && activeDocumentId && !selectedCase.documents.some((document) => document.id === activeDocumentId));
  const allowedActions = selectedCase
    ? {
        approve: isVerificationDecisionAllowed(selectedCase, "approve"),
        request_more_info: isVerificationDecisionAllowed(selectedCase, "request_more_info"),
        reject: isVerificationDecisionAllowed(selectedCase, "reject"),
        suspend: isVerificationDecisionAllowed(selectedCase, "suspend"),
      }
    : null;
  const repository =
    mode === "real" ? realVerificationReviewRepository : mockVerificationReviewRepository;

  function handleSelect(caseId: string) {
    setSelectedId(caseId);
    const target = cases.find((item) => item.id === caseId);
    setNote(target?.noteDraft ?? "");
    setActiveDocumentId(target?.documents[0]?.id ?? "");
    setFeedback(null);
  }

  function resetSelection() {
    const fallback = cases[0];
    if (!fallback) return;
    setSelectedId(fallback.id);
    setNote(fallback.noteDraft ?? "");
    setActiveDocumentId(fallback.documents[0]?.id ?? "");
    setFeedback(null);
  }

  function resetDocument() {
    setActiveDocumentId(selectedCase?.documents[0]?.id ?? "");
  }

  async function handleDecision(action: VerificationDecisionAction) {
    if (!selectedCase || !isVerificationDecisionAllowed(selectedCase, action)) {
      return;
    }

    setPendingAction(action);
    setFeedback(null);

    try {
      const result = await repository.submitDecision(cases, {
        caseId: selectedCase.id,
        action,
        note: note.trim() || "Admin action recorded without additional note.",
        actor,
      });

      setCases(result.cases);
      const nextSelected = result.cases.find((item) => item.id === selectedCase.id);
      setNote(nextSelected?.noteDraft ?? "");
      setActiveDocumentId((currentId) =>
        nextSelected?.documents.some((document) => document.id === currentId) ? currentId : (nextSelected?.documents[0]?.id ?? ""),
      );
      setFeedback({ tone: "success", message: result.auditRecord.summary });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to submit verification decision.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  if (cases.length === 0) {
    return (
      <section className="grid gap-5">
        <article className="tm-panel">
          <SurfaceState
            description="Submitted verification packets will appear here once partner cases enter the review queue."
            title="Verification review workspace is empty"
            tone="empty"
          />
        </article>
      </section>
    );
  }

  if (!selectedCase) {
    return null;
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr] xl:items-start">
      <article className="tm-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="tm-kicker">Verification Queue</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Review cases</h2>
          </div>
          <StatusBadge label={`${cases.length} active cases`} tone="info" />
        </div>
        <div className="mt-5 grid gap-4">
          {cases.map((item) => (
            <button
              className={`tm-review-listing ${item.id === selectedCase.id ? "tm-review-listing-active" : ""}`}
              key={item.id}
              onClick={() => handleSelect(item.id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{item.partnerName}</p>
                  <p className="tm-muted mt-1 text-sm">{item.businessName}</p>
                </div>
                <StatusBadge label={item.riskLevel} tone={toneForRisk(item.riskLevel)} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge label={item.verificationStatus} tone={toneForVerification(item.verificationStatus)} />
                <StatusBadge label={item.lifecycleState} tone={toneForLifecycle(item.lifecycleState)} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge
                  label={
                    item.reviewSignals.flaggedDocumentCount > 0
                      ? `${item.reviewSignals.flaggedDocumentCount} flagged doc${item.reviewSignals.flaggedDocumentCount > 1 ? "s" : ""}`
                      : "docs clear"
                  }
                  tone={item.reviewSignals.flaggedDocumentCount > 0 ? "warning" : "success"}
                />
                <StatusBadge
                  label={item.reviewSignals.needsMoreInfo ? "evidence follow-up" : "evidence complete"}
                  tone={item.reviewSignals.needsMoreInfo ? "warning" : "info"}
                />
              </div>
              <p className="tm-muted mt-3 text-sm">
                Submitted {new Date(item.submittedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </p>
              <p className="tm-muted mt-2 text-sm">Latest review event: {item.reviewSignals.latestActionLabel}</p>
            </button>
          ))}
        </div>
      </article>
      <VerificationCaseDetail
        activeDocument={activeDocument}
        allowedActions={allowedActions}
        documentException={documentException}
        feedback={feedback}
        note={note}
        onDecision={handleDecision}
        onDocumentSelect={setActiveDocumentId}
        onNoteChange={setNote}
        onResetDocument={resetDocument}
        onResetSelection={resetSelection}
        pendingAction={pendingAction}
        selectedCase={selectedCase}
      />
    </section>
  );
}
