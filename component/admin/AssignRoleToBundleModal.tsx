"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

const ADMIN_API = "http://localhost:5000/api/admin";

interface AssignRoleToBundleModalProps {
  bundleId: number;
  bundleName: string;
  onClose: () => void;
  onAssigned: () => void;
}

export default function AssignRoleToBundleModal({
  bundleId,
  bundleName,
  onClose,
  onAssigned,
}: AssignRoleToBundleModalProps) {
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadAvailable = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get<string[]>(
        `${ADMIN_API}/policy-bundles/${bundleId}/available-roles`
      );
      setAvailableRoles(res.data);
    } catch (err) {
      console.error("Load available roles error:", err);
      setError("Unable to load available roles.");
    } finally {
      setLoading(false);
    }
  }, [bundleId]);

  useEffect(() => {
    loadAvailable();
  }, [loadAvailable]);

  const filtered = useMemo(
    () =>
      availableRoles.filter((r) =>
        r.toLowerCase().includes(search.toLowerCase())
      ),
    [availableRoles, search]
  );

  const handleSave = async () => {
    if (!selectedRole) return;
    try {
      setSaving(true);
      setError("");
      await axios.post(
        `${ADMIN_API}/policy-bundles/${bundleId}/roles`,
        { roleName: selectedRole }
      );
      onAssigned();
    } catch (err: unknown) {
      console.error("Assign role error:", err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(String(err.response.data.message));
      } else {
        setError("Unable to assign role to bundle.");
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
            <h3 className="text-lg font-bold text-slate-900">Assign Role</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Grant &ldquo;{bundleName}&rdquo; to a user role (via Casbin g3 rule).
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
            placeholder="Search roles..."
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
              Loading roles…
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No unassigned roles found.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {filtered.map((role) => (
                <li key={role}>
                  <button
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                      selectedRole === role
                        ? "border-violet-400 bg-violet-50 text-violet-900 font-medium"
                        : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span>{role}</span>
                    {selectedRole === role && (
                      <span className="shrink-0 text-violet-600">✓</span>
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
            disabled={!selectedRole || saving}
            className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Assigning…" : "Assign Role"}
          </button>
        </div>
      </div>
    </div>
  );
}

