"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";

const ADMIN_API = "http://localhost:5000/api/admin";

type Ptype = "p" | "p2" | "p3";

interface RoleSummary {
  role: string;
  permissionCount: number;
}

interface PolicyDefinition {
  ptype: Ptype;
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
  ptype: Ptype;
  definitions: PolicyDefinition[];
}

interface PermissionEntry {
  key: string;
  ptype: Ptype;
  permission: string;
  lob: string;
  page: string;
  module: string;
  section: string;
  access: string;
  field: string;
  parent: string;
  displayName: string;
  route: string;
}

interface CheckResult {
  allowed: boolean;
  ptype: Ptype;
  role: string;
  lob?: string;
  page?: string;
  module?: string;
  section?: string;
  field?: string;
  access?: string;
  key?: string;
}

function flattenPolicies(policies: PolicySummary[]): PermissionEntry[] {
  const entries: PermissionEntry[] = [];

  policies.forEach((policy) => {
    policy.definitions.forEach((def, idx) => {
      entries.push({
        key: `${policy.ptype}:${policy.permission}#${idx}`,
        ptype: policy.ptype,
        permission: policy.permission,
        lob: def.lob ?? "",
        page: def.page ?? "",
        module: def.module ?? "",
        section: def.section ?? "",
        access: def.access ?? "",
        field: def.field ?? "",
        parent: def.parent ?? "",
        displayName: def.displayName ?? "",
        route: def.route ?? "",
      });
    });
  });

  return entries;
}

