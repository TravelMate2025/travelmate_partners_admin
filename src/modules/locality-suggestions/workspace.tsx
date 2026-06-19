"use client";

import { useEffect, useMemo, useState } from "react";

import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import type { LocalitySuggestionRecord } from "@/modules/locality-suggestions/types";

function formatLatLng(value: number | null) {
  return value === null ? "Not provided" : value.toFixed(4);
}

function statusTone(status: LocalitySuggestionRecord["status"]) {
  if (status === "approved") return "success" as const;
  if (status === "rejected") return "danger" as const;
  return "warning" as const;
}

export function LocalitySuggestionsWorkspace({
  initialRecords,
}: {
  initialRecords: LocalitySuggestionRecord[];
}) {
  const [records, setRecords] = useState(initialRecords);
  const [selectedId, setSelectedId] = useState(initialRecords[0]?.id ?? "");
  const [note, setNote] = useState(initialRecords[0]?.reviewNote ?? "");
  const [mergeTargetCity, setMergeTargetCity] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [canonicalCities, setCanonicalCities] = useState<string[]>([]);
  const [canonicalCitiesLoading, setCanonicalCitiesLoading] = useState(false);
  const [canonicalCitiesError, setCanonicalCitiesError] = useState("");
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedId) ?? null,
    [records, selectedId],
  );

  const filteredRecords = records;
  const query = cityQuery.trim().toLowerCase();
  const selectedCityMatches = query
    ? canonicalCities.filter((city) => city.toLowerCase().includes(query))
    : [];
  const isCityLevelSuggestion =
    selectedRecord !== null &&
    selectedRecord.city.trim().toLowerCase() === selectedRecord.area.trim().toLowerCase() &&
    !selectedRecord.subArea.trim();
  const exactMatchExists =
    selectedRecord !== null &&
    isCityLevelSuggestion &&
    canonicalCities.some((city) => city.toLowerCase() === selectedRecord.city.toLowerCase());

  function syncSelection(record: LocalitySuggestionRecord | undefined) {
    if (!record) {
      setCanonicalCities([]);
      setCityQuery("");
      setCanonicalCitiesError("");
      return;
    }
    setSelectedId(record.id);
    setNote(record.reviewNote ?? "");
    setMergeTargetCity(record.duplicateCityHints?.[0] ?? "");
    setCityQuery("");
  }

  useEffect(() => {
    let active = true;
    if (!selectedRecord?.country || !selectedRecord?.state) {
      setCanonicalCities([]);
      setCanonicalCitiesError("");
      setCanonicalCitiesLoading(false);
      return () => {
        active = false;
      };
    }

    setCanonicalCitiesLoading(true);
    setCanonicalCitiesError("");
    const query = cityQuery.trim();

    fetch(
      `/api/backend/locality-catalog/cities?country=${encodeURIComponent(selectedRecord.country)}&state=${encodeURIComponent(selectedRecord.state)}${query ? `&q=${encodeURIComponent(query)}` : ""}`,
      {
        method: "GET",
        cache: "no-store",
      },
    )
      .then(async (response) => {
        if (!active) {
          return;
        }
        const body = (await response.json().catch(() => null)) as { data?: string[]; message?: string } | null;
        if (!response.ok || !Array.isArray(body?.data)) {
          setCanonicalCities([]);
          setCanonicalCitiesError(body?.message ?? "Unable to load canonical cities.");
          return;
        }
        setCanonicalCities(body.data);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setCanonicalCities([]);
        setCanonicalCitiesError("Unable to load canonical cities.");
      })
      .finally(() => {
        if (!active) {
          return;
        }
        setCanonicalCitiesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [cityQuery, selectedRecord?.country, selectedRecord?.state]);

  async function applyAction(action: "approve" | "merge" | "reject" | "blacklist") {
    if (!selectedRecord) {
      return;
    }
    if (action === "merge" && !mergeTargetCity.trim()) {
      setFeedback({ tone: "error", message: "Select a target city before merging." });
      return;
    }
    if ((action === "approve" || action === "merge") && exactMatchExists) {
      setFeedback({
        tone: "error",
        message: "This city already exists in the approved catalog for this state/region. Reject the suggestion instead.",
      });
      return;
    }

    setFeedback(null);
    const response = await fetch(`/api/backend/locality-suggestions/${encodeURIComponent(selectedRecord.id)}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note, mergeTargetCity }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      setFeedback({
        tone: "error",
        message: (body?.message as string | undefined) ?? "Unable to apply locality decision.",
      });
      return;
    }

    const nextRecords = records.filter((record) => record.id !== selectedRecord.id);
    setRecords(nextRecords);
    syncSelection(nextRecords[0]);
    const verb = action === "approve" ? "approved" : action === "merge" ? "merged" : action === "reject" ? "rejected" : "blacklisted";
    setFeedback({ tone: "success", message: `City suggestion ${verb}.` });
  }

  if (records.length === 0) {
    return (
      <SurfaceState
        description="Pending city suggestions from partners will appear here once they are submitted for review."
        title="No pending city suggestions"
        tone="empty"
      />
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <article className="tm-panel">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="tm-kicker">Locality Queue</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Pending city suggestions</h2>
          </div>
          <StatusBadge label={`${filteredRecords.length} pending`} tone="warning" />
        </div>

        <div className="mt-5 grid gap-4">
          {filteredRecords.map((record) => (
            <button
              key={record.id}
              className={`tm-review-listing text-left ${record.id === selectedId ? "tm-review-listing-active" : ""}`}
              onClick={() => syncSelection(record)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{record.city}</p>
                  <p className="tm-muted mt-1 text-sm">
                    {record.state} · {record.country}
                  </p>
                </div>
                <StatusBadge label={record.status} tone={statusTone(record.status)} />
              </div>
              <p className="tm-muted mt-3 text-sm">Area: {record.area || "Not provided"}</p>
              <p className="tm-muted mt-1 text-sm">Submitted: {record.createdAt.slice(0, 16).replace("T", " ")}</p>
            </button>
          ))}
        </div>
      </article>

      <article className="tm-panel min-w-0 h-fit">
        {selectedRecord ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="tm-kicker">City Review</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">{selectedRecord.city}</h2>
                <p className="tm-muted mt-2 text-sm">
                  {selectedRecord.area} · {selectedRecord.state} · {selectedRecord.country}
                </p>
              </div>
              <StatusBadge label={selectedRecord.status} tone={statusTone(selectedRecord.status)} />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="tm-soft-band">
                <p className="tm-label">Partner</p>
                <p className="mt-2 text-sm text-slate-900">{selectedRecord.partnerId}</p>
              </div>
              <div className="tm-soft-band">
                <p className="tm-label">Normalized slug</p>
                <p className="mt-2 text-sm text-slate-900 break-all">{selectedRecord.normalizedSlug}</p>
              </div>
              <div className="tm-soft-band">
                <p className="tm-label">Latitude</p>
                <p className="mt-2 text-sm text-slate-900">{formatLatLng(selectedRecord.latitude)}</p>
              </div>
              <div className="tm-soft-band">
                <p className="tm-label">Longitude</p>
                <p className="mt-2 text-sm text-slate-900">{formatLatLng(selectedRecord.longitude)}</p>
              </div>
            </div>

            <div className="mt-5 tm-soft-band">
              <p className="tm-label">Review note</p>
              <textarea
                className="tm-input mt-3 min-h-28"
                onChange={(event) => setNote(event.target.value)}
                value={note}
              />
            </div>

            <div className="mt-5 tm-soft-band">
              <p className="tm-label">Approved cities in scope</p>
              <p className="mt-2 text-sm text-slate-900">
                Search approved cities in the same state/region, then select one target city for merge or review.
              </p>
              <input
                className="tm-input mt-3"
                onChange={(event) => setCityQuery(event.target.value)}
                placeholder="Search approved cities"
                value={cityQuery}
              />
              {canonicalCitiesLoading ? <p className="mt-2 text-xs text-slate-500">Loading approved cities…</p> : null}
              {canonicalCitiesError ? <p className="mt-2 text-xs text-rose-700">{canonicalCitiesError}</p> : null}
              {exactMatchExists ? (
                <p className="mt-2 text-xs font-semibold text-rose-700">
                  Exact match already exists in the approved catalog. Use Merge or Reject instead of Approve.
                </p>
              ) : null}
              <div className="mt-3 grid gap-2">
                {query ? (
                  selectedCityMatches.length > 0 ? (
                    selectedCityMatches.map((city) => (
                      <button
                        key={city}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                          city === mergeTargetCity
                            ? "border-[#033D89] bg-[#033D89]/5 text-slate-950"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                        onClick={() => setMergeTargetCity(city)}
                        type="button"
                      >
                        <span>{city}</span>
                        {city === mergeTargetCity ? <span className="text-xs font-medium text-[#033D89]">Selected</span> : null}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-slate-600">No approved cities found for this scope.</p>
                  )
                ) : (
                  <p className="text-sm text-slate-600">Type to search approved cities in this state/region.</p>
                )}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Selected target: {mergeTargetCity || "None"}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button className="tm-btn tm-btn-primary" onClick={() => void applyAction("approve")} type="button">
                Approve
              </button>
              <button className="tm-btn tm-btn-outline" onClick={() => void applyAction("merge")} type="button">
                Merge
              </button>
              <button className="tm-btn tm-btn-outline" onClick={() => void applyAction("reject")} type="button">
                Reject
              </button>
              <button className="tm-btn tm-btn-outline" onClick={() => void applyAction("blacklist")} type="button">
                Blacklist
              </button>
            </div>

            {feedback ? <p className={`mt-4 text-sm ${feedback.tone === "error" ? "text-rose-700" : "text-emerald-700"}`}>{feedback.message}</p> : null}
          </>
        ) : (
          <SurfaceState
            description="Pick a pending city suggestion from the queue to inspect its scope and take an action."
            title="Select a city suggestion"
            tone="empty"
          />
        )}
      </article>
    </section>
  );
}
