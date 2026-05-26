"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import type { AdminRole } from "@/modules/auth/types";

type RuleStatus = "active" | "inactive";
type CalcMode = "percentage" | "fixed";
type TaxRule = {
  id: string;
  name: string;
  status: RuleStatus;
  country: string;
  city: string;
  currency: string;
  calculationMode: CalcMode;
  value: number;
  isInclusive: boolean;
  priority: number;
};
type FeeRule = {
  id: string;
  name: string;
  feeType: "platform_fee" | "service_fee" | "payment_fee";
  status: RuleStatus;
  country: string;
  city: string;
  currency: string;
  calculationMode: CalcMode;
  value: number;
  minAmount: number;
  maxAmount: number | null;
  priority: number;
};

export function BookingPricingRulesPanel({ role }: { role: AdminRole }) {
  const canEdit = role === "operations" || role === "super_admin";
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [feeRules, setFeeRules] = useState<FeeRule[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | RuleStatus>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const taxVisible = useMemo(
    () => (statusFilter === "all" ? taxRules : taxRules.filter((r) => r.status === statusFilter)),
    [statusFilter, taxRules],
  );
  const feeVisible = useMemo(
    () => (statusFilter === "all" ? feeRules : feeRules.filter((r) => r.status === statusFilter)),
    [statusFilter, feeRules],
  );

  async function loadRules() {
    setLoading(true);
    const suffix = statusFilter === "all" ? "" : `?status=${statusFilter}`;
    const [taxResp, feeResp] = await Promise.all([
      fetch(`/api/backend/system-config/booking-pricing/tax-rules${suffix}`, { cache: "no-store" }),
      fetch(`/api/backend/system-config/booking-pricing/fee-rules${suffix}`, { cache: "no-store" }),
    ]);
    const taxBody = (await taxResp.json().catch(() => ({}))) as {
      data?: { items?: TaxRule[] };
      message?: string;
    };
    const feeBody = (await feeResp.json().catch(() => ({}))) as {
      data?: { items?: FeeRule[] };
      message?: string;
    };

    if (!taxResp.ok) throw new Error(taxBody.message ?? "Unable to load tax rules.");
    if (!feeResp.ok) throw new Error(feeBody.message ?? "Unable to load fee rules.");

    setTaxRules(taxBody.data?.items ?? []);
    setFeeRules(feeBody.data?.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadRules().catch((error) => {
      setLoading(false);
      setMessage(error instanceof Error ? error.message : "Unable to load booking pricing rules.");
    });
  }, [statusFilter]);

  async function createTaxRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    setMessage("");
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const payload = {
      name: String(form.get("name") ?? ""),
      status: String(form.get("status") ?? "inactive"),
      applicability: "stay_unit_level",
      country: String(form.get("country") ?? ""),
      city: String(form.get("city") ?? ""),
      currency: String(form.get("currency") ?? "NGN"),
      calculationMode: String(form.get("calculationMode") ?? "percentage"),
      value: String(form.get("value") ?? "0"),
      isInclusive: false,
      priority: Number(form.get("priority") ?? 100),
    };
    const response = await fetch("/api/backend/system-config/booking-pricing/tax-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    if (!response.ok) {
      setSaving(false);
      setMessage(body.message ?? "Unable to create tax rule.");
      return;
    }
    await loadRules();
    setSaving(false);
    setMessage("Tax rule created.");
    formEl.reset();
  }

  async function createFeeRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    setMessage("");
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const maxAmountRaw = String(form.get("maxAmount") ?? "").trim();
    const payload = {
      name: String(form.get("name") ?? ""),
      feeType: String(form.get("feeType") ?? "platform_fee"),
      status: String(form.get("status") ?? "inactive"),
      applicability: "stay_unit_level",
      country: String(form.get("country") ?? ""),
      city: String(form.get("city") ?? ""),
      currency: String(form.get("currency") ?? "NGN"),
      calculationMode: String(form.get("calculationMode") ?? "percentage"),
      value: String(form.get("value") ?? "0"),
      minAmount: String(form.get("minAmount") ?? "0"),
      maxAmount: maxAmountRaw === "" ? null : maxAmountRaw,
      priority: Number(form.get("priority") ?? 100),
    };
    const response = await fetch("/api/backend/system-config/booking-pricing/fee-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    if (!response.ok) {
      setSaving(false);
      setMessage(body.message ?? "Unable to create fee rule.");
      return;
    }
    await loadRules();
    setSaving(false);
    setMessage("Fee rule created.");
    formEl.reset();
  }

  async function updateRuleStatus(kind: "tax" | "fee", id: string, status: RuleStatus) {
    if (!canEdit) return;
    setSaving(true);
    setMessage("");
    const path =
      kind === "tax"
        ? `/api/backend/system-config/booking-pricing/tax-rules/${id}`
        : `/api/backend/system-config/booking-pricing/fee-rules/${id}`;
    const response = await fetch(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    if (!response.ok) {
      setSaving(false);
      setMessage(body.message ?? "Unable to update rule status.");
      return;
    }
    await loadRules();
    setSaving(false);
    setMessage(`Rule marked ${status}.`);
  }

  return (
    <section className="tm-panel p-6">
      <h2 className="tm-section-title">Booking Tax And Fee Rules</h2>
      <p className="tm-muted mt-1 text-sm">
        Configure backend-owned tax and fee rules for unit-level stay quote computation. Tax rules are exclusive-only.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filter</span>
        <button className="tm-btn tm-btn-outline" disabled={saving} onClick={() => setStatusFilter("all")} type="button">All</button>
        <button className="tm-btn tm-btn-outline" disabled={saving} onClick={() => setStatusFilter("active")} type="button">Active</button>
        <button className="tm-btn tm-btn-outline" disabled={saving} onClick={() => setStatusFilter("inactive")} type="button">Inactive</button>
      </div>

      {loading ? <p className="mt-3 text-sm text-slate-600">Loading pricing rules...</p> : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="tm-soft-band">
          <p className="tm-label">Tax Rules</p>
          <ul className="mt-3 space-y-2">
            {taxVisible.map((rule) => (
              <li key={rule.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-sm font-semibold text-slate-900">{rule.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {rule.calculationMode} {rule.value} • {rule.currency || "ANY"} • {rule.country || "ANY"} • {rule.status}
                </p>
                {canEdit ? (
                  <div className="mt-2 flex gap-2">
                    {rule.status !== "active" ? (
                      <button className="tm-btn tm-btn-outline" disabled={saving} onClick={() => void updateRuleStatus("tax", rule.id, "active")} type="button">Activate</button>
                    ) : null}
                    {rule.status !== "inactive" ? (
                      <button className="tm-btn tm-btn-outline" disabled={saving} onClick={() => void updateRuleStatus("tax", rule.id, "inactive")} type="button">Deactivate</button>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="tm-soft-band">
          <p className="tm-label">Fee Rules</p>
          <ul className="mt-3 space-y-2">
            {feeVisible.map((rule) => (
              <li key={rule.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-sm font-semibold text-slate-900">{rule.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {rule.feeType} • {rule.calculationMode} {rule.value} • {rule.currency || "ANY"} • {rule.country || "ANY"} • {rule.status}
                </p>
                {canEdit ? (
                  <div className="mt-2 flex gap-2">
                    {rule.status !== "active" ? (
                      <button className="tm-btn tm-btn-outline" disabled={saving} onClick={() => void updateRuleStatus("fee", rule.id, "active")} type="button">Activate</button>
                    ) : null}
                    {rule.status !== "inactive" ? (
                      <button className="tm-btn tm-btn-outline" disabled={saving} onClick={() => void updateRuleStatus("fee", rule.id, "inactive")} type="button">Deactivate</button>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {canEdit ? (
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <form className="rounded-lg border border-slate-200 p-4" onSubmit={createTaxRule}>
            <p className="text-sm font-semibold text-slate-900">Add Tax Rule</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input className="tm-input" name="name" placeholder="Name" required />
              <select className="tm-input" name="status" defaultValue="inactive"><option value="inactive">Inactive</option><option value="active">Active</option></select>
              <input className="tm-input" name="country" placeholder="Country (optional)" />
              <input className="tm-input" name="city" placeholder="City (optional)" />
              <input className="tm-input" defaultValue="NGN" name="currency" placeholder="Currency" />
              <select className="tm-input" name="calculationMode" defaultValue="percentage"><option value="percentage">Percentage</option><option value="fixed">Fixed</option></select>
              <input className="tm-input" defaultValue="0" name="value" placeholder="Value" type="number" step="0.01" />
              <input className="tm-input" defaultValue={100} name="priority" placeholder="Priority" type="number" />
            </div>
            <button className="tm-btn tm-btn-primary mt-3" disabled={saving} type="submit">{saving ? "Saving..." : "Create Tax Rule"}</button>
          </form>

          <form className="rounded-lg border border-slate-200 p-4" onSubmit={createFeeRule}>
            <p className="text-sm font-semibold text-slate-900">Add Fee Rule</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input className="tm-input" name="name" placeholder="Name" required />
              <select className="tm-input" name="feeType" defaultValue="platform_fee"><option value="platform_fee">Platform fee</option><option value="service_fee">Service fee</option><option value="payment_fee">Payment fee</option></select>
              <select className="tm-input" name="status" defaultValue="inactive"><option value="inactive">Inactive</option><option value="active">Active</option></select>
              <input className="tm-input" name="country" placeholder="Country (optional)" />
              <input className="tm-input" name="city" placeholder="City (optional)" />
              <input className="tm-input" defaultValue="NGN" name="currency" placeholder="Currency" />
              <select className="tm-input" name="calculationMode" defaultValue="percentage"><option value="percentage">Percentage</option><option value="fixed">Fixed</option></select>
              <input className="tm-input" defaultValue="0" name="value" placeholder="Value" type="number" step="0.01" />
              <input className="tm-input" defaultValue="0" name="minAmount" placeholder="Min amount" type="number" step="0.01" />
              <input className="tm-input" name="maxAmount" placeholder="Max amount (optional)" type="number" step="0.01" />
              <input className="tm-input" defaultValue={100} name="priority" placeholder="Priority" type="number" />
            </div>
            <button className="tm-btn tm-btn-primary mt-3" disabled={saving} type="submit">{saving ? "Saving..." : "Create Fee Rule"}</button>
          </form>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-600">You have read-only access. Operations or super admin roles can edit rules.</p>
      )}

      {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
    </section>
  );
}
