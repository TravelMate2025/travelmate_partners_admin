"use client";

import { type FormEvent, useMemo, useState } from "react";

import type { FxRateRecord } from "@/modules/fx-rates/types";

type SurfaceState =
  | {
      status: "loading" | "error" | "exception";
      title?: string;
      description?: string;
    }
  | undefined;

type FxRatesListEnvelope = {
  data?: { records?: FxRateRecord[] };
  message?: string;
  error?: { message?: string };
};

type FxRatesItemEnvelope = {
  data?: FxRateRecord;
  message?: string;
  error?: { message?: string };
};

function formatUtcTimestamp(value: string): string {
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

const CURRENCY_OPTIONS = ["NGN", "USD", "GBP", "EUR"] as const;
type FxRateFormState = {
  sourceCurrency: string;
  targetCurrency: string;
  rate: string;
  isActive: boolean;
};

export function FxRatesWorkspace({
  initialRecords,
  surfaceState,
}: {
  initialRecords: FxRateRecord[];
  surfaceState?: SurfaceState;
}) {
  const [records, setRecords] = useState(initialRecords);
  const [form, setForm] = useState<FxRateFormState>({
    sourceCurrency: CURRENCY_OPTIONS[0],
    targetCurrency: CURRENCY_OPTIONS[1],
    rate: "",
    isActive: true,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);

  const sorted = useMemo(() => [...records].sort((a, b) => a.sourceCurrency.localeCompare(b.sourceCurrency) || a.targetCurrency.localeCompare(b.targetCurrency)), [records]);

  async function reload() {
    const response = await fetch("/api/backend/fx-rates", { method: "GET", cache: "no-store" });
    const body = (await response.json().catch(() => null)) as FxRatesListEnvelope | null;
    if (!response.ok || !body?.data?.records) {
      throw new Error(body?.message ?? body?.error?.message ?? "Unable to load FX rates.");
    }
    setRecords(body.data.records);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/backend/fx-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = (await response.json().catch(() => null)) as FxRatesItemEnvelope | null;
      if (!response.ok || !body?.data) {
        throw new Error(body?.message ?? body?.error?.message ?? "Unable to save FX rate.");
      }
      await reload();
      setMessage(`Saved FX rate ${body.data.sourceCurrency}/${body.data.targetCurrency}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save FX rate.");
    } finally {
      setSubmitting(false);
    }
  }

  async function deactivate(record: FxRateRecord) {
    setDeactivatingId(record.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/backend/fx-rates/${encodeURIComponent(String(record.id))}/deactivate`, {
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as FxRatesItemEnvelope | null;
      if (!response.ok || !body?.data) {
        throw new Error(body?.message ?? body?.error?.message ?? "Unable to deactivate FX rate.");
      }
      await reload();
      setMessage(`Deactivated FX rate ${record.sourceCurrency}/${record.targetCurrency}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to deactivate FX rate.");
    } finally {
      setDeactivatingId(null);
    }
  }

  if (surfaceState?.status === "error" && records.length === 0) {
    return (
      <section className="tm-panel">
        <h2 className="text-lg font-semibold">{surfaceState.title ?? "FX rates are unavailable"}</h2>
        <p className="tm-soft-note mt-2 text-sm">{surfaceState.description ?? "Unable to load FX rates."}</p>
      </section>
    );
  }

  return (
    <section className="grid gap-5">
      <article className="tm-panel">
        <h2 className="text-lg font-semibold">Create or Update FX Rate</h2>
        <p className="tm-soft-note mt-2 text-sm">Admin-owned rates are the source of truth for settlement currency conversion.</p>
        <form className="mt-4 grid gap-3 md:grid-cols-4" onSubmit={submit}>
          <label className="tm-field-label">
            Source currency
            <select
              className="tm-input"
              value={form.sourceCurrency}
              onChange={(event) => setForm((current) => ({ ...current, sourceCurrency: event.target.value }))}
            >
              {CURRENCY_OPTIONS.map((currency) => (
                <option key={`source-${currency}`} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>
          <label className="tm-field-label">
            Target currency
            <select
              className="tm-input"
              value={form.targetCurrency}
              onChange={(event) => setForm((current) => ({ ...current, targetCurrency: event.target.value }))}
            >
              {CURRENCY_OPTIONS.map((currency) => (
                <option key={`target-${currency}`} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>
          <label className="tm-field-label">
            Rate
            <input className="tm-input" value={form.rate} onChange={(event) => setForm((current) => ({ ...current, rate: event.target.value }))} placeholder="0.001" required />
          </label>
          <label className="tm-field-label">
            Active
            <select className="tm-input" value={form.isActive ? "true" : "false"} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.value === "true" }))}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
          <button
            className="tm-btn tm-btn-primary md:col-span-4"
            type="submit"
            disabled={submitting || form.sourceCurrency === form.targetCurrency}
          >
            {submitting ? "Saving..." : "Save FX rate"}
          </button>
          {form.sourceCurrency === form.targetCurrency ? (
            <p className="md:col-span-4 text-sm text-amber-700">Source and target currencies must be different.</p>
          ) : null}
        </form>
        {message ? <p className="mt-3 text-sm">{message}</p> : null}
      </article>

      <article className="tm-panel">
        <h2 className="text-lg font-semibold">Configured FX Rates</h2>
        {sorted.length === 0 ? (
          <p className="tm-soft-note mt-2 text-sm">No FX rates configured yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-4">Pair</th>
                  <th className="py-2 pr-4">Rate</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Updated by</th>
                  <th className="py-2 pr-4">Updated at</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((item) => (
                  <tr key={item.id} className="border-t border-slate-200">
                    <td className="py-2 pr-4 font-medium">{item.sourceCurrency}/{item.targetCurrency}</td>
                    <td className="py-2 pr-4">{item.rate}</td>
                    <td className="py-2 pr-4">{item.isActive ? "Active" : "Inactive"}</td>
                    <td className="py-2 pr-4">{item.updatedBy || "-"}</td>
                    <td className="py-2 pr-4">{formatUtcTimestamp(item.updatedAt)}</td>
                    <td className="py-2">
                      <button
                        className="tm-btn"
                        type="button"
                        disabled={!item.isActive || deactivatingId === item.id}
                        onClick={() => void deactivate(item)}
                      >
                        {deactivatingId === item.id ? "Deactivating..." : "Deactivate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
