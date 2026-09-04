"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

const ADMIN_API = "http://localhost:5000/api/admin";

interface PolicyDefinition {
  ptype: "p" | "p2" | "p3";
  lob?: string | null;
  page?: string | null;
  module?: string | null;
  section?: string | null;
  access?: string | null;
  field?: string | null;
  parent?: string | null;
  displayName?: string | null;
  route?: string | null;
}

interface PolicySummary {
  permission: string;
  ptype: "p" | "p2" | "p3";
  definitions: PolicyDefinition[];
}

interface AddPolicyToBundleModalProps {
  bundleId: number;
  bundleName: string;
  initialPtype?: "all" | "p" | "p2" | "p3";
  onClose: () => void;
  onAdded: () => void;
}

function describeDefinitions(policy: PolicySummary): string {
  if (policy.definitions.length === 0) return "No definition";
  if (policy.definitions.length > 1) {
    return `${policy.definitions.length} definitions available`;
  }
  const [d] = policy.definitions;
  if (d.ptype === "p2") {
    return (
      [d.lob, d.parent, d.displayName].filter(Boolean).join(" / ") +
      (d.route ? ` · ${d.route}` : "")
    );
  }
  if (d.ptype === "p3") {
    return (
      [d.lob, d.page, d.module, d.section, d.field].filter(Boolean).join(" / ") +
      (d.access ? ` · ${d.access}` : "")
    );
  }
  return (
    [d.lob, d.page, d.module, d.section].filter(Boolean).join(" / ") +
    (d.access ? ` · ${d.access}` : "")
  );
}

export default function AddPolicyToBundleModal({
  bundleId,
  bundleName,
  initialPtype = "all",
  onClose,
  onAdded,
}: AddPolicyToBundleModalProps) {
  const [available, setAvailable] = useState<PolicySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [ptypeFilter, setPtypeFilter] = useState<"all" | "p" | "p2" | "p3">(initialPtype);
  const [selected, setSelected] = useState<PolicySummary | null>(null);
  const [saving, setSaving] = useState(false);

  const loadAvailable = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get<PolicySummary[]>(
        `${ADMIN_API}/policy-bundles/${bundleId}/available-policies`
      );
      setAvailable(res.data);
    } catch (err) {
      console.error("Load available policies error:", err);
      setError("Unable to load available policies.");
    } finally {
      setLoading(false);
    }
  }, [bundleId]);

  useEffect(() => {
    loadAvailable();
  }, [loadAvailable]);

  const filtered = useMemo(
    () =>
      available
        .filter((p) => ptypeFilter === "all" || p.ptype === ptypeFilter)
        .filter((p) =>
          p.permission.toLowerCase().includes(search.toLowerCase())
        ),
    [available, search, ptypeFilter]
  );

  const handleSave = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      setError("");
      await axios.post(
        `${ADMIN_API}/policy-bundles/${bundleId}/policies`,
        {
          policyName: selected.permission,
          ptype: selected.ptype,
        }
      );
      onAdded();
    } catch (err: unknown) {
      console.error("Add policy to bundle error:", err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(String(err.response.data.message));
      } else {
        setError("Unable to add policy to bundle.");
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
        className="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-[#C81E1E]">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Policy to Bundle</h3>
              <p className="text-xs text-slate-500">
                Adding to bundle <strong className="text-slate-800">{bundleName}</strong>
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

        {/* Search + type filter tabs (Scan Tag pill style) */}
        <div className="space-y-3 border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search policies by permission name..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#C81E1E] focus:ring-2 focus:ring-red-100"
            autoFocus
          />

          {/* Pill tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(["all", "p", "p2", "p3"] as const).map((t) => {
              const count =
                t === "all"
                  ? available.length
                  : available.filter((p) => p.ptype === t).length;
              const isActive = ptypeFilter === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPtypeFilter(t)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span>
                    {t === "all"
                      ? "All"
                      : t === "p"
                      ? "p (Section)"
                      : t === "p2"
                      ? "p2 (Menu)"
                      : "p3 (Field)"}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="py-8 text-center text-xs text-slate-400">
              Loading available policies…
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">
              No unassigned policies found matching current filters.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {filtered.map((policy) => {
                const isSelected =
                  selected?.permission === policy.permission &&
                  selected?.ptype === policy.ptype;
                return (
                  <li key={`${policy.ptype}-${policy.permission}`}>
                    <button
                      type="button"
                      onClick={() => setSelected(policy)}
                      className={`flex w-full items-start justify-between gap-3 rounded-xl border p-3 text-left transition ${
                        isSelected
                          ? "border-[#C81E1E] bg-red-50/40 shadow-xs ring-1 ring-[#C81E1E]"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                              policy.ptype === "p2"
                                ? "bg-purple-100 text-purple-700"
                                : policy.ptype === "p3"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {policy.ptype}
                          </span>
                          <span
                            className={`font-mono text-xs font-semibold ${
                              isSelected ? "text-[#C81E1E]" : "text-slate-800"
                            }`}
                          >
                            {policy.permission}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500 line-clamp-1">
                          {describeDefinitions(policy)}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#C81E1E] text-white text-[10px] font-bold">
                          ✓
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <span className="text-xs text-slate-500">
            {selected ? (
              <span>
                Selected: <strong className="text-slate-800">{selected.permission}</strong> ({selected.ptype})
              </span>
            ) : (
              <span>Select a policy above</span>
            )}
          </span>
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
              disabled={!selected || saving}
              className="rounded-lg bg-[#C81E1E] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Adding…" : "Add Policy to Bundle"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
