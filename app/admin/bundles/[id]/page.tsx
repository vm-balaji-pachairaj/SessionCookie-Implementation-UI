"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import PolicyDefinitionsModal, {
  PolicyDefinition,
} from "@/component/admin/PolicyDefinitionsModal";
import AddPolicyToBundleModal from "@/component/admin/AddPolicyToBundleModal";
import AssignRoleToBundleModal from "@/component/admin/AssignRoleToBundleModal";
import EditPolicyBundleModal from "@/component/admin/EditPolicyBundleModal";
import ConfirmDialog from "@/component/admin/ConfirmDialog";

const ADMIN_API = "http://localhost:5000/api/admin";

interface BundleDetails {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  assignedRoles: string[];
}

interface BundlePolicy {
  permission: string;
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

type PtypeFilter = "all" | "p" | "p2" | "p3";

function describePolicy(p: BundlePolicy): string {
  if (p.ptype === "p2") {
    return (
      [p.parent, p.displayName].filter(Boolean).join(" / ") +
      (p.route ? ` · ${p.route}` : "")
    );
  }
  if (p.ptype === "p3") {
    return (
      [p.page, p.module, p.section, p.field].filter(Boolean).join(" / ") +
      (p.access ? ` · ${p.access}` : "")
    );
  }
  return (
    [p.page, p.module, p.section].filter(Boolean).join(" / ") +
    (p.access ? ` · ${p.access}` : "")
  );
}

export default function PolicyBundleDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const bundleId = parseInt(params.id, 10);

  const [bundle, setBundle] = useState<BundleDetails | null>(null);
  const [policies, setPolicies] = useState<BundlePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [policySearch, setPolicySearch] = useState("");
  const [ptypeFilter, setPtypeFilter] = useState<PtypeFilter>("all");

  // Modals state
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [showAssignRole, setShowAssignRole] = useState(false);
  const [showEditBundle, setShowEditBundle] = useState(false);

  const [activeDefinition, setActiveDefinition] = useState<{
    permission: string;
    definitions: PolicyDefinition[];
  } | null>(null);

  const [removePolicyTarget, setRemovePolicyTarget] = useState<string | null>(
    null
  );
  const [removingPolicy, setRemovingPolicy] = useState(false);

  const [removeRoleTarget, setRemoveRoleTarget] = useState<string | null>(null);
  const [removingRole, setRemovingRole] = useState(false);

  const [deletingBundle, setDeletingBundle] = useState(false);
  const [showDeleteBundleConfirm, setShowDeleteBundleConfirm] = useState(false);