export default function EnforcerCheckerPage() {
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [permissionEntries, setPermissionEntries] = useState<
    PermissionEntry[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [roleSearch, setRoleSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [ptypeFilter, setPtypeFilter] = useState<Ptype>("p");

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<PermissionEntry | null>(
    null
  );

  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [checkError, setCheckError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [rolesRes, policiesRes] = await Promise.all([
        axios.get<RoleSummary[]>(`${ADMIN_API}/roles`),
        axios.get<PolicySummary[]>(`${ADMIN_API}/policies`),
      ]);
      setRoles(rolesRes.data);
      setPermissionEntries(flattenPolicies(policiesRes.data));
    } catch (err) {
      console.error("Enforcer checker load error:", err);
      setError("Unable to load roles and permissions.");
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

  const filteredEntries = useMemo(
    () =>
      permissionEntries
        .filter((e) => e.ptype === ptypeFilter)
        .filter((e) =>
          e.permission.toLowerCase().includes(permissionSearch.toLowerCase())
        ),
    [permissionEntries, permissionSearch, ptypeFilter]
  );

  // Switching P/P2 tabs invalidates a selection made under the other type.
  const handlePtypeFilterChange = (t: Ptype) => {
    setPtypeFilter(t);
    setSelectedEntry(null);
    setResult(null);
  };

  const handleCheck = async () => {
    if (!selectedRole || !selectedEntry) return;
    try {
      setChecking(true);
      setCheckError("");
      setResult(null);

      const body =
        selectedEntry.ptype === "p2"
          ? {
              ptype: "p2" as const,
              role: selectedRole,
              key: selectedEntry.permission,
            }
          : selectedEntry.ptype === "p3"
            ? {
                ptype: "p3" as const,
                role: selectedRole,
                lob: selectedEntry.lob,
                page: selectedEntry.page,
                module: selectedEntry.module,
                section: selectedEntry.section,
                field: selectedEntry.field,
                access: selectedEntry.access,
              }
            : {
              ptype: "p" as const,
              role: selectedRole,
              lob: selectedEntry.lob,
              page: selectedEntry.page,
              module: selectedEntry.module,
              section: selectedEntry.section,
              access: selectedEntry.access,
            };

      const res = await axios.post<CheckResult>(
        `${ADMIN_API}/enforcer/check`,
        body
      );
      setResult(res.data);
    } catch (err) {
      console.error("Enforcer check error:", err);
      setCheckError("Unable to run the enforcer check.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
              Admin
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Enforcer Checker
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Pick a role and a policy (P permission or P2 menu), then check
              whether the Casbin enforcer allows it.
            </p>
          </div>
          <Link
            href="/admin"
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
          >
            ← Admin Console
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Ptype tabs */}
        <div className="mb-6 inline-flex items-center gap-1 rounded-xl bg-slate-200/60 p-1">
          {(["p", "p2", "p3"] as const).map((t) => (
            <button
              key={t}
              onClick={() => handlePtypeFilterChange(t)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                ptypeFilter === t
                  ? "bg-slate-900 text-white shadow"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t === "p"
                ? "P (Permissions)"
                : t === "p2"
                  ? "P2 (Menus)"
                  : "P3 (Fields)"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Step 1: role */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="flex items-center font-semibold text-slate-900">
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs text-white">
                  1
                </span>
                Select User Role
              </h2>
              <input
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                placeholder="Search roles..."
                className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <div className="max-h-96 overflow-y-auto px-4 py-3">
              {loading ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  Loading roles…
                </p>
              ) : filteredRoles.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No roles found.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {filteredRoles.map((r) => (
                    <li key={r.role}>
                      <button
                        onClick={() => setSelectedRole(r.role)}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition ${
                          selectedRole === r.role
                            ? "border-violet-400 bg-violet-50 text-violet-700"
                            : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">{r.role}</span>
                        {selectedRole === r.role && (
                          <span className="ml-2 shrink-0">✓</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Step 2: permission / menu */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="flex items-center font-semibold text-slate-900">
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs text-white">
                  2
                </span>
                Select {ptypeFilter === "p2" ? "Menu" : "Permission"}
              </h2>
              <input
                value={permissionSearch}
                onChange={(e) => setPermissionSearch(e.target.value)}
                placeholder={
                  ptypeFilter === "p2"
                    ? "Search menus..."
                    : "Search permissions..."
                }
                className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <div className="max-h-96 overflow-y-auto px-4 py-3">
              {loading ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  Loading {ptypeFilter === "p2" ? "menus" : "permissions"}…
                </p>
              ) : filteredEntries.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No {ptypeFilter === "p2" ? "menus" : "permissions"} found.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {filteredEntries.map((entry) => (
                    <li key={entry.key}>
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className={`flex w-full items-start justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
                          selectedEntry?.key === entry.key
                            ? "border-violet-400 bg-violet-50"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="min-w-0">
                          <span
                            className={`block truncate font-mono text-xs ${
                              selectedEntry?.key === entry.key
                                ? "text-violet-700"
                                : "text-slate-700"
                            }`}
                          >
                            {entry.permission}
                          </span>
                          <span className="mt-1 block truncate text-[11px] text-slate-400">
                            {entry.ptype === "p2"
                              ? [entry.lob, entry.parent, entry.displayName]
                                  .filter(Boolean)
                                  .join(" / ")
                              : entry.ptype === "p3"
                                ? [
                                    entry.lob,
                                    entry.page,
                                    entry.module,
                                    entry.section,
                                    entry.field,
                                  ]
                                    .filter(Boolean)
                                    .join(" / ") +
                                  (entry.access ? ` · ${entry.access}` : "")
                                : [
                                  entry.lob,
                                  entry.page,
                                  entry.module,
                                  entry.section,
                                ]
                                  .filter(Boolean)
                                  .join(" / ") +
                                (entry.access ? ` · ${entry.access}` : "")}
                          </span>
                        </div>
                        {selectedEntry?.key === entry.key && (
                          <span className="mt-0.5 shrink-0 text-violet-600">
                            ✓
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        {/* Step 3: check */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">
              <p>
                Role:{" "}
                <span className="font-semibold text-slate-900">
                  {selectedRole ?? "—"}
                </span>
              </p>
              <p className="mt-1">
                {ptypeFilter === "p2" ? "Menu" : "Permission"}:{" "}
                <span className="font-mono text-xs font-semibold text-slate-900">
                  {selectedEntry?.permission ?? "—"}
                </span>
              </p>
            </div>
            <button
              onClick={handleCheck}
              disabled={!selectedRole || !selectedEntry || checking}
              className="shrink-0 rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checking ? "Checking…" : "Check Access"}
            </button>
          </div>

          {checkError && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {checkError}
            </div>
          )}

          {result && (
            <div
              className={`mt-6 rounded-2xl border p-6 ${
                result.allowed
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {result.allowed ? "✅" : "⛔"}
                </span>
                <div>
                  <p
                    className={`text-lg font-bold ${
                      result.allowed ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {result.allowed ? "Allowed" : "Denied"}
                  </p>
                  <p className="text-sm text-slate-600">
                    {result.ptype === "p2" ? (
                      <>
                        enforceP2(&ldquo;{result.role}&rdquo;, &ldquo;
                        {result.key}&rdquo;)
                      </>
                    ) : result.ptype === "p3" ? (
                      <>
                        enforceField(&ldquo;{result.role}&rdquo;, &ldquo;
                        {result.lob}&rdquo;, &ldquo;{result.page}&rdquo;,
                        &ldquo;{result.module}&rdquo;, &ldquo;{result.section}
                        &rdquo;, &ldquo;{result.field}&rdquo;, &ldquo;
                        {result.access}&rdquo;)
                      </>
                    ) : (
                      <>
                        enforce(&ldquo;{result.role}&rdquo;, &ldquo;
                        {result.lob}&rdquo;, &ldquo;{result.page}&rdquo;,
                        &ldquo;{result.module}&rdquo;, &ldquo;{result.section}
                        &rdquo;, &ldquo;{result.access}&rdquo;)
                      </>
                    )}
                  </p>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-slate-400">Role</dt>
                  <dd className="font-medium text-slate-800">
                    {result.role}
                  </dd>
                </div>
                {result.ptype === "p2" ? (
                  <div>
                    <dt className="text-xs text-slate-400">Menu Key</dt>
                    <dd className="font-medium text-slate-800">
                      {result.key || "—"}
                    </dd>
                  </div>
                ) : (
                  <>
                    <div>
                      <dt className="text-xs text-slate-400">LOB</dt>
                      <dd className="font-medium text-slate-800 uppercase">
                        {result.lob || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-400">Page</dt>
                      <dd className="font-medium text-slate-800">
                        {result.page || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-400">Module</dt>
                      <dd className="font-medium text-slate-800">
                        {result.module || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-400">Section</dt>
                      <dd className="font-medium text-slate-800">
                        {result.section || "—"}
                      </dd>
                    </div>
                    {result.ptype === "p3" && (
                      <div>
                        <dt className="text-xs text-slate-400">Field</dt>
                        <dd className="font-medium text-slate-800">
                          {result.field || "—"}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-xs text-slate-400">Access</dt>
                      <dd className="font-medium text-slate-800">
                        {result.access || "—"}
                      </dd>
                    </div>
                  </>
                )}
              </dl>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

