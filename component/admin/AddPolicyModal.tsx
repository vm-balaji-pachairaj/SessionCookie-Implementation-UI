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

interface AddPolicyModalProps {
  role: string;
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

export default function AddPolicyModal({
  role,
  onClose,
  onAdded,
}: AddPolicyModalProps) {
  const [available, setAvailable] = useState<PolicySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [ptypeFilter, setPtypeFilter] = useState<"all" | "p" | "p2" | "p3">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadAvailable = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get<PolicySummary[]>(
        `${ADMIN_API}/roles/${encodeURIComponent(role)}/available-policies`
      );
      setAvailable(res.data);
    } catch (err) {
      console.error("Load available policies error:", err);
      setError("Unable to load available policies.");
    } finally {
      setLoading(false);
    }
  }, [role]);

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
        `${ADMIN_API}/roles/${encodeURIComponent(role)}/policies`,
        { permission: selected }
      );
      onAdded();
    } catch (err) {
      console.error("Add policy error:", err);
      setError("Unable to add policy.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Add Policy</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Assign an existing policy to role &ldquo;{role}&rdquo;.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* Search + type filter */}
        <div className="space-y-2 px-6 pt-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search permissions..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
          <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {(["all", "p", "p2", "p3"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setPtypeFilter(t)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  ptypeFilter === t
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t === "all" ? "All" : t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Loading permissions…
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No unassigned permissions found.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {filtered.map((policy) => (
                <li key={`${policy.ptype}:${policy.permission}`}>
                  <button
                    onClick={() => setSelected(policy.permission)}
                    className={`flex w-full items-start justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
                      selected === policy.permission
                        ? "border-violet-400 bg-violet-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            policy.ptype === "p2"
                              ? "bg-sky-50 text-sky-700"
                              : policy.ptype === "p3"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-violet-50 text-violet-700"
                          }`}
                        >
                          {policy.ptype.toUpperCase()}
                        </span>
                        <span
                          className={`block truncate font-mono text-xs ${
                            selected === policy.permission
                              ? "text-violet-700"
                              : "text-slate-700"
                          }`}
                        >
                          {policy.permission}
                        </span>
                      </span>
                      <span className="mt-1 block truncate text-[11px] text-slate-400">
                        {describeDefinitions(policy)}
                      </span>
                    </div>
                    {selected === policy.permission && (
                      <span className="mt-0.5 shrink-0 text-violet-600">✓</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selected || saving}
            className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
