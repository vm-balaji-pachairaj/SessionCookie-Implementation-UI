"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import PolicyDefinitionsModal, {
  PolicyDefinition,
} from "./PolicyDefinitionsModal";
import AddPolicyModal from "./AddPolicyModal";
import ConfirmDialog from "./ConfirmDialog";

const ADMIN_API = "http://localhost:5000/api/admin";

interface RolePermission {
  ptype: "p" | "p2" | "p3";
  permission: string;
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

interface RolePermissionsPanelProps {
  role: string;
  onPolicyChanged?: () => void;
}

/** One-line summary of a role permission row, tailored to its ptype. */
function describePermission(perm: RolePermission): string {
  if (perm.ptype === "p2") {
    return (
      [perm.parent, perm.displayName].filter(Boolean).join(" / ") +
      (perm.route ? ` · ${perm.route}` : "")
    );
  }
  if (perm.ptype === "p3") {
    return (
      [perm.page, perm.module, perm.section, perm.field].filter(Boolean).join(" / ") +
      (perm.access ? ` · ${perm.access}` : "")
    );
  }
  return (
    [perm.page, perm.module, perm.section].filter(Boolean).join(" / ") +
    (perm.access ? ` · ${perm.access}` : "")
  );
}

/**
 * Full permission management surface for a role: list, add, remove and
 * view policy definitions. Rendered inline on the role's page (not a modal).
 * Shows both 'p' (permissions) and 'p2' (menu) policies assigned to the role.
 */
export default function RolePermissionsPanel({
  role,
  onPolicyChanged,
}: RolePermissionsPanelProps) {
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ptypeFilter, setPtypeFilter] = useState<"all" | "p" | "p2" | "p3">("all");

  const [viewDefinitionsFor, setViewDefinitionsFor] = useState<{
    permission: string;
    definitions: PolicyDefinition[];
  } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [showAddPolicy, setShowAddPolicy] = useState(false);

  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get<RolePermission[]>(
        `${ADMIN_API}/roles/${encodeURIComponent(role)}/permissions`
      );
      setPermissions(res.data);
    } catch (err) {
      console.error("Load role permissions error:", err);
      setError("Unable to load permissions for this role.");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const filteredPermissions = useMemo(
    () =>
      permissions.filter(
        (p) => ptypeFilter === "all" || p.ptype === ptypeFilter
      ),
    [permissions, ptypeFilter]
  );

  const handleViewDefinition = async (perm: RolePermission) => {
    try {
      const res = await axios.get<PolicyDefinition[]>(
        `${ADMIN_API}/policies/${encodeURIComponent(perm.permission)}/definitions`,
        { params: { ptype: perm.ptype } }
      );
      setViewDefinitionsFor({ permission: perm.permission, definitions: res.data });
    } catch (err) {
      console.error("Load policy definitions error:", err);
    }
  };

  const handleRemoveConfirmed = async () => {
    if (!removeTarget) return;
    try {
      setRemoving(true);
      await axios.delete(
        `${ADMIN_API}/roles/${encodeURIComponent(
          role
        )}/policies/${encodeURIComponent(removeTarget)}`
      );
      setRemoveTarget(null);
      await loadPermissions();
      onPolicyChanged?.();
    } catch (err) {
      console.error("Remove policy error:", err);
      setError("Unable to remove policy.");
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
              Assigned Permissions
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {permissions.length} polic
              {permissions.length !== 1 ? "ies" : "y"} assigned (P, P2 &amp; P3)
            </p>
          </div>
          <div className="flex items-center gap-3">
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
            <button
              onClick={() => setShowAddPolicy(true)}
              className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-violet-500/20 transition hover:bg-violet-500"
            >
              + Add Policy
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          {error && (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Loading permissions…
            </p>
          ) : filteredPermissions.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No permissions found.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  {["#", "Type", "Permission", "Details", "Actions"].map(
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
                {filteredPermissions.map((perm, idx) => (
                  <tr
                    key={`${perm.ptype}:${perm.permission}`}
                    className="hover:bg-slate-50"
                  >
                    <td className="py-3 pr-4 text-xs text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          perm.ptype === "p2"
                            ? "bg-sky-50 text-sky-700"
                            : perm.ptype === "p3"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-violet-50 text-violet-700"
                        }`}
                      >
                        {perm.ptype.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 pr-4 max-w-[200px] truncate font-mono text-xs text-slate-700">
                      {perm.permission}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {describePermission(perm)}
                    </td>
                    <td className="py-3 pr-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDefinition(perm)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-violet-400 hover:text-violet-700"
                        >
                          View Definition
                        </button>
                        <button
                          onClick={() => setRemoveTarget(perm.permission)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          Remove Policy
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {viewDefinitionsFor && (
        <PolicyDefinitionsModal
          title={viewDefinitionsFor.permission}
          definitions={viewDefinitionsFor.definitions}
          onClose={() => setViewDefinitionsFor(null)}
        />
      )}

      {showAddPolicy && (
        <AddPolicyModal
          role={role}
          onClose={() => setShowAddPolicy(false)}
          onAdded={async () => {
            setShowAddPolicy(false);
            await loadPermissions();
            onPolicyChanged?.();
          }}
        />
      )}

      {removeTarget && (
        <ConfirmDialog
          title="Remove Policy"
          message={`Remove policy "${removeTarget}" from role "${role}"? This cannot be undone.`}
          confirmLabel={removing ? "Removing…" : "Remove"}
          confirmDisabled={removing}
          onConfirm={handleRemoveConfirmed}
          onCancel={() => setRemoveTarget(null)}
        />
      )}
    </>
  );
}
