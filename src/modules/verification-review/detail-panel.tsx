import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import type { VerificationCase, VerificationDecisionAction, VerificationDocument } from "@/modules/verification-review/types";

function toneForVerification(status: VerificationCase["verificationStatus"]) {
  if (status === "approved") return "success" as const;
  if (status === "rejected") return "danger" as const;
  if (status === "in_review") return "info" as const;
  return "warning" as const;
}

function toneForLifecycle(state: VerificationCase["lifecycleState"]) {
  if (state === "verified") return "success" as const;
  if (state === "suspended" || state === "rejected") return "danger" as const;
  return "neutral" as const;
}

function toneForDocumentStatus(status: VerificationDocument["status"]) {
  if (status === "flagged") return "warning" as const;
  if (status === "resubmitted") return "info" as const;
  return "success" as const;
}

function labelForDocumentSource(source: VerificationDocument["source"]) {
  return source === "resubmission" ? "resubmission" : "partner portal";
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function VerificationCaseDetail({
  selectedCase,
  activeDocument,
  documentException,
  note,
  feedback,
  pendingAction,
  allowedActions,
  onNoteChange,
  onDecision,
  onDocumentSelect,
  onResetSelection,
  onResetDocument,
}: {
  selectedCase: VerificationCase | null;
  activeDocument: VerificationDocument | null;
  documentException: boolean;
  note: string;
  feedback: { tone: "success" | "error"; message: string } | null;
  pendingAction: VerificationDecisionAction | null;
  allowedActions: { approve: boolean; request_more_info: boolean; reject: boolean; suspend: boolean } | null;
  onNoteChange: (value: string) => void;
  onDecision: (action: VerificationDecisionAction) => void;
  onDocumentSelect: (documentId: string) => void;
  onResetSelection: () => void;
  onResetDocument: () => void;
}) {
  if (!selectedCase) {
    return (
      <article className="tm-panel">
        <SurfaceState
          actionLabel="Reset to first case"
          description="The selected case is no longer available in this queue snapshot."
          onAction={onResetSelection}
          title="Selected verification case was not found"
          tone="exception"
        />
      </article>
    );
  }

  const flaggedDocuments = selectedCase.documents.filter((document) => document.status === "flagged");

  return (
    <article className="tm-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">Case Detail</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{selectedCase.partnerName}</h2>
          <p className="tm-muted mt-2 text-sm">
            {selectedCase.businessName} · {selectedCase.country}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={selectedCase.verificationStatus} tone={toneForVerification(selectedCase.verificationStatus)} />
          <StatusBadge label={selectedCase.lifecycleState} tone={toneForLifecycle(selectedCase.lifecycleState)} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="tm-soft-band">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="tm-label">Documents</p>
              <p className="tm-muted mt-3 text-sm">
                Simulated backend packet with file metadata, preview context, and secure-download wiring.
              </p>
            </div>
            <StatusBadge label={`${selectedCase.documents.length} files`} tone="info" />
          </div>
          <div className="mt-4 grid gap-3">
            {selectedCase.documents.map((document) => (
              <button
                className={`tm-document-card ${document.id === activeDocument?.id ? "tm-document-card-active" : ""}`}
                key={document.id}
                onClick={() => onDocumentSelect(document.id)}
                type="button"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{document.label}</p>
                    <p className="tm-muted mt-1 text-sm">{document.fileName}</p>
                  </div>
                  <StatusBadge label={document.status} tone={toneForDocumentStatus(document.status)} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge label={document.documentType} tone="neutral" />
                  <StatusBadge label={labelForDocumentSource(document.source)} tone="info" />
                </div>
                <p className="tm-muted mt-3 text-sm">
                  {document.mimeType} · {document.pageCount} page{document.pageCount > 1 ? "s" : ""} · {document.sizeLabel}
                </p>
              </button>
            ))}
          </div>
          <p className="tm-muted mt-4 text-sm">
            {flaggedDocuments.length > 0
              ? `${flaggedDocuments.length} flagged document${flaggedDocuments.length > 1 ? "s" : ""} still need reviewer attention.`
              : "All submitted documents are currently clear."}
          </p>
        </div>

        <div className="tm-soft-band">
          <p className="tm-label">Document packet preview</p>
          {documentException ? (
            <div className="mt-4">
              <SurfaceState
                actionLabel="Reset document preview"
                description="The selected document is no longer part of this case packet."
                onAction={onResetDocument}
                title="Selected document was not found"
                tone="exception"
              />
            </div>
          ) : activeDocument ? (
            <div className="mt-4 grid gap-4">
              <div className="tm-document-preview">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-950">{activeDocument.fileName}</p>
                    <p className="tm-muted mt-1 text-sm">Uploaded {formatTimestamp(activeDocument.uploadedAt)}</p>
                  </div>
                  <StatusBadge label={activeDocument.status} tone={toneForDocumentStatus(activeDocument.status)} />
                </div>
                <p className="mt-4 text-sm text-slate-900">{activeDocument.previewSummary}</p>
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  <div className="tm-document-meta">
                    <span className="tm-label">File type</span>
                    <p className="mt-2 text-sm text-slate-900">{activeDocument.mimeType}</p>
                  </div>
                  <div className="tm-document-meta">
                    <span className="tm-label">Secure path</span>
                    <p className="mt-2 break-all text-sm text-slate-900">{activeDocument.securePath}</p>
                  </div>
                  <div className="tm-document-meta">
                    <span className="tm-label">Packet source</span>
                    <p className="mt-2 text-sm text-slate-900">{labelForDocumentSource(activeDocument.source)}</p>
                  </div>
                  <div className="tm-document-meta">
                    <span className="tm-label">Reviewer hint</span>
                    <p className="mt-2 text-sm text-slate-900">{activeDocument.reviewerHint}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="tm-btn tm-btn-primary" type="button">
                    Preview secure file
                  </button>
                  <button className="tm-btn tm-btn-outline" type="button">
                    Simulate signed download
                  </button>
                </div>
                <p className="tm-muted mt-3 text-sm">
                  Backend simulation: Django would issue a short-lived signed file URL for this packet after role and case access checks.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <SurfaceState
                description="This case does not have any submitted documents in the current snapshot."
                title="No document packet available"
                tone="empty"
              />
            </div>
          )}
        </div>
      </div>

      <div className="tm-soft-band mt-5">
        <p className="tm-label">Partner impact</p>
        <p className="mt-3 text-sm text-slate-900">{selectedCase.notificationSummary}</p>
        {selectedCase.latestPartnerNotification ? (
          <p className="tm-muted mt-3 text-sm">
            Backend prep: notification template <span className="font-semibold">{selectedCase.latestPartnerNotification.template}</span>{" "}
            is {selectedCase.latestPartnerNotification.deliveryStatus.replaceAll("_", " ")} for Django delivery wiring via{" "}
            {selectedCase.latestPartnerNotification.channel.replaceAll("_", " ")}.
          </p>
        ) : null}
      </div>

      <div className="tm-soft-band mt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="tm-label">Internal review note</p>
            <p className="tm-muted mt-2 text-sm">
              Use notes to capture rationale that should be preserved in the verification history and reviewer audit trail.
            </p>
          </div>
          {activeDocument && !documentException ? <StatusBadge label={`reviewing ${activeDocument.label.toLowerCase()}`} tone="info" /> : null}
        </div>
      </div>

      <div className="tm-soft-band mt-3">
        <label className="block">
          <textarea
            className="tm-textarea mt-3"
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Add approval rationale, rejection reason, or resubmission guidance..."
            value={note}
          />
        </label>
        {selectedCase.latestAuditRecord ? (
          <div className="tm-alert tm-alert-success mt-4">
            Audit prep: {selectedCase.latestAuditRecord.summary} Audit event is{" "}
            {selectedCase.latestAuditRecord.status.replaceAll("_", " ")}.
          </div>
        ) : null}
        {feedback ? <div className={`mt-4 tm-alert ${feedback.tone === "error" ? "tm-alert-danger" : "tm-alert-success"}`}>{feedback.message}</div> : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <StatusBadge label={selectedCase.reviewSignals.latestActionLabel} tone="info" />
          <StatusBadge
            label={selectedCase.reviewSignals.needsMoreInfo ? "follow-up open" : "no open follow-up"}
            tone={selectedCase.reviewSignals.needsMoreInfo ? "warning" : "success"}
          />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="tm-btn tm-btn-primary" disabled={pendingAction !== null || !allowedActions?.approve} onClick={() => onDecision("approve")} type="button">
            {pendingAction === "approve" ? "Approving..." : "Approve verification"}
          </button>
          <button
            className="tm-btn tm-btn-outline"
            disabled={pendingAction !== null || !allowedActions?.request_more_info}
            onClick={() => onDecision("request_more_info")}
            type="button"
          >
            {pendingAction === "request_more_info" ? "Requesting..." : "Request more info"}
          </button>
          <button className="tm-btn tm-btn-outline" disabled={pendingAction !== null || !allowedActions?.reject} onClick={() => onDecision("reject")} type="button">
            {pendingAction === "reject" ? "Rejecting..." : "Reject verification"}
          </button>
          <button className="tm-btn tm-btn-outline" disabled={pendingAction !== null || !allowedActions?.suspend} onClick={() => onDecision("suspend")} type="button">
            {pendingAction === "suspend" ? "Suspending..." : "Suspend lifecycle"}
          </button>
        </div>
      </div>

      <div className="mt-5">
        <p className="tm-kicker">Decision History</p>
        <div className="mt-4 grid gap-3">
          {selectedCase.history.map((entry) => (
            <article className="tm-soft-band" key={entry.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{entry.action}</p>
                  <p className="tm-muted mt-1 text-sm">{entry.note}</p>
                </div>
                <StatusBadge label={entry.timestamp} tone="neutral" />
              </div>
              <p className="tm-muted mt-2 text-sm">{entry.actor}</p>
            </article>
          ))}
        </div>
      </div>
    </article>
  );
}
