"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import PolicyDefinitionsModal, {
  PolicyDefinition,
} from "@/component/admin/PolicyDefinitionsModal";

const ADMIN_API = "http://localhost:5000/api/admin";

interface RoleSummary {
  role: string;
  permissionCount: number;
}

interface PolicySummary {
  permission: string;
  ptype: "p" | "p2";
  definitions: PolicyDefinition[];
}

type Tab = "roles" | "policies";
type PtypeFilter = "all" | "p" | "p2";

export default function AdminConsolePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("roles");

  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [policies, setPolicies] = useState<PolicySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [roleSearch, setRoleSearch] = useState("");
  const [policySearch, setPolicySearch] = useState("");
  const [policyPtypeFilter, setPolicyPtypeFilter] =
    useState<PtypeFilter>("all");

  const [activePolicy, setActivePolicy] = useState<PolicySummary | null>(
    null
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [rolesRes, policiesRes] = await Promise.all([
        axios.get<RoleSummary[]>(`${ADMIN_API}/roles`),
        axios.get<PolicySummary[]>(`${ADMIN_API}/policies`),
      ]);
      setRoles(rolesRes.data);
      setPolicies(policiesRes.data);
    } catch (err) {
      console.error("Admin console load error:", err);
      setError("Unable to load admin console data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRoles = useMemo(
    () =>
      roles.filter((r) =>
        r.role.toLowerCase().includes(roleSearch.toLowerCase())
      ),
    [roles, roleSearch]
  );

  const filteredPolicies = useMemo(
    () =>
      policies
        .filter(
          (p) => policyPtypeFilter === "all" || p.ptype === policyPtypeFilter
        )
        .filter((p) =>
          p.permission.toLowerCase().includes(policySearch.toLowerCase())
        ),
    [policies, policySearch, policyPtypeFilter]
  );

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
        <div className="mx-auto max-w-6xl px-6 py-10">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
                Admin
              </p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                Admin Console
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage user roles, policies and permissions. No
                authentication required.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/admin/enforcer-checker"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
              >
                Enforcer Checker
              </Link>
              <Link
                href="/"
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
              >
                ← Home
              </Link>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-xl bg-slate-200/60 p-1">
            <button
              onClick={() => setTab("roles")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === "roles"
                  ? "bg-slate-900 text-white shadow"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              User Roles
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                  tab === "roles" ? "bg-white/20" : "bg-slate-300/70"
                }`}
              >
                {roles.length}
              </span>
            </button>
            <button
              onClick={() => setTab("policies")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === "policies"
                  ? "bg-slate-900 text-white shadow"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Policies
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                  tab === "policies" ? "bg-white/20" : "bg-slate-300/70"
                }`}
              >
                {policies.length}
              </span>
            </button>
          </div>

          {/* User Roles tab */}
          {tab === "roles" && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    User Roles
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    List of user roles available in the application.
                  </p>
                </div>
                <input
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  placeholder="Search by role name..."
                  className="w-64 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              {loading ? (
                <p className="px-6 py-12 text-center text-sm text-slate-400">
                  Loading roles…
                </p>
              ) : filteredRoles.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-slate-400">
                  No roles found.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {["Role", "Permissions", "Actions"].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRoles.map((r) => (
                      <tr key={r.role} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-800">
                          {r.role}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                            {r.permissionCount} permission
                            {r.permissionCount !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() =>
                              router.push(
                                `/admin/roles/${encodeURIComponent(r.role)}`
                              )
                            }
                            className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-amber-500/20 transition hover:bg-amber-400"
                          >
                            View Permissions
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}

          {/* Policies tab */}
          {tab === "policies" && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
                <div>
                  <h2 className="font-semibold text-slate-900">Policies</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    List of policies (P) and menus (P2) available in the
                    application.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                    {(["all", "p", "p2"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setPolicyPtypeFilter(t)}
                        className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                          policyPtypeFilter === t
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
                    placeholder="Search by policy name..."
                    className="w-64 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
              </div>

              {loading ? (
                <p className="px-6 py-12 text-center text-sm text-slate-400">
                  Loading policies…
                </p>
              ) : filteredPolicies.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-slate-400">
                  No policies found.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {["Type", "Policy", "Definitions", "Actions"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPolicies.map((p) => (
                      <tr
                        key={`${p.ptype}:${p.permission}`}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              p.ptype === "p2"
                                ? "bg-sky-50 text-sky-700"
                                : "bg-violet-50 text-violet-700"
                            }`}
                          >
                            {p.ptype.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-[320px] truncate font-mono text-xs text-slate-700">
                          {p.permission}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            {p.definitions.length} definition
                            {p.definitions.length !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setActivePolicy(p)}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-violet-400 hover:text-violet-700"
                          >
                            View Access
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}
        </div>
      </div>

      {activePolicy && (
        <PolicyDefinitionsModal
          title={activePolicy.permission}
          definitions={activePolicy.definitions}
          onClose={() => setActivePolicy(null)}
        />
      )}
    </>
  );
}