  const loadData = useCallback(async () => {
    if (isNaN(bundleId)) return;
    try {
      setLoading(true);
      setError("");
      const [bundleRes, policiesRes] = await Promise.all([
        axios.get<BundleDetails>(`${ADMIN_API}/policy-bundles/${bundleId}`),
        axios.get<BundlePolicy[]>(
          `${ADMIN_API}/policy-bundles/${bundleId}/policies`
        ),
      ]);
      setBundle(bundleRes.data);
      setPolicies(policiesRes.data);
    } catch (err) {
      console.error("Load bundle detail error:", err);
      setError("Unable to load policy bundle details.");
    } finally {
      setLoading(false);
    }
  }, [bundleId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Counts
  const pCount = useMemo(
    () => policies.filter((p) => p.ptype === "p").length,
    [policies]
  );
  const p2Count = useMemo(
    () => policies.filter((p) => p.ptype === "p2").length,
    [policies]
  );
  const p3Count = useMemo(
    () => policies.filter((p) => p.ptype === "p3").length,
    [policies]
  );

  const filteredPolicies = useMemo(
    () =>
      policies
        .filter((p) => ptypeFilter === "all" || p.ptype === ptypeFilter)
        .filter((p) =>
          p.permission.toLowerCase().includes(policySearch.toLowerCase())
        ),
    [policies, policySearch, ptypeFilter]
  );

  const handleViewDefinition = async (p: BundlePolicy) => {
    try {
      const res = await axios.get<PolicyDefinition[]>(
        `${ADMIN_API}/policies/${encodeURIComponent(p.permission)}/definitions`,
        { params: { ptype: p.ptype } }
      );
      setActiveDefinition({
        permission: p.permission,
        definitions: res.data,
      });
    } catch (err) {
      console.error("View definition error:", err);
    }
  };

  const handleRemovePolicyConfirmed = async () => {
    if (!removePolicyTarget) return;
    try {
      setRemovingPolicy(true);
      await axios.delete(
        `${ADMIN_API}/policy-bundles/${bundleId}/policies/${encodeURIComponent(
          removePolicyTarget
        )}`
      );
      setRemovePolicyTarget(null);
      await loadData();
    } catch (err) {
      console.error("Remove policy error:", err);
      setError("Unable to remove policy from bundle.");
    } finally {
      setRemovingPolicy(false);
    }
  };

  const handleRemoveRoleConfirmed = async () => {
    if (!removeRoleTarget) return;
    try {
      setRemovingRole(true);
      await axios.delete(
        `${ADMIN_API}/policy-bundles/${bundleId}/roles/${encodeURIComponent(
          removeRoleTarget
        )}`
      );
      setRemoveRoleTarget(null);
      await loadData();
    } catch (err) {
      console.error("Remove role error:", err);
      setError("Unable to remove role from bundle.");
    } finally {
      setRemovingRole(false);
    }
  };

  const handleDeleteBundleConfirmed = async () => {
    try {
      setDeletingBundle(true);
      await axios.delete(`${ADMIN_API}/policy-bundles/${bundleId}`);
      router.push("/admin");
    } catch (err) {
      console.error("Delete bundle error:", err);
      setError("Unable to delete policy bundle.");
      setDeletingBundle(false);
      setShowDeleteBundleConfirm(false);
    }
  };

  if (loading && !bundle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans flex items-center justify-center">
        <p className="text-sm text-slate-500">Loading bundle details…</p>
      </div>
    );
  }

  if (!bundle && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans px-6 py-10">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-slate-600">Policy bundle not found.</p>
          <Link
            href="/admin"
            className="mt-4 inline-block text-sm font-semibold text-violet-600 hover:underline"
          >
            ← Return to Admin Console
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
        <div className="mx-auto max-w-6xl px-6 py-10">
          {/* Breadcrumb & Top Bar */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
                Admin / Policy Bundles / {bundle?.name}
              </p>
              <div className="mt-1 flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900">
                  {bundle?.name}
                </h1>
                <button
                  type="button"
                  onClick={() => setShowEditBundle(true)}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition"
                >
                  Edit Info
                </button>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {bundle?.description || "No description provided for this bundle."}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteBundleConfirm(true)}
                className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50"
              >
                Delete Bundle
              </button>
              <Link
                href="/admin"
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
              >
                ← Admin Console
              </Link>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Metric Summary Cards */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-400">Total Policies</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {policies.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-400">P (Sections)</p>
              <p className="mt-1 text-2xl font-bold text-violet-700">{pCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-400">P2 (Menus)</p>
              <p className="mt-1 text-2xl font-bold text-sky-700">{p2Count}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-400">P3 (Fields)</p>
              <p className="mt-1 text-2xl font-bold text-amber-700">{p3Count}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-400">Assigned Roles</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {bundle?.assignedRoles.length ?? 0}
              </p>
            </div>
          </div>

          {/* Assigned Roles Section */}
          <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">Assigned Roles</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  User roles that inherit the permissions inside this bundle (Casbin g3 rules).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignRole(true)}
                className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-violet-500/20 transition hover:bg-violet-500"
              >
                + Assign Role
              </button>
            </div>

            <div className="px-6 py-4">
              {(!bundle?.assignedRoles || bundle.assignedRoles.length === 0) ? (
                <div className="py-6 text-center text-sm text-slate-500">
                  No roles are currently assigned to this bundle.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {bundle.assignedRoles.map((role) => (
                    <div
                      key={role}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-sm"
                    >
                      <Link
                        href={`/admin/roles/${encodeURIComponent(role)}`}
                        className="font-medium text-slate-800 hover:text-violet-600 transition"
                      >
                        {role}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setRemoveRoleTarget(role)}
                        className="text-slate-400 hover:text-red-600 text-xs transition"
                        title="Unassign role"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Bundle Policies Section */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">Bundle Policies</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Individual policies grouped in this bundle (P, P2, and P3).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                  {(["all", "p", "p2", "p3"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
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
                <input
                  value={policySearch}
                  onChange={(e) => setPolicySearch(e.target.value)}
                  placeholder="Search policies..."
                  className="w-48 sm:w-64 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
                <button
                  type="button"
                  onClick={() => setShowAddPolicy(true)}
                  className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-violet-500/20 transition hover:bg-violet-500"
                >
                  + Add Policy
                </button>
              </div>
            </div>

            <div className="px-6 py-4">
              {filteredPolicies.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No policies found in this bundle matching the criteria.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        {["#", "Type", "Policy Name", "Details", "Actions"].map(
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
                      {filteredPolicies.map((p, idx) => (
                        <tr
                          key={`${p.ptype}:${p.permission}`}
                          className="hover:bg-slate-50"
                        >
                          <td className="py-3 pr-4 text-xs text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                p.ptype === "p2"
                                  ? "bg-sky-50 text-sky-700"
                                  : p.ptype === "p3"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-violet-50 text-violet-700"
                              }`}
                            >
                              {p.ptype.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 pr-4 max-w-[240px] truncate font-mono text-xs text-slate-700">
                            {p.permission}
                          </td>
                          <td className="py-3 pr-4 text-slate-700 text-xs">
                            {describePolicy(p)}
                          </td>
                          <td className="py-3 pr-2">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleViewDefinition(p)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-violet-400 hover:text-violet-700"
                              >
                                View Definition
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setRemovePolicyTarget(p.permission)
                                }
                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Modals */}
      {showEditBundle && bundle && (
        <EditPolicyBundleModal
          bundleId={bundle.id}
          initialName={bundle.name}
          initialDescription={bundle.description}
          onClose={() => setShowEditBundle(false)}
          onUpdated={async (updatedName, updatedDescription) => {
            setShowEditBundle(false);
            setBundle((prev) =>
              prev
                ? {
                    ...prev,
                    name: updatedName,
                    description: updatedDescription,
                  }
                : null
            );
          }}
        />
      )}

      {showAssignRole && bundle && (
        <AssignRoleToBundleModal
          bundleId={bundle.id}
          bundleName={bundle.name}
          onClose={() => setShowAssignRole(false)}
          onAssigned={async () => {
            setShowAssignRole(false);
            await loadData();
          }}
        />
      )}

      {showAddPolicy && bundle && (
        <AddPolicyToBundleModal
          bundleId={bundle.id}
          bundleName={bundle.name}
          onClose={() => setShowAddPolicy(false)}
          onAdded={async () => {
            setShowAddPolicy(false);
            await loadData();
          }}
        />
      )}

      {activeDefinition && (
        <PolicyDefinitionsModal
          title={activeDefinition.permission}
          definitions={activeDefinition.definitions}
          onClose={() => setActiveDefinition(null)}
        />
      )}

      {removePolicyTarget && (
        <ConfirmDialog
          title="Remove Policy from Bundle"
          message={`Remove policy "${removePolicyTarget}" from bundle "${bundle?.name}"? Roles assigned to this bundle will no longer have access to this policy.`}
          confirmLabel={removingPolicy ? "Removing…" : "Remove"}
          confirmDisabled={removingPolicy}
          onConfirm={handleRemovePolicyConfirmed}
          onCancel={() => setRemovePolicyTarget(null)}
        />
      )}

      {removeRoleTarget && (
        <ConfirmDialog
          title="Unassign Role"
          message={`Remove role "${removeRoleTarget}" from bundle "${bundle?.name}"? Role members will no longer inherit policies from this bundle.`}
          confirmLabel={removingRole ? "Unassigning…" : "Unassign Role"}
          confirmDisabled={removingRole}
          onConfirm={handleRemoveRoleConfirmed}
          onCancel={() => setRemoveRoleTarget(null)}
        />
      )}

      {showDeleteBundleConfirm && (
        <ConfirmDialog
          title="Delete Policy Bundle"
          message={`Are you sure you want to permanently delete bundle "${bundle?.name}"? All role assignments and policy associations for this bundle will be removed.`}
          confirmLabel={deletingBundle ? "Deleting…" : "Delete Permanently"}
          confirmDisabled={deletingBundle}
          onConfirm={handleDeleteBundleConfirmed}
          onCancel={() => setShowDeleteBundleConfirm(false)}
        />
      )}
    </>
  );
}

