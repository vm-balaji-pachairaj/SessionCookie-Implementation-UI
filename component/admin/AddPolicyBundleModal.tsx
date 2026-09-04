"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

const ADMIN_API = "http://localhost:5000/api/admin";

interface AvailableBundle {
  id: number;
  name: string;
  description: string | null;
  policyCount: number;
}

interface BundlePolicyDetail {
  permission: string;
  ptype: "p" | "p2" | "p3";
  page?: string | null;
  module?: string | null;
  section?: string | null;
  field?: string | null;
  access?: string | null;
  displayName?: string | null;
  route?: string | null;
}

interface AddPolicyBundleModalProps {
  role: string;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddPolicyBundleModal({
  role,
  onClose,
  onAdded,
}: AddPolicyBundleModalProps) {
  const [available, setAvailable] = useState<AvailableBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedBundleId, setSelectedBundleId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Policies preview for selected bundle
  const [bundlePolicies, setBundlePolicies] = useState<BundlePolicyDetail[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);

  const loadAvailable = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get<AvailableBundle[]>(
        `${ADMIN_API}/roles/${encodeURIComponent(role)}/available-bundles`
      );
      setAvailable(res.data);
      if (res.data.length > 0) {
        setSelectedBundleId(res.data[0].id);
      }
    } catch (err) {
      console.error("Load available bundles error:", err);
      setError("Unable to load available policy bundles.");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadAvailable();
  }, [loadAvailable]);

  // Load policies whenever selected bundle changes
  useEffect(() => {
    if (!selectedBundleId) {
      setBundlePolicies([]);
      return;
    }
    let isCurrent = true;
    async function fetchPolicies() {
      try {
        setLoadingPolicies(true);
        const res = await axios.get<BundlePolicyDetail[]>(
          `${ADMIN_API}/policy-bundles/${selectedBundleId}/policies`
        );
        if (isCurrent) {
          setBundlePolicies(res.data);
        }
      } catch (err) {
        console.error("Failed to load bundle preview policies:", err);
      } finally {
        if (isCurrent) setLoadingPolicies(false);
      }
    }
    fetchPolicies();
    return () => {
      isCurrent = false;
    };
  }, [selectedBundleId]);

  const filtered = useMemo(
    () =>
      available.filter(
        (b) =>
          b.name.toLowerCase().includes(search.toLowerCase()) ||
          (b.description &&
            b.description.toLowerCase().includes(search.toLowerCase()))
      ),
    [available, search]
  );

  const selectedBundle = useMemo(
    () => available.find((b) => b.id === selectedBundleId) || null,
    [available, selectedBundleId]
  );

  const handleSave = async () => {
    if (!selectedBundle) return;
    try {
      setSaving(true);
      setError("");
      await axios.post(
        `${ADMIN_API}/roles/${encodeURIComponent(role)}/bundles`,
        { bundleName: selectedBundle.name }
      );
      onAdded();
    } catch (err: unknown) {
      console.error("Assign bundle error:", err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(String(err.response.data.message));
      } else {
        setError("Unable to assign policy bundle to role.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Scan Tag Style) */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-[#C81E1E]">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2l-8 4v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4zm1 14h-2v-3H8v-2h3V8h2v3h3v2h-3v3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Add Policy Bundle to Role
              </h3>
              <p className="text-xs text-slate-500">
                Select a bundle to assign to <strong className="text-slate-800 font-semibold">{role}</strong>. Inspect policies in the right panel.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* 2-Pane Content: Left = Bundle Selection, Right = Bundle Policies Display */}
        <div className="grid flex-1 grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 overflow-hidden">
          {/* Left Column: Bundles list */}
          <div className="flex flex-col overflow-hidden bg-slate-50/50 p-4">
            <div className="mb-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search available bundles..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#C81E1E] focus:ring-2 focus:ring-red-100"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loading ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  Loading bundles…
                </p>
              ) : filtered.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  No unassigned policy bundles found.
                </p>
              ) : (
                filtered.map((bundle) => {
                  const isSelected = selectedBundleId === bundle.id;
                  return (
                    <button
                      key={bundle.id}
                      type="button"
                      onClick={() => setSelectedBundleId(bundle.id)}
                      className={`flex w-full items-start justify-between gap-3 rounded-xl border p-3 text-left transition ${
                        isSelected
                          ? "border-[#C81E1E] bg-white shadow-xs ring-1 ring-[#C81E1E]"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold ${
                              isSelected ? "text-[#C81E1E]" : "text-slate-900"
                            }`}
                          >
                            {bundle.name}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            {bundle.policyCount} {bundle.policyCount === 1 ? "policy" : "policies"}
                          </span>
                        </div>
                        {bundle.description && (
                          <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                            {bundle.description}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#C81E1E] text-white text-[10px] font-bold">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Policies inside Selected Bundle */}
          <div className="flex flex-col overflow-hidden bg-white p-4">
            <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Policies in Bundle
                </p>
                <h4 className="text-sm font-bold text-slate-900">
                  {selectedBundle ? selectedBundle.name : "Select a bundle"}
                </h4>
              </div>
              {selectedBundle && (
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-[#C81E1E]">
                  {bundlePolicies.length} policies loaded
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {!selectedBundle ? (
                <div className="flex h-full items-center justify-center py-12 text-center text-xs text-slate-400">
                  Select a policy bundle on the left to preview its permissions.
                </div>
              ) : loadingPolicies ? (
                <div className="flex h-full items-center justify-center py-12 text-center text-xs text-slate-400">
                  Loading bundle policies…
                </div>
              ) : bundlePolicies.length === 0 ? (
                <div className="flex h-full items-center justify-center py-12 text-center text-xs text-slate-400">
                  This bundle currently contains no individual policies.
                </div>
              ) : (
                <div className="space-y-2">
                  {bundlePolicies.map((p, idx) => (
                    <div
                      key={`${p.permission}-${idx}`}
                      className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 transition hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-800 truncate">
                          {p.permission}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                            p.ptype === "p2"
                              ? "bg-purple-100 text-purple-700"
                              : p.ptype === "p3"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {p.ptype === "p" ? "p (section)" : p.ptype === "p2" ? "p2 (menu)" : "p3 (field)"}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-slate-600">
                        {p.page && <span>Page: <strong>{p.page}</strong></span>}
                        {p.module && <span>• Module: <strong>{p.module}</strong></span>}
                        {p.section && <span>• Section: <strong>{p.section}</strong></span>}
                        {p.field && <span>• Field: <strong>{p.field}</strong></span>}
                        {p.access && (
                          <span className="rounded bg-white border border-slate-200 px-1 font-semibold text-slate-700">
                            {p.access}
                          </span>
                        )}
                        {p.displayName && <span>Menu: <strong>{p.displayName}</strong></span>}
                        {p.route && <span className="font-mono text-slate-500">({p.route})</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <div className="text-xs text-slate-500">
            {selectedBundle ? (
              <span>
                Assigning <strong>{selectedBundle.name}</strong> to <strong>{role}</strong> (g3 rule)
              </span>
            ) : (
              <span>No bundle selected</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!selectedBundle || saving}
              className="rounded-lg bg-[#C81E1E] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Assigning…" : "Assign Bundle to Role"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
