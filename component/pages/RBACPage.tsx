"use client";

import { useEffect, useMemo, useState } from "react";

type PermissionItem = {
  permission: string;
  lob: string;
  page: string;
  module: string;
  section: string;
  access: string;
  assigned?: boolean;
};

type RoleItem = {
  role?: string;
  role_name?: string;
  role_id?: string | number;
  permissions?: {
    menus?: unknown[];
    pages?: PermissionItem[];
    defaultMenu?: string;
  };
};

export default function RBACPage({ currentRoleId }: { currentRoleId?: string | null }) {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const [selectedRoleKey, setSelectedRoleKey] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [permError, setPermError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRoles() {
      setLoadingRoles(true);
      setRolesError(null);

      try {
        const res = await fetch("http://localhost:5000/api/rbac/roles");

        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

        const data = await res.json();

        const list = Array.isArray(data?.roles) ? data.roles : [];
        setRoles(list);

        if (list.length > 0) {
          const initialRole = list.find((role: RoleItem) => roleMatches(role, currentRoleId)) ?? list[0];
          setSelectedRoleKey(currentRoleId ?? roleKey(initialRole));
          loadPermissionsForRoleIndex(
            currentRoleId ? -1 : list.indexOf(initialRole),
            currentRoleId ? { role: currentRoleId, role_id: currentRoleId } : initialRole,
          );
        }
    } catch (err: unknown) {
      setRolesError(err instanceof Error ? err.message : "Failed to load roles");
      } finally {
        setLoadingRoles(false);
      }
    }

    loadRoles();
    // The page remounts after a dashboard role switch, so this loads once per view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPermissionsForRoleIndex(idx: number, roleParam?: RoleItem) {
    const role = roleParam ?? roles[idx];
    if (!role) return;

    // Always fetch the selected role; permissions may differ from the initial list response.
    setLoadingPermissions(true);
    setPermError(null);
    setPermissions([]);

    try {
      // Determine an identifier — prefer `role`, then `role_name`, then `role_id`.
      const identifier =
        role.role ?? role.role_name ?? (role.role_id !== undefined ? String(role.role_id) : null);

      if (!identifier) {
        setPermError("No valid role identifier to fetch permissions");
        setLoadingPermissions(false);
        return;
      }

      const res = await fetch(
        `http://localhost:5000/api/rbac/roles/${encodeURIComponent(identifier)}/permissions`
      );

      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

      const data = await res.json();
      const returnedRoles: RoleItem[] = Array.isArray(data?.roles) ? data.roles : [];
      const returnedRole = returnedRoles.find((item) => roleMatches(item, roleKey(role)));
      const selectedResponseRole = returnedRole ?? returnedRoles[0];
      const pages = Array.isArray(selectedResponseRole?.permissions?.pages)
        ? selectedResponseRole.permissions.pages
        : Array.isArray(data?.permissions?.pages)
          ? data.permissions.pages
          : Array.isArray(data?.pages)
            ? data.pages
            : [];

      if (returnedRoles.length > 0) {
        setRoles(returnedRoles);
      }

      if (selectedResponseRole) {
        setSelectedRoleKey(roleKey(selectedResponseRole));
      }

      setPermissions(pages);
    } catch (err: unknown) {
      setPermError(err instanceof Error ? err.message : "Failed to load permissions");
    } finally {
      setLoadingPermissions(false);
    }
  }

  function handleRoleClick(idx: number) {
    const role = roles[idx];
    if (!role) return;
    setSelectedRoleKey(roleKey(role));
    loadPermissionsForRoleIndex(idx, role);
  }

  const selectedIndex = selectedRoleKey
    ? roles.findIndex((role) => roleMatches(role, selectedRoleKey))
    : -1;

  return (
    <>
    <RolesWorkspace
      key={selectedRoleKey ?? "no-selected-role"}
      roles={roles}
      currentRoleId={currentRoleId}
      selectedIndex={selectedIndex >= 0 ? selectedIndex : null}
      permissions={permissions}
      loadingPermissions={loadingPermissions}
      permissionError={permError}
      loadingRoles={loadingRoles}
      rolesError={rolesError}
      onRoleClick={handleRoleClick}
    />
    {false && (<div className="p-6">
      <h1 className="mb-4 text-xl font-semibold">RBAC - Roles</h1>

      <div className="flex gap-6">
        <div className="w-72 shrink-0 rounded-lg border border-slate-200 bg-white">
          <div className="border-b px-4 py-2 font-medium text-slate-600">Roles</div>

          <div className="max-h-96 overflow-auto p-2">
            {loadingRoles && (
              <div className="p-4 text-sm text-slate-500">Loading roles…</div>
            )}

            {rolesError && (
              <div className="p-4 text-sm text-red-600">{rolesError}</div>
            )}

            {!loadingRoles && !rolesError && roles.length === 0 && (
              <div className="p-4 text-sm text-slate-500">No roles found</div>
            )}

            <ul>
              {roles.map((r, i) => (
                <li key={r.role + "-" + i} className="p-1">
                  <button
                    onClick={() => handleRoleClick(i)}
                    className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                      selectedIndex === i ? "bg-violet-50" : ""
                    }`}
                  >
                    <span className="truncate">{r.role}</span>

                    {selectedIndex === i && (
                      <span className="text-xs text-violet-600">✓</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex-1 rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-700">Permissions</h2>
            {loadingPermissions && (
              <div className="text-xs text-slate-500">Loading…</div>
            )}
          </div>

          {permError && (
            <div className="text-sm text-red-600">{permError}</div>
          )}

          {!roles.length && (
            <div className="text-sm text-slate-500">No roles available</div>
          )}

          {roles.length > 0 && (
            <div className="overflow-auto">
              <table className="w-full table-auto text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-xs text-slate-500">
                    <th className="px-3 py-2">Page</th>
                    <th className="px-3 py-2">Module</th>
                    <th className="px-3 py-2">Section</th>
                    <th className="px-3 py-2">Access</th>
                    <th className="px-3 py-2">Assigned</th>
                  </tr>
                </thead>

                <tbody>
                  {permissions.length === 0 && !loadingPermissions ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-sm text-slate-500">
                        {selectedIndex === null
                          ? "Select a role to view permissions"
                          : "No permissions returned for this role"}
                      </td>
                    </tr>
                  ) : (
                    permissions.map((p, idx) => (
                      <tr key={p.permission + "-" + idx} className="border-b">
                        <td className="px-3 py-2 align-top">{p.page}</td>
                        <td className="px-3 py-2 align-top">{p.module}</td>
                        <td className="px-3 py-2 align-top">{p.section}</td>
                        <td className="px-3 py-2 align-top">{p.access}</td>
                        <td className="px-3 py-2 align-top">{p.assigned ? "Yes" : "No"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>)}
    </>
  );
}

type RolesAccordionProps = {
  roles: RoleItem[];
  currentRoleId?: string | null;
  selectedIndex: number | null;
  permissions: PermissionItem[];
  loadingPermissions: boolean;
  permissionError: string | null;
  onRoleClick: (index: number) => void;
};

function roleKey(role: RoleItem) {
  return String(role.role_id ?? role.role ?? role.role_name ?? "");
}

function roleMatches(role: RoleItem, identifier: string | null | undefined) {
  if (!identifier) return false;
  return [role.role_id, role.role, role.role_name].some(
    (value) => String(value ?? "") === identifier,
  );
}

// Retained while the prior layout is being removed from the untracked RBAC page.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function RolesAccordion({
  roles,
  currentRoleId,
  selectedIndex,
  permissions,
  loadingPermissions,
  permissionError,
  onRoleClick,
}: RolesAccordionProps) {
  const orderedRoles = useMemo(
    () =>
      roles
        .map((role, index) => ({ role, index }))
        .sort(({ role: first }, { role: second }) => {
          const firstCurrent = String(first.role_id) === currentRoleId || (first as RoleItem & { is_current?: boolean }).is_current;
          const secondCurrent = String(second.role_id) === currentRoleId || (second as RoleItem & { is_current?: boolean }).is_current;
          return Number(secondCurrent) - Number(firstCurrent);
        }),
    [currentRoleId, roles],
  );

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">Access control</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Roles and permissions</h1>
        <p className="mt-1 text-sm text-slate-500">Open a role to review its permissions.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {orderedRoles.length === 0 && <p className="p-5 text-sm text-slate-500">No roles found.</p>}
        {orderedRoles.map(({ role, index }) => {
          const isExpanded = selectedIndex === index;
          const isCurrent = String(role.role_id) === currentRoleId || (role as RoleItem & { is_current?: boolean }).is_current;
          const name = role.role ?? role.role_name ?? "Unnamed role";

          return (
            <div key={`${role.role_id ?? name}-${index}`} className="border-b border-slate-200 last:border-b-0">
              <button
                type="button"
                onClick={() => onRoleClick(index)}
                aria-expanded={isExpanded}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-600"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sm font-semibold ${isExpanded ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600"}`}>
                    {name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-slate-800">{name}</span>
                    {isCurrent && <span className="mt-0.5 block text-xs font-medium text-violet-600">Current role</span>}
                  </span>
                </span>
                <span className="shrink-0 text-lg text-slate-500" aria-hidden="true">{isExpanded ? "-" : "+"}</span>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
                  {loadingPermissions && <p className="text-sm text-slate-500">Loading permissions...</p>}
                  {permissionError && <p className="text-sm text-red-600">{permissionError}</p>}
                  {!loadingPermissions && !permissionError && permissions.length === 0 && <p className="text-sm text-slate-500">No permissions returned for this role.</p>}
                  {!loadingPermissions && !permissionError && permissions.length > 0 && (
                    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
                      <table className="min-w-[680px] w-full text-sm">
                        <thead className="border-b border-slate-200 bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <tr><th className="px-4 py-3">Page</th><th className="px-4 py-3">Module</th><th className="px-4 py-3">Section</th><th className="px-4 py-3">Access</th><th className="px-4 py-3">Assigned</th></tr>
                        </thead>
                        <tbody>
                          {permissions.map((permission, permissionIndex) => (
                            <tr key={`${permission.permission}-${permissionIndex}`} className="border-b border-slate-100 last:border-b-0">
                              <td className="px-4 py-3 text-slate-800">{permission.page}</td><td className="px-4 py-3 text-slate-600">{permission.module}</td><td className="px-4 py-3 text-slate-600">{permission.section}</td><td className="px-4 py-3 text-slate-600">{permission.access}</td>
                              <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${permission.assigned ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{permission.assigned ? "Assigned" : "Not assigned"}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

type RolesWorkspaceProps = RolesAccordionProps & {
  loadingRoles: boolean;
  rolesError: string | null;
};

function RolesWorkspace({
  roles,
  currentRoleId,
  selectedIndex,
  permissions,
  loadingPermissions,
  permissionError,
  loadingRoles,
  rolesError,
  onRoleClick,
}: RolesWorkspaceProps) {
  const selectedRole = selectedIndex === null ? undefined : roles[selectedIndex];

  const orderedRoles = useMemo(
    () =>
      roles
        .map((role, index) => ({ role, index }))
        .sort(({ role: first }, { role: second }) => {
          const firstCurrent = String(first.role_id) === currentRoleId;
          const secondCurrent = String(second.role_id) === currentRoleId;
          return Number(secondCurrent) - Number(firstCurrent);
        }),
    [currentRoleId, roles],
  );

  const permissionRoles = selectedRole
    ? [{ role: selectedRole, index: selectedIndex as number }]
    : [];

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">Access control</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Roles and permissions</h1>
        <p className="mt-1 text-sm text-slate-500">Select a role to view its permissions.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="h-fit overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="font-semibold text-slate-800">Roles</h2>
            <p className="mt-0.5 text-xs text-slate-500">Choose a role to review access.</p>
          </div>
          <div className="max-h-[36rem] overflow-y-auto p-2">
            {loadingRoles && <p className="p-3 text-sm text-slate-500">Loading roles...</p>}
            {rolesError && <p className="p-3 text-sm text-red-600">{rolesError}</p>}
            {!loadingRoles && !rolesError && orderedRoles.length === 0 && <p className="p-3 text-sm text-slate-500">No roles found.</p>}
            {orderedRoles.map(({ role, index }) => {
              const name = role.role ?? role.role_name ?? "Unnamed role";
              const isSelected = index === selectedIndex;
              const isCurrent = String(role.role_id) === currentRoleId;
              return (
                <button
                  key={`${role.role_id ?? name}-${index}`}
                  type="button"
                  onClick={() => onRoleClick(index)}
                  className={`mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition ${isSelected ? "bg-violet-50 text-violet-800" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${isSelected ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"}`}>{name.charAt(0).toUpperCase()}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{name}</span>
                    {isCurrent && <span className="block text-xs text-violet-600">Current role</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="font-semibold text-slate-800">Role permissions</h2>
            <p className="mt-0.5 text-xs text-slate-500">Permissions returned for the selected role.</p>
          </div>

          {permissionRoles.map(({ role, index }) => {
            const name = role.role ?? role.role_name ?? "Unnamed role";
            const key = `${role.role_id ?? name}-${index}`;
            const isSelected = index === selectedIndex;
            const rolePermissions = isSelected ? permissions : role.permissions?.pages ?? [];
            const showLoading = isSelected && loadingPermissions;
            const showError = isSelected && permissionError;

            return (
              <div key={key} className="border-b border-slate-200 last:border-b-0">
                <div className="px-5 py-4">
                  <span>
                    <span className="block font-semibold text-slate-800">{name}</span>
                    {isSelected && <span className="mt-0.5 block text-xs font-medium text-violet-600">Selected role</span>}
                  </span>
                </div>

                <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
                  {showLoading && <p className="text-sm text-slate-500">Loading permissions...</p>}
                  {showError && <p className="text-sm text-red-600">{permissionError}</p>}
                  {!showLoading && !showError && rolePermissions.length === 0 && <p className="text-sm text-slate-500">No permissions returned for this role.</p>}
                  {!showLoading && !showError && rolePermissions.length > 0 && <PermissionTable permissions={rolePermissions} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PermissionTable({ permissions }: { permissions: PermissionItem[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
      <table className="min-w-[680px] w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Page</th>
            <th className="px-4 py-3">Module</th>
            <th className="px-4 py-3">Section</th>
            <th className="px-4 py-3">Access</th>
            <th className="px-4 py-3">Assigned</th>
          </tr>
        </thead>
        <tbody>
          {permissions.map((permission, index) => (
            <tr key={`${permission.permission}-${index}`} className="border-b border-slate-100 last:border-b-0">
              <td className="px-4 py-3 text-slate-800">{permission.page}</td>
              <td className="px-4 py-3 text-slate-600">{permission.module}</td>
              <td className="px-4 py-3 text-slate-600">{permission.section}</td>
              <td className="px-4 py-3 text-slate-600">{permission.access}</td>
              <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${permission.assigned ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{permission.assigned ? "Assigned" : "Not assigned"}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
