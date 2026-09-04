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
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadAvailable = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get<AvailableBundle[]>(
        `${ADMIN_API}/roles/${encodeURIComponent(role)}/available-bundles`
      );
      setAvailable(res.data);
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

  const handleSave = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      setError("");
      await axios.post(
        `${ADMIN_API}/roles/${encodeURIComponent(role)}/bundles`,
        { bundleName: selected }
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
            <h3 className="text-lg font-bold text-slate-900">
              Add Policy Bundle
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Assign an existing policy bundle to role &ldquo;{role}&rdquo;.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search available bundles..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            autoFocus
          />
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
              Loading policy bundles…
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No unassigned policy bundles found.
            </p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((bundle) => (
                <li key={bundle.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(bundle.name)}
                    className={`flex w-full items-start justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
                      selected === bundle.name
                        ? "border-violet-400 bg-violet-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium text-sm ${
                            selected === bundle.name
                              ? "text-violet-900"
                              : "text-slate-800"
                          }`}
                        >
                          {bundle.name}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                          {bundle.policyCount} polic
                          {bundle.policyCount !== 1 ? "ies" : "y"}
                        </span>
                      </div>
                      {bundle.description && (
                        <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                          {bundle.description}
                        </p>
                      )}
                    </div>
                    {selected === bundle.name && (
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
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!selected || saving}
            className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Assigning…" : "Add Policy Bundle"}
          </button>
        </div>
      </div>
    </div>
  );
}

