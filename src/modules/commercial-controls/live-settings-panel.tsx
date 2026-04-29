"use client";

import { useState } from "react";

function formatUtcTimestamp(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const second = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second} UTC`;
}

type CommercialSetting = {
  commissionRatePercent: string;
  taxWithholdingPercent: string;
  serviceFeeFlatAmount: number;
  updatedBy?: string;
  updatedAt?: string;
};

export function LiveCommercialSettingsPanel({ initialSetting }: { initialSetting: CommercialSetting | null }) {
  const [form, setForm] = useState<CommercialSetting>(
    initialSetting ?? { commissionRatePercent: "10", taxWithholdingPercent: "5", serviceFeeFlatAmount: 0 },
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/backend/commercial-controls/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await response.json().catch(() => null) as { data?: CommercialSetting; message?: string; error?: { message?: string } } | null;
      if (!response.ok || !body?.data) {
        throw new Error(body?.message ?? body?.error?.message ?? "Unable to update commercial settings.");
      }
      setForm(body.data);
      setMessage("Commercial settings updated. New settlements will use these values.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update commercial settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="tm-panel">
      <h2 className="text-lg font-semibold">Live Settlement Deductions</h2>
      <p className="tm-soft-note mt-2 text-sm">These values are persisted in the API and used for new settlement calculations.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="tm-field-label">
          Commission (%)
          <input className="tm-input" type="number" step="0.01" value={form.commissionRatePercent} onChange={(event) => setForm((current) => ({ ...current, commissionRatePercent: event.target.value }))} />
        </label>
        <label className="tm-field-label">
          Tax withholding (%)
          <input className="tm-input" type="number" step="0.01" value={form.taxWithholdingPercent} onChange={(event) => setForm((current) => ({ ...current, taxWithholdingPercent: event.target.value }))} />
        </label>
        <label className="tm-field-label">
          Service fee (flat)
          <input className="tm-input" type="number" value={form.serviceFeeFlatAmount} onChange={(event) => setForm((current) => ({ ...current, serviceFeeFlatAmount: Number(event.target.value) }))} />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button className="tm-btn tm-btn-primary" type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving..." : "Save live settings"}
        </button>
        {form.updatedAt ? <p className="tm-soft-note text-sm">Last updated by {form.updatedBy || "-"} at {formatUtcTimestamp(form.updatedAt)}</p> : null}
      </div>
      {message ? <p className="mt-3 text-sm">{message}</p> : null}
    </article>
  );
}
