"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import AddPolicyBundleModal from "./AddPolicyBundleModal";
import ConfirmDialog from "./ConfirmDialog";

const ADMIN_API = "http://localhost:5000/api/admin";

interface RoleBundle {
  id: number;
  name: string;
  description: string | null;
  policyCount: number;
}

interface BundlePolicyPreview {
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

interface RoleBundlesPanelProps {
  role: string;
  onBundleChanged?: () => void;
}

export default function RoleBundlesPanel({
  role,
  onBundleChanged,
}: RoleBundlesPanelProps) {
  const [bundles, setBundles] = useState<RoleBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedBundleId, setExpandedBundleId] = useState<number | null>(null);
  const [expandedPolicies, setExpandedPolicies] = useState<
    BundlePolicyPreview[]
  >([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);

  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadBundles = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get<RoleBundle[]>(
        `${ADMIN_API}/roles/${encodeURIComponent(role)}/bundles`
      );
      setBundles(res.data);
    } catch (err) {
      console.error("Load role bundles error:", err);
      setError("Unable to load policy bundles for this role.");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadBundles();
  }, [loadBundles]);

  const toggleExpand = async (bundleId: number) => {
    if (expandedBundleId === bundleId) {
      setExpandedBundleId(null);
      setExpandedPolicies([]);
      return;
    }

    try {
      setExpandedBundleId(bundleId);
      setLoadingPolicies(true);
      const res = await axios.get<BundlePolicyPreview[]>(
        `${ADMIN_API}/policy-bundles/${bundleId}/policies`
      );
      setExpandedPolicies(res.data);
    } catch (err) {
      console.error("Load preview policies error:", err);
    } finally {
      setLoadingPolicies(false);
    }
  };

  const handleRemoveConfirmed = async () => {
    if (!removeTarget) return;
    try {
      setRemoving(true);
      await axios.delete(
        `${ADMIN_API}/roles/${encodeURIComponent(
          role
        )}/bundles/${encodeURIComponent(removeTarget)}`
      );
      setRemoveTarget(null);
      if (
        expandedBundleId !== null &&
        bundles.find((b) => b.id === expandedBundleId)?.name === removeTarget
      ) {
        setExpandedBundleId(null);
      }
      await loadBundles();
      onBundleChanged?.();
    } catch (err) {
      console.error("Remove bundle error:", err);
      setError("Unable to remove policy bundle from role.");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              Assigned Policy Bundles
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {bundles.length} policy bundle
              {bundles.length !== 1 ? "s" : ""} assigned (via Casbin g3 mapping)
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-violet-500/20 transition hover:bg-violet-500"
          >
            + Add Policy Bundle
          </button>
        </div>

        <div className="px-6 py-4">
          {error && (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Loading policy bundles…
            </p>
          ) : bundles.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-500">
                No policy bundles assigned to this role yet.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-3 inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"
              >
                + Assign your first bundle
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    {["Bundle Name", "Description", "Policies", "Actions"].map(
                      (h) => (
                        <th
                          key={h}
                          className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bundles.map((bundle) => {
                    const isExpanded = expandedBundleId === bundle.id;
                    return (
                      <tr key={bundle.id} className="group">
                        <td colSpan={4} className="p-0">
                          <div className="flex items-center justify-between px-2 py-3.5 hover:bg-slate-50">
                            <div className="min-w-0 flex-1 pr-4">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(bundle.id)}
                                  className="text-slate-400 hover:text-slate-700 font-mono text-xs w-4"
                                  title={
                                    isExpanded
                                      ? "Collapse preview"
                                      : "Expand policies preview"
                                  }
                                >
                                  {isExpanded ? "▼" : "▶"}
                                </button>
                                <Link
                                  href={`/admin/bundles/${bundle.id}`}
                                  className="font-medium text-slate-900 hover:text-violet-600 transition"
                                >
                                  {bundle.name}
                                </Link>
                              </div>
                            </div>

                            <div className="flex-1 pr-4">
                              <p className="text-xs text-slate-500 line-clamp-1">
                                {bundle.description || "—"}
                              </p>
                            </div>

                            <div className="w-32 pr-4">
                              <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                                {bundle.policyCount} polic
                                {bundle.policyCount !== 1 ? "ies" : "y"}
                              </span>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              <Link
                                href={`/admin/bundles/${bundle.id}`}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-violet-400 hover:text-violet-700"
                              >
                                View Bundle
                              </Link>
                              <button
                                type="button"
                                onClick={() => setRemoveTarget(bundle.name)}
                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                              >
                                Remove from Role
                              </button>
                            </div>
                          </div>

                          {/* Expanded policies preview accordion */}
                          {isExpanded && (
                            <div className="bg-slate-50/80 px-6 py-3 border-t border-slate-100 mb-2">
                              <p className="text-xs font-semibold text-slate-600 mb-2">
                                Policies in &ldquo;{bundle.name}&rdquo;:
                              </p>
                              {loadingPolicies ? (
                                <p className="text-xs text-slate-400 py-2">
                                  Loading bundle policies…
                                </p>
                              ) : expandedPolicies.length === 0 ? (
                                <p className="text-xs text-slate-400 py-2">
                                  No policies configured in this bundle.
                                </p>
                              ) : (
                                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-2">
                                  {expandedPolicies.map((p, idx) => (
                                    <span
                                      key={`${p.permission}-${idx}`}
                                      className="inline-flex items-center gap-1.5 rounded-md bg-white border border-slate-200 px-2 py-1 text-xs text-slate-700 font-mono shadow-2xs"
                                    >
                                      <span
                                        className={`rounded px-1 text-[9px] font-bold ${
                                          p.ptype === "p2"
                                            ? "bg-sky-100 text-sky-800"
                                            : p.ptype === "p3"
                                              ? "bg-amber-100 text-amber-800"
                                              : "bg-violet-100 text-violet-800"
                                        }`}
                                      >
                                        {p.ptype.toUpperCase()}
                                      </span>
                                      {p.permission}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {showAddModal && (
        <AddPolicyBundleModal
          role={role}
          onClose={() => setShowAddModal(false)}
          onAdded={async () => {
            setShowAddModal(false);
            await loadBundles();
            onBundleChanged?.();
          }}
        />
      )}

      {removeTarget && (
        <ConfirmDialog
          title="Remove Policy Bundle"
          message={`Remove policy bundle "${removeTarget}" from role "${role}"? Role members will no longer inherit policies from this bundle.`}
          confirmLabel={removing ? "Removing…" : "Remove from Role"}
          confirmDisabled={removing}
          onConfirm={handleRemoveConfirmed}
          onCancel={() => setRemoveTarget(null)}
        />
      )}
    </>
  );
}

