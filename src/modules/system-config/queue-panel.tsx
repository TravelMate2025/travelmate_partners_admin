import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import { formatAreaLabel, formatCategoryLabel, formatRegionTypeLabel, statusTone } from "@/modules/system-config/rules";
import type { ConfigSection, SystemConfigFilterState, SystemConfigRecord } from "@/modules/system-config/types";

const SECTION_HEADING: Record<ConfigSection | "all", string> = {
  all: "Configuration master data",
  taxonomy: "Platform taxonomies",
  toggles: "Feature toggles",
  regions: "Countries, cities, and service areas",
  templates: "Moderation templates",
  content: "Static content",
};

function recordSubtitle(record: SystemConfigRecord): string {
  if (record.kind === "taxonomy") return `${formatCategoryLabel(record.category!)} · ${record.usageCount} uses`;
  if (record.kind === "toggle") return `${formatAreaLabel(record.area!)}${record.rolloutPercent !== null ? ` · ${record.rolloutPercent}%` : ""}`;
  if (record.kind === "region") return `${formatRegionTypeLabel(record.regionType!)}${record.parentSlug ? ` · parent: ${record.parentSlug}` : ""}`;
  if (record.kind === "template") return `${record.templateScope ?? ""} · ${record.templateKind ?? ""} · ${record.usageCount} uses`;
  return `${record.contentKind ?? ""} · v${record.contentVersion ?? "—"}`;
}

export function SystemConfigQueuePanel({
  records,
  selectedId,
  filters,
  onFilterChange,
  onResetFilters,
  onSelect,
  summary,
}: {
  records: SystemConfigRecord[];
  selectedId: string;
  filters: SystemConfigFilterState;
  onFilterChange: (value: SystemConfigFilterState) => void;
  onResetFilters: () => void;
  onSelect: (id: string) => void;
  summary: {
    totalTaxonomy: number;
    activeTaxonomy: number;
    pendingPublish: number;
    enabledToggles: number;
  };
}) {
  const showCategoryFilter = filters.section === "all" || filters.section === "taxonomy";
  const showAreaFilter = filters.section === "all" || filters.section === "toggles";

  return (
    <article className="tm-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">System Configuration</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{SECTION_HEADING[filters.section]}</h2>
          <p className="tm-muted mt-2 text-sm">
            Manage taxonomy items, feature rollout controls, service regions, moderation templates, and static content.
          </p>
        </div>
        <button className="tm-btn tm-btn-outline" onClick={onResetFilters} type="button">
          Reset filters
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="tm-soft-band">
          <p className="tm-label">Taxonomy items</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.totalTaxonomy}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Active taxonomy</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.activeTaxonomy}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Pending publish</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.pendingPublish}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Enabled toggles</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.enabledToggles}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="tm-label">Search items</span>
          <input
            aria-label="Search configuration items"
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, query: event.target.value })}
            placeholder="Search by name, slug, or description"
            value={filters.query}
          />
        </label>
        <label className="block">
          <span className="tm-label">Section</span>
          <select
            aria-label="Configuration section"
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, section: event.target.value as SystemConfigFilterState["section"] })}
            value={filters.section}
          >
            <option value="all">all</option>
            <option value="taxonomy">taxonomy</option>
            <option value="toggles">feature toggles</option>
            <option value="regions">regions</option>
            <option value="templates">moderation templates</option>
            <option value="content">static content</option>
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Status</span>
          <select
            aria-label="Configuration status"
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, status: event.target.value as SystemConfigFilterState["status"] })}
            value={filters.status}
          >
            <option value="all">all</option>
            <option value="active">active</option>
            <option value="draft">draft</option>
            <option value="deprecated">deprecated</option>
            <option value="enabled">enabled</option>
            <option value="disabled">disabled</option>
            <option value="staged">staged</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>
        </label>
        {showCategoryFilter && (
          <label className="block">
            <span className="tm-label">Taxonomy category</span>
            <select
              aria-label="Taxonomy category"
              className="tm-input mt-3"
              onChange={(event) => onFilterChange({ ...filters, category: event.target.value as SystemConfigFilterState["category"] })}
              value={filters.category}
            >
              <option value="all">all</option>
              <option value="amenity">amenity</option>
              <option value="vehicle_class">vehicle class</option>
              <option value="property_type">property type</option>
              <option value="tag">tag</option>
              <option value="service_area">service area</option>
            </select>
          </label>
        )}
        {showAreaFilter && (
          <label className="block">
            <span className="tm-label">Toggle area</span>
            <select
              aria-label="Toggle area"
              className="tm-input mt-3"
              onChange={(event) => onFilterChange({ ...filters, area: event.target.value as SystemConfigFilterState["area"] })}
              value={filters.area}
            >
              <option value="all">all</option>
              <option value="partner_app">partner app</option>
              <option value="admin_dashboard">admin dashboard</option>
              <option value="api">api</option>
              <option value="global">global</option>
            </select>
          </label>
        )}
      </div>

      <div className="mt-6 grid gap-3">
        {records.length > 0 ? (
          records.map((record) => (
            <button
              className={`tm-document-card text-left ${record.id === selectedId ? "tm-document-card-active" : ""}`}
              key={record.id}
              onClick={() => onSelect(record.id)}
              type="button"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{record.name}</p>
                  <p className="tm-muted mt-2 text-sm">{recordSubtitle(record)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label={record.kind} tone="info" />
                  <StatusBadge label={record.status} tone={statusTone(record.status)} />
                </div>
              </div>
              <p className="tm-muted mt-3 text-sm">{record.description}</p>
            </button>
          ))
        ) : (
          <SurfaceState
            actionLabel="Clear filters"
            description="No configuration items match the current filters."
            onAction={onResetFilters}
            title="No items match this view"
            tone="empty"
          />
        )}
      </div>
    </article>
  );
}
