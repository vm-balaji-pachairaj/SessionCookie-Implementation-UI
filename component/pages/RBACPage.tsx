"use client";

import { useEffect, useMemo, useState } from "react";
import TablePagination from "@/component/ui/TablePagination";
import {
  RBACHeader,
  RoleSidebar,
  PermissionsToolbar,
  PermissionsTable,
  type PermissionItem,
  type RoleItem,
  type FilterTab,
} from "@/component/rbac";

// ── Types ────────────────────────────────────────────────────────────────────

export type PermissionItem = {
  permission: string;
  lob: string;
  page: string;
  module: string;
  section: string;
  access: string;
  assigned?: boolean;
};

export type RoleItem = {
  role?: string;
  role_name?: string;
  role_id?: string | number;
  permissions?: {
    menus?: unknown[];
    pages?: PermissionItem[];
    defaultMenu?: string;
  };
};

export type StatusVariant =
  | "success"
  | "warning"
  | "neutral"
  | "info"
  | "danger"
  | "pending"
  | "assigned"
  | "inactive";

type FilterTab = "all" | "assigned" | "unassigned" | "edit" | "view";

// ── Helper Functions ─────────────────────────────────────────────────────────

function roleKey(role: RoleItem) {
function roleKey(role: RoleItem): string {
  return String(role.role_id ?? role.role ?? role.role_name ?? "");
}

function roleMatches(role: RoleItem, identifier: string | null | undefined) {
function roleMatches(role: RoleItem, identifier: string | null | undefined): boolean {
  if (!identifier) return false;
  return [role.role_id, role.role, role.role_name].some(
    (value) => String(value ?? "") === identifier,
  );
}

function getRoleIdentifier(role?: RoleItem | null): string | null {
  if (!role) return null;
  return role.role ?? role.role_name ?? (role.role_id !== undefined ? String(role.role_id) : null);
}

function isPermissionEqual(a: PermissionItem, b: PermissionItem): boolean {
  return (
    (a.access || "view").toLowerCase() === (b.access || "view").toLowerCase() &&
    Boolean(a.assigned) === Boolean(b.assigned) &&
    (a.lob || "").toLowerCase() === (b.lob || "").toLowerCase() &&
    (a.page || "").toLowerCase() === (b.page || "").toLowerCase() &&
    (a.module || "").toLowerCase() === (b.module || "").toLowerCase() &&
    (a.section || "").toLowerCase() === (b.section || "").toLowerCase()
  );
}

// ── StatusBadge Component ────────────────────────────────────────────────────
// ── RBACPage Orchestrator Component ──────────────────────────────────────────

const variantStyles: Record<StatusVariant, { bg: string; dot: string }> = {
  success: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  assigned: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  warning: {
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  pending: {
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  neutral: {
    bg: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
  inactive: {
    bg: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
  info: {
    bg: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  danger: {
    bg: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
};

export function StatusBadge({
  label,
  variant = "neutral",
  dot = true,
  className = "",
}: {
  label: string;
  variant?: StatusVariant;
  dot?: boolean;
  className?: string;
}) {
  const styles = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition ${styles.bg} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${styles.dot}`}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </span>
  );
}

// ── TablePagination Component ────────────────────────────────────────────────

export function TablePagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}: {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const pages: (number | string)[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    if (safeCurrentPage > 3) {
      pages.push("...");
    }
    const start = Math.max(2, safeCurrentPage - 1);
    const end = Math.min(totalPages - 1, safeCurrentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (safeCurrentPage < totalPages - 2) {
      pages.push("...");
    }
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3.5 border-t border-slate-100 bg-white text-xs text-slate-600">
      {/* Left side: Show entries */}
      <div className="flex items-center gap-2">
        <span>Show</span>
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(1);
          }}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-100 cursor-pointer"
        >
          {pageSizeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
          <option value={9999}>All</option>
        </select>
        <span>entries per page</span>
        <span className="text-slate-300">·</span>
        <span className="font-medium text-slate-700">{totalItems} results</span>
      </div>

      {/* Right side: Page navigation */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          type="button"
          disabled={safeCurrentPage <= 1}
          onClick={() => onPageChange(safeCurrentPage - 1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          ‹
        </button>

        {/* Page buttons */}
        {pages.map((p, idx) => {
          if (typeof p === "string") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="flex h-7 w-7 items-center justify-center text-slate-400"
              >
                ...
              </span>
            );
          }
          const isActive = p === safeCurrentPage;
          return (
            <button
              key={`page-${p}`}
              type="button"
              onClick={() => onPageChange(p)}
              className={`flex h-7 min-w-[1.75rem] px-1.5 items-center justify-center rounded-lg text-xs font-semibold transition ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          );
        })}

        {/* Next */}
        <button
          type="button"
          disabled={safeCurrentPage >= totalPages}
          onClick={() => onPageChange(safeCurrentPage + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  );
}

// ── Main RBAC Page Component ─────────────────────────────────────────────────

export default function RBACPage({ currentRoleId }: { currentRoleId?: string | null }) {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const [selectedRoleKey, setSelectedRoleKey] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [initialPermissions, setInitialPermissions] = useState<PermissionItem[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [permError, setPermError] = useState<string | null>(null);

  const [updatingPermissions, setUpdatingPermissions] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [roleSearch, setRoleSearch] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    async function loadRoles() {
      setLoadingRoles(true);
      setRolesError(null);

      try {
        const res = await fetch("http://localhost:5000/api/rbac/roles", {
          credentials: "include",
        });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPermissionsForRoleIndex(idx: number, roleParam?: RoleItem) {
    const role = roleParam ?? roles[idx];
    if (!role) return;

    setLoadingPermissions(true);
    setPermError(null);
    setUpdateError(null);
    setUpdateSuccess(null);
    setPermissions([]);
    setInitialPermissions([]);
    setCurrentPage(1);

    try {
      const identifier = getRoleIdentifier(role);

      if (!identifier) {
        setPermError("No valid role identifier to fetch permissions");
        setLoadingPermissions(false);
        return;
      }

      const res = await fetch(
        `http://localhost:5000/api/rbac/roles/${encodeURIComponent(identifier)}/permissions`,
        {
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

      const data = await res.json();
      const returnedRoles: RoleItem[] = Array.isArray(data?.roles) ? data.roles : [];
      const returnedRole = returnedRoles.find((item) => roleMatches(item, roleKey(role)));
      const selectedResponseRole = returnedRole ?? returnedRoles[0];
      const rawPages = Array.isArray(selectedResponseRole?.permissions?.pages)
        ? selectedResponseRole.permissions.pages
        : Array.isArray(data?.permissions?.pages)
          ? data.permissions.pages
          : Array.isArray(data?.permissions)
            ? data.permissions
            : Array.isArray(data?.pages)
              ? data.pages
              : [];

      const normalizedPages: PermissionItem[] = rawPages.map((p: any) => ({
        permission:
          p.permission ??
          `${p.lob ?? ""}-${p.page ?? ""}-${p.module ?? ""}-${p.section ?? ""}`,
        lob: String(p.lob ?? ""),
        page: String(p.page ?? ""),
        module: String(p.module ?? ""),
        section: String(p.section ?? ""),
        access: (p.access || "view").toLowerCase(),
        assigned: Boolean(p.assigned),
      }));

      if (returnedRoles.length > 0) {
        setRoles(returnedRoles);
      }

      if (selectedResponseRole) {
        setSelectedRoleKey(roleKey(selectedResponseRole));
      }

      setPermissions(normalizedPages);
      setInitialPermissions(normalizedPages);
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

  function handlePermissionChange(
    permissionIndex: number,
    field: "access" | "assigned",
    value: string | boolean,
  ) {
    setPermissions((current) =>
      current.map((permission, index) =>
        index === permissionIndex ? { ...permission, [field]: value } : permission,
      ),
    );
  }

  const hasChanges = useMemo(() => {
    if (permissions.length === 0 || initialPermissions.length === 0) return false;
    if (permissions.length !== initialPermissions.length) return true;
    return permissions.some((curr, idx) => !isPermissionEqual(curr, initialPermissions[idx]));
  }, [permissions, initialPermissions]);

  const changedCount = useMemo(() => {
    if (permissions.length === 0 || initialPermissions.length === 0) return 0;
    return permissions.filter((curr, idx) => !isPermissionEqual(curr, initialPermissions[idx])).length;
  }, [permissions, initialPermissions]);

  async function handleUpdatePermissions() {
    const selectedRole = roles.find((role) => roleMatches(role, selectedRoleKey));
    const identifier = getRoleIdentifier(selectedRole);

    if (!identifier) {
      setUpdateError("No valid role identifier to update permissions");
      return;
    }

    setUpdatingPermissions(true);
    setUpdateError(null);
    setUpdateSuccess(null);

    const payload = {
      permissions: permissions.map((p) => ({
        lob: p.lob,
        page: p.page,
        module: p.module,
        section: p.section,
        access: (p.access || "view").toLowerCase(),
        assigned: Boolean(p.assigned),
      })),
    };

    try {
      const res = await fetch(
        `http://localhost:5000/api/rbac/roles/${encodeURIComponent(identifier)}/permissions`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        let errorMsg = `${res.status} ${res.statusText}`;
        try {
          const errJson = await res.json();
          if (errJson?.message) errorMsg = errJson.message;
        } catch {
          // ignore
        }
        throw new Error(errorMsg);
      }

      setInitialPermissions(permissions);
      setUpdateSuccess("Permissions updated successfully!");
      setTimeout(() => {
        setUpdateSuccess(null);
      }, 4000);
    } catch (err: unknown) {
      setUpdateError(err instanceof Error ? err.message : "Failed to update permissions");
    } finally {
      setUpdatingPermissions(false);
    }
  }

  function handleResetFilters() {
    setSearchQuery("");
    setActiveFilter("all");
    setCurrentPage(1);
  }

  // Filtered permissions
  const filteredPermissions = useMemo(() => {
    return permissions.map((item, originalIndex) => ({ item, originalIndex })).filter(({ item }) => {
      // Filter tab
      if (activeFilter === "assigned" && !item.assigned) return false;
      if (activeFilter === "unassigned" && item.assigned) return false;
      if (activeFilter === "edit" && item.access.toLowerCase() !== "edit") return false;
      if (activeFilter === "view" && item.access.toLowerCase() !== "view") return false;
    return permissions
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item }) => {
        if (activeFilter === "assigned" && !item.assigned) return false;
        if (activeFilter === "unassigned" && item.assigned) return false;
        if (activeFilter === "edit" && item.access.toLowerCase() !== "edit") return false;
        if (activeFilter === "view" && item.access.toLowerCase() !== "view") return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesLob = item.lob.toLowerCase().includes(q);
        const matchesPage = item.page.toLowerCase().includes(q);
        const matchesModule = item.module.toLowerCase().includes(q);
        const matchesSection = item.section.toLowerCase().includes(q);
        const matchesAccess = item.access.toLowerCase().includes(q);
        const matchesAssigned = (item.assigned ? "assigned" : "unassigned not assigned").includes(q);
        return matchesLob || matchesPage || matchesModule || matchesSection || matchesAccess || matchesAssigned;
      }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesLob = item.lob.toLowerCase().includes(q);
          const matchesPage = item.page.toLowerCase().includes(q);
          const matchesModule = item.module.toLowerCase().includes(q);
          const matchesSection = item.section.toLowerCase().includes(q);
          const matchesAccess = item.access.toLowerCase().includes(q);
          const matchesAssigned = (item.assigned ? "assigned" : "unassigned not assigned").includes(q);
          return matchesLob || matchesPage || matchesModule || matchesSection || matchesAccess || matchesAssigned;
        }

      return true;
    });
        return true;
      });
  }, [permissions, activeFilter, searchQuery]);

  // Counts for pills
  // Counts for filter pills
  const counts = useMemo(() => {
    const total = permissions.length;
    const assigned = permissions.filter((p) => p.assigned).length;
    const unassigned = total - assigned;
    const edit = permissions.filter((p) => (p.access || "").toLowerCase() === "edit").length;
    const view = permissions.filter((p) => (p.access || "").toLowerCase() === "view").length;
    return { total, assigned, unassigned, edit, view };
  }, [permissions]);

  const selectedIndex = selectedRoleKey
    ? roles.findIndex((role) => roleMatches(role, selectedRoleKey))
    : -1;

  const selectedRole = selectedIndex >= 0 ? roles[selectedIndex] : undefined;

  const paginatedItems = useMemo(() => {
    return filteredPermissions.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredPermissions, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Page Header matching reference style */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            RBAC - Role Permissions
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Search, filter and manage permission access matrix across system roles.
          </p>
        </div>
      {/* 1. Reusable Top Header with Stat Pills */}
      <RBACHeader
        totalRoles={roles.length}
        totalPermissions={permissions.length}
        hasChanges={hasChanges}
        changedCount={changedCount}
      />

        {/* Top summary counter pills matching top badges in image */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs">
            <span>Roles</span>
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#C81E2B] px-1 text-[10px] font-bold text-white">
              {roles.length}
            </span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs">
            <span>Permissions</span>
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
              {permissions.length}
            </span>
          </div>

          {hasChanges && (
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 animate-pulse">
              <span>Unsaved Changes</span>
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-bold text-white">
                {changedCount}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Left Roles Selector & Right Permissions Matrix */}
      {/* 2. Main Grid: Left Role Sidebar & Right Permissions Card */}
      <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        {/* Left Side: Roles List */}
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <div className="mb-3 px-1">
            <h2 className="text-sm font-bold text-slate-900">Roles</h2>
            <p className="text-xs text-slate-400">Select a role to inspect matrix.</p>
          </div>
        {/* Left Side: Reusable Role Sidebar */}
        <RoleSidebar
          roles={roles}
          selectedIndex={selectedIndex}
          currentRoleId={currentRoleId}
          loadingRoles={loadingRoles}
          rolesError={rolesError}
          onRoleClick={handleRoleClick}
        />

          {/* Role search */}
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search roles..."
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-100 transition"
            />
          </div>

          <div className="max-h-[38rem] space-y-1.5 overflow-y-auto pr-0.5">
            {loadingRoles && <p className="p-3 text-center text-xs text-slate-400">Loading roles...</p>}
            {rolesError && <p className="p-3 text-xs text-red-500">{rolesError}</p>}
            {!loadingRoles && !rolesError && roles.length === 0 && (
              <p className="p-3 text-center text-xs text-slate-400">No roles found.</p>
            )}

            {roles
              .map((role, idx) => ({ role, idx }))
              .filter(({ role }) => {
                const name = role.role ?? role.role_name ?? `Role ${role.role_id}`;
                return name.toLowerCase().includes(roleSearch.toLowerCase());
              })
              .map(({ role, idx }) => {
                const name = role.role ?? role.role_name ?? `Role ${role.role_id}`;
                const isSelected = idx === selectedIndex;
                const isCurrent = String(role.role_id) === currentRoleId;

                return (
                  <button
                    key={`${role.role_id ?? name}-${idx}`}
                    type="button"
                    onClick={() => handleRoleClick(idx)}
                    className={`w-full flex items-center gap-3 rounded-xl p-2.5 text-left text-xs transition ${
                      isSelected
                        ? "bg-red-50/80 border border-red-200 text-red-900 shadow-2xs"
                        : "text-slate-700 hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition ${
                        isSelected
                          ? "bg-[#C81E2B] text-white shadow-xs"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{name}</p>
                      {isCurrent && (
                        <span className="mt-0.5 inline-block text-[10px] font-bold uppercase tracking-wider text-red-600">
                          Current Role
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#C81E2B] text-[10px] font-bold text-white">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </aside>

        {/* Right Side: Permissions Card & Table */}
        <div className="space-y-4">
          {/* Main Card Container */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Toolbar Area matching reference image (Search + Action Buttons + Filter Pills) */}
            <div className="border-b border-slate-100 p-4 space-y-3.5">
              {/* Top Row: Search Input + Reset + Update Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search Box */}
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search by LOB, page, module, section, access..."
                    className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs font-medium text-slate-700 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition shadow-2xs placeholder:text-slate-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
            {/* 3. Reusable Permissions Toolbar (Search, Filter Tabs, Reset, Crimson Update CTA) */}
            <PermissionsToolbar
              searchQuery={searchQuery}
              onSearchChange={(q) => {
                setSearchQuery(q);
                setCurrentPage(1);
              }}
              activeFilter={activeFilter}
              onFilterChange={(tab) => {
                setActiveFilter(tab);
                setCurrentPage(1);
              }}
              counts={counts}
              hasChanges={hasChanges}
              changedCount={changedCount}
              updatingPermissions={updatingPermissions}
              loadingPermissions={loadingPermissions}
              onUpdate={handleUpdatePermissions}
              onReset={handleResetFilters}
            />

                {/* Reset Button */}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Reset</span>
                </button>

                {/* Primary Action: Crimson Red Update Button */}
                <button
                  type="button"
                  onClick={handleUpdatePermissions}
                  disabled={!hasChanges || updatingPermissions || loadingPermissions}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#C81E2B] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#A91823] active:bg-[#8E141D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {updatingPermissions ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-bold">+</span>
                      <span>Update Permissions</span>
                      {hasChanges && (
                        <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-white/25 px-1 text-[9px] font-bold text-white">
                          {changedCount}
                        </span>
                      )}
                    </>
                  )}
                </button>
              </div>

              {/* Bottom Row: Quick Filter Badges / Pills matching reference image */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* All */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter("all");
                    setCurrentPage(1);
                  }}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    activeFilter === "all"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  All ({counts.total})
                </button>

                {/* Assigned */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter("assigned");
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition cursor-pointer ${
                    activeFilter === "assigned"
                      ? "border-emerald-500 bg-emerald-600 text-white font-semibold shadow-xs"
                      : "border-emerald-300 bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100/70"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${activeFilter === "assigned" ? "bg-white" : "bg-emerald-500"}`} />
                  <span>Assigned ({counts.assigned})</span>
                </button>

                {/* Not Assigned */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter("unassigned");
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition cursor-pointer ${
                    activeFilter === "unassigned"
                      ? "border-amber-500 bg-amber-600 text-white font-semibold shadow-xs"
                      : "border-amber-300 bg-amber-50/70 text-amber-700 hover:bg-amber-100/70"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${activeFilter === "unassigned" ? "bg-white" : "bg-amber-500"}`} />
                  <span>Not Assigned ({counts.unassigned})</span>
                </button>

                {/* Edit Access */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter("edit");
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition cursor-pointer ${
                    activeFilter === "edit"
                      ? "border-blue-500 bg-blue-600 text-white font-semibold shadow-xs"
                      : "border-blue-300 bg-blue-50/70 text-blue-700 hover:bg-blue-100/70"
                  }`}
                >
                  <span>Edit Access ({counts.edit})</span>
                </button>

                {/* View Access */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter("view");
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition cursor-pointer ${
                    activeFilter === "view"
                      ? "border-slate-500 bg-slate-700 text-white font-semibold shadow-xs"
                      : "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span>View Access ({counts.view})</span>
                </button>
              </div>
            </div>

            {/* Notifications / Alerts */}
            {/* Notification Alerts */}
            {updateSuccess && (
              <div className="flex items-center justify-between border-b border-emerald-200 bg-emerald-50 px-5 py-2.5 text-xs font-medium text-emerald-800 animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-200 text-emerald-700 font-bold">✓</span>
                  <span>{updateSuccess}</span>
                </div>
                <button type="button" onClick={() => setUpdateSuccess(null)} className="text-emerald-600 hover:text-emerald-800">✕</button>
              </div>
            )}

            {updateError && (
              <div className="flex items-center justify-between border-b border-red-200 bg-red-50 px-5 py-2.5 text-xs font-medium text-red-800 animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-200 text-red-700 font-bold">!</span>
                  <span>{updateError}</span>
                </div>
                <button type="button" onClick={() => setUpdateError(null)} className="text-red-600 hover:text-red-800">✕</button>
              </div>
            )}

            {permError && (
              <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-xs text-red-600">
                {permError}
              </div>
            )}

            {/* Permissions Table */}
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-xs text-slate-700">
                <thead className="border-b border-slate-200 bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3 pl-5 pr-3 text-left">LOB</th>
                    <th className="py-3 px-3 text-left">PAGE</th>
                    <th className="py-3 px-3 text-left">MODULE</th>
                    <th className="py-3 px-3 text-left">SECTION</th>
                    <th className="py-3 px-3 text-left">ACCESS</th>
                    <th className="py-3 px-3 text-left">ASSIGNMENT</th>
                    <th className="py-3 px-3 text-left">STATUS</th>
                    <th className="py-3 pl-3 pr-5 text-right">ACTIONS</th>
                  </tr>
                </thead>
            {/* 4. Reusable Permissions Table */}
            <PermissionsTable
              permissions={paginatedItems}
              selectedRole={selectedRole}
              loadingPermissions={loadingPermissions}
              hasFilterOrSearch={Boolean(searchQuery || activeFilter !== "all")}
              onPermissionChange={handlePermissionChange}
            />

                <tbody className="divide-y divide-slate-100">
                  {loadingPermissions && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                          <span>Loading role permissions...</span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!loadingPermissions && !selectedRole && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Please select a role from the left panel to inspect permissions.
                      </td>
                    </tr>
                  )}

                  {!loadingPermissions && selectedRole && filteredPermissions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        {searchQuery || activeFilter !== "all"
                          ? "No permissions match your search or filter."
                          : "No permissions configured for this role."}
                      </td>
                    </tr>
                  )}

                  {!loadingPermissions &&
                    filteredPermissions
                      .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                      .map(({ item, originalIndex }) => {
                        const isAssigned = Boolean(item.assigned);
                        const isEdit = (item.access || "").toLowerCase() === "edit";

                        // Left vertical stripe accent matching reference image
                        const leftStripeClass = !isAssigned
                          ? "border-l-4 border-l-slate-300"
                          : isEdit
                          ? "border-l-4 border-l-emerald-500"
                          : "border-l-4 border-l-amber-500";

                        return (
                          <tr
                            key={`${item.permission || `${item.lob}-${item.page}-${item.module}-${item.section}`}-${originalIndex}`}
                            className={`transition hover:bg-slate-50/80 ${leftStripeClass}`}
                          >
                            {/* LOB */}
                            <td className="py-3 pl-4 pr-3 font-semibold uppercase tracking-tight text-slate-900">
                              {item.lob}
                            </td>

                            {/* Page */}
                            <td className="py-3 px-3 font-medium text-slate-800">
                              {item.page}
                            </td>

                            {/* Module */}
                            <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                              {item.module}
                            </td>

                            {/* Section */}
                            <td className="py-3 px-3 font-medium text-slate-700">
                              {item.section}
                            </td>

                            {/* Access Select */}
                            <td className="py-3 px-3">
                              <select
                                aria-label={`Access for ${item.section}`}
                                value={(item.access || "view").toLowerCase()}
                                onChange={(e) =>
                                  handlePermissionChange(originalIndex, "access", e.target.value.toLowerCase())
                                }
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-100 transition shadow-2xs cursor-pointer"
                              >
                                <option value="view">View</option>
                                <option value="edit">Edit</option>
                              </select>
                            </td>

                            {/* Assignment Select */}
                            <td className="py-3 px-3">
                              <select
                                aria-label={`Assignment for ${item.section}`}
                                value={item.assigned ? "assigned" : "not-assigned"}
                                onChange={(e) =>
                                  handlePermissionChange(originalIndex, "assigned", e.target.value === "assigned")
                                }
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-100 transition shadow-2xs cursor-pointer"
                              >
                                <option value="assigned">Assigned</option>
                                <option value="not-assigned">Not assigned</option>
                              </select>
                            </td>

                            {/* Status Badge */}
                            <td className="py-3 px-3">
                              {item.assigned ? (
                                <StatusBadge label="Assigned" variant="assigned" />
                              ) : (
                                <StatusBadge label="Inactive" variant="inactive" />
                              )}
                            </td>

                            {/* Actions column matching reference icon buttons */}
                            <td className="py-3 pl-3 pr-5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Toggle Access button */}
                                <button
                                  type="button"
                                  title={`Switch access to ${item.access === "edit" ? "view" : "edit"}`}
                                  onClick={() =>
                                    handlePermissionChange(
                                      originalIndex,
                                      "access",
                                      item.access === "edit" ? "view" : "edit",
                                    )
                                  }
                                  className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
                                >
                                  ✎
                                </button>

                                {/* Toggle Assigned button */}
                                <button
                                  type="button"
                                  title={`Toggle ${item.assigned ? "unassign" : "assign"}`}
                                  onClick={() =>
                                    handlePermissionChange(originalIndex, "assigned", !item.assigned)
                                  }
                                  className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
                                >
                                  ◎
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer matching reference image */}
            {/* 5. Reusable Pagination Footer */}
            {!loadingPermissions && filteredPermissions.length > 0 && (
              <TablePagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredPermissions.length}
                onPageChange={(page) => setCurrentPage(page)}
                onPageSizeChange={(size) => setPageSize(size)}
                pageSizeOptions={[10, 25, 50]}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
