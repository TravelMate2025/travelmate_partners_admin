"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import type { AdminRole } from "@/modules/auth/types";

type TaxonomyCategory = "amenity" | "property_type" | "vehicle_class";
type TaxonomyStatus = "draft" | "active" | "deprecated";

type TaxonomyItem = {
  id: string;
  category: TaxonomyCategory;
  code: string;
  label: string;
  status: TaxonomyStatus;
  sortOrder: number;
};

type TaxonomyEnvelope = {
  data: {
    items: TaxonomyItem[];
  };
};

function toDisplayStatus(status: TaxonomyStatus) {
  switch (status) {
    case "draft":
      return "Draft";
    case "active":
      return "Active";
    case "deprecated":
      return "Deprecated";
  }
}

export function TaxonomyControlPanel({ role }: { role: AdminRole }) {
  const canEdit = role === "operations" || role === "super_admin";
  const [items, setItems] = useState<TaxonomyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [newCategory, setNewCategory] = useState<TaxonomyCategory>("property_type");

  const amenities = useMemo(
    () => items.filter((item) => item.category === "amenity"),
    [items],
  );
  const propertyTypes = useMemo(
    () => items.filter((item) => item.category === "property_type"),
    [items],
  );
  const vehicleClasses = useMemo(
    () => items.filter((item) => item.category === "vehicle_class"),
    [items],
  );

  async function loadItems() {
    setLoading(true);
    const response = await fetch("/api/backend/system-config/taxonomies", { cache: "no-store" });
    const body = (await response.json().catch(() => ({}))) as Partial<TaxonomyEnvelope> & { message?: string };
    if (!response.ok) {
      throw new Error(body.message ?? "Unable to load taxonomy options.");
    }
    setItems(body.data?.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadItems()
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : "Unable to load taxonomy options.");
        setLoading(false);
      });
  }, []);

  async function createOption(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) {
      return;
    }
    const formElement = event.currentTarget;
    setSaving(true);
    setMessage("");
    const form = new FormData(formElement);
    const payload = {
      category: newCategory,
      code: String(form.get("code") ?? ""),
      label: String(form.get("label") ?? ""),
      sortOrder: Number(form.get("sortOrder") ?? 100),
    };
    const response = await fetch("/api/backend/system-config/taxonomies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({})) as { message?: string };
    if (!response.ok) {
      setSaving(false);
      setMessage(body.message ?? "Unable to create taxonomy option.");
      return;
    }
    await loadItems();
    setSaving(false);
    setMessage("Taxonomy option created as draft.");
    formElement.reset();
  }

  async function updateStatus(itemId: string, status: TaxonomyStatus) {
    if (!canEdit) {
      return;
    }
    setSaving(true);
    setMessage("");
    const response = await fetch(`/api/backend/system-config/taxonomies/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = await response.json().catch(() => ({})) as { message?: string };
    if (!response.ok) {
      setSaving(false);
      setMessage(body.message ?? "Unable to update taxonomy status.");
      return;
    }
    await loadItems();
    setSaving(false);
    setMessage(`Taxonomy option marked as ${status}.`);
  }

  function renderList(title: string, data: TaxonomyItem[]) {
    return (
      <section className="tm-soft-band">
        <p className="tm-label">{title}</p>
        <ul className="mt-3 space-y-2">
          {data.map((item) => (
            <li key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-sm font-semibold text-slate-900">{item.label}</p>
              <p className="mt-1 text-xs text-slate-500">{item.code} • {toDisplayStatus(item.status)}</p>
              {canEdit ? (
                <div className="mt-2 flex gap-2">
                  {item.status !== "active" ? (
                    <button
                      className="tm-btn tm-btn-outline"
                      disabled={saving}
                      onClick={() => void updateStatus(item.id, "active")}
                      type="button"
                    >
                      Publish
                    </button>
                  ) : null}
                  {item.status !== "deprecated" ? (
                    <button
                      className="tm-btn tm-btn-outline"
                      disabled={saving}
                      onClick={() => void updateStatus(item.id, "deprecated")}
                      type="button"
                    >
                      Deprecate
                    </button>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="tm-panel p-6">
      <h2 className="tm-section-title">Live Taxonomy Controls</h2>
      <p className="tm-muted mt-1 text-sm">
        Manage amenities, property types, and vehicle classes used by partner listing forms.
      </p>
      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Before you add a taxonomy option</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><strong>Category:</strong> choose where this appears (Amenities, Property Types, Vehicle Classes).</li>
          <li><strong>Code:</strong> stable internal key (lowercase letters, numbers, underscores only). Example: <code>boutique_hotel</code>.</li>
          <li><strong>Label:</strong> admin/partner-facing display name. Example: <code>Boutique Hotel</code>.</li>
          <li><strong>Status:</strong> new options are created as <strong>Draft</strong>. Use <strong>Publish</strong> to make them selectable by partners.</li>
          <li><strong>Deprecate:</strong> removes an option from new selections but does not delete existing listing records.</li>
        </ul>
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-slate-600">Loading taxonomy options...</p>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {renderList("Amenities", amenities)}
          {renderList("Property Types", propertyTypes)}
          {renderList("Vehicle Classes", vehicleClasses)}
        </div>
      )}

      {canEdit ? (
        <form className="mt-5 grid gap-3 md:grid-cols-4" onSubmit={createOption}>
          <label className="tm-field">
            <span className="tm-field-label">Category</span>
            <select
              className="tm-input"
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value as TaxonomyCategory)}
            >
              <option value="amenity">Amenity</option>
              <option value="property_type">Property Type</option>
              <option value="vehicle_class">Vehicle Class</option>
            </select>
          </label>
          <label className="tm-field">
            <span className="tm-field-label">Code</span>
            <input className="tm-input" name="code" placeholder="e.g. boutique_hotel" required />
            <span className="tm-muted mt-1 text-xs">
              Use a permanent machine key. Avoid renaming after go-live.
            </span>
          </label>
          <label className="tm-field">
            <span className="tm-field-label">Label</span>
            <input className="tm-input" name="label" placeholder="e.g. Boutique Hotel" required />
            <span className="tm-muted mt-1 text-xs">
              This is what partners see in dropdowns.
            </span>
          </label>
          <label className="tm-field">
            <span className="tm-field-label">Sort Order</span>
            <input className="tm-input" defaultValue={100} min={0} name="sortOrder" type="number" />
            <span className="tm-muted mt-1 text-xs">
              Lower numbers appear first in partner forms.
            </span>
          </label>
          <div className="md:col-span-4">
            <button className="tm-btn tm-btn-primary" disabled={saving} type="submit">
              {saving ? "Saving..." : "Add Draft Option"}
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-4 text-sm text-slate-600">
          You have read-only access. Operations or super admin roles can edit taxonomy options.
        </p>
      )}

      {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
    </section>
  );
}
