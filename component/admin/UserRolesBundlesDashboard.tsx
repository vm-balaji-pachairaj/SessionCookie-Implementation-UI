"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import AddPolicyBundleModal from "./AddPolicyBundleModal";
import ConfirmDialog from "./ConfirmDialog";
import PolicyDefinitionsModal, { PolicyDefinition } from "./PolicyDefinitionsModal";

const ADMIN_API = "http://localhost:5000/api/admin";

interface RoleSummary {
  role: string;
  bundleCount: number;
}

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

// Generates consistent distinct avatar colors based on role initial
function getRoleAvatarColor(role: string): { bg: string; text: string } {
  const char = role.charAt(0).toUpperCase();
  const colors: Record<string, { bg: string; text: string }> = {
    A: { bg: "bg-blue-100", text: "text-blue-700" },
    B: { bg: "bg-indigo-100", text: "text-indigo-700" },
    C: { bg: "bg-red-100", text: "text-[#C81E1E]" },
    D: { bg: "bg-amber-100", text: "text-amber-800" },
    E: { bg: "bg-emerald-100", text: "text-emerald-700" },
    F: { bg: "bg-cyan-100", text: "text-cyan-700" },
    H: { bg: "bg-purple-100", text: "text-purple-700" },
    M: { bg: "bg-orange-100", text: "text-orange-700" },
    S: { bg: "bg-teal-100", text: "text-teal-700" },
  };
  return colors[char] || { bg: "bg-slate-100", text: "text-slate-700" };
}

export default function UserRolesBundlesDashboard() {
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [roleSearch, setRoleSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Bundles assigned to the selected role
  const [bundles, setBundles] = useState<RoleBundle[]>([]);
  const [loadingBundles, setLoadingBundles] = useState(false);
  const [bundleSearch, setBundleSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "assigned" | "active">("all");

  // Modals & actions
  const [showAddBundleModal, setShowAddBundleModal] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [inspectBundle, setInspectBundle] = useState<RoleBundle | null>(null);
  const [inspectPolicies, setInspectPolicies] = useState<BundlePolicyPreview[]>([]);
  const [loadingInspectPolicies, setLoadingInspectPolicies] = useState(false);

  // Pagination for bundles table
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Notifications
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load all roles
  const loadRoles = useCallback(async () => {
    try {
      setLoadingRoles(true);
      const res = await axios.get<RoleSummary[]>(`${ADMIN_API}/roles`);
      setRoles(res.data);
      if (res.data.length > 0 && !selectedRole) {
        setSelectedRole(res.data[0].role);
      }
    } catch (err) {
      console.error("Failed to load roles:", err);
      showToast("Unable to load user roles", "error");
    } finally {
      setLoadingRoles(false);
    }
  }, [selectedRole]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  // Load assigned bundles when selected role changes
  const loadRoleBundles = useCallback(async () => {
    if (!selectedRole) {
      setBundles([]);
      return;
    }
    try {
      setLoadingBundles(true);
      const res = await axios.get<RoleBundle[]>(
        `${ADMIN_API}/roles/${encodeURIComponent(selectedRole)}/bundles`
      );
      setBundles(res.data);
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to load role bundles:", err);
      showToast("Unable to load bundles for role", "error");
    } finally {
      setLoadingBundles(false);
    }
  }, [selectedRole]);

  useEffect(() => {
    loadRoleBundles();
  }, [loadRoleBundles]);

  // Handle removing bundle from role
  const handleRemoveConfirmed = async () => {
    if (!selectedRole || !removeTarget) return;
    try {
      setRemoving(true);
      await axios.delete(
        `${ADMIN_API}/roles/${encodeURIComponent(
          selectedRole
        )}/bundles/${encodeURIComponent(removeTarget)}`
      );
      showToast(`Removed bundle "${removeTarget}" from ${selectedRole}`);
      setRemoveTarget(null);
      await loadRoleBundles();
      await loadRoles();
    } catch (err: unknown) {
      console.error("Remove bundle error:", err);
      showToast("Failed to remove policy bundle", "error");
    } finally {
      setRemoving(false);
    }
  };

  // Handle inspecting bundle policies
  const handleOpenInspectBundle = async (bundle: RoleBundle) => {
    try {
      setInspectBundle(bundle);
      setLoadingInspectPolicies(true);
      const res = await axios.get<BundlePolicyPreview[]>(
        `${ADMIN_API}/policy-bundles/${bundle.id}/policies`
      );
      setInspectPolicies(res.data);
    } catch (err) {
      console.error("Inspect bundle error:", err);
      showToast("Unable to inspect policies for bundle", "error");
    } finally {
      setLoadingInspectPolicies(false);
    }
  };

  // Filtered roles on the left
  const filteredRoles = useMemo(() => {
    return roles.filter((r) =>
      r.role.toLowerCase().includes(roleSearch.toLowerCase())
    );
  }, [roles, roleSearch]);

  // Filtered bundles on the right
  const filteredBundles = useMemo(() => {
    return bundles.filter((b) => {
      const matchSearch =
        b.name.toLowerCase().includes(bundleSearch.toLowerCase()) ||
        (b.description &&
          b.description.toLowerCase().includes(bundleSearch.toLowerCase()));
      return matchSearch;
    });
  }, [bundles, bundleSearch]);

  // Paginated bundles
  const totalPages = Math.ceil(filteredBundles.length / pageSize) || 1;
  const paginatedBundles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBundles.slice(start, start + pageSize);
  }, [filteredBundles, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-xs font-semibold shadow-md transition-all ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
              : "bg-red-50 text-red-800 border border-red-300"
          }`}
        >
          <span>{notification.text}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="ml-4 text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main 2-Pane Master Detail Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* ============================================================ */}
        {/* Left Pane (4 cols): User Roles List (matches Image 2 layout) */}
        {/* ============================================================ */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Roles</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Select a role to inspect assigned policy bundles.
            </p>
          </div>

          {/* Search roles */}
          <div className="mt-3">
            <div className="relative">
              <input
                type="text"
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                placeholder="Search roles..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#C81E1E] focus:bg-white focus:ring-1 focus:ring-[#C81E1E]"
              />
              <svg
                className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Role list items */}
          <div className="mt-3 max-h-[620px] overflow-y-auto space-y-1.5 pr-1">
            {loadingRoles ? (
              <p className="py-8 text-center text-xs text-slate-400">
                Loading roles…
              </p>
            ) : filteredRoles.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                No roles match your search.
              </p>
            ) : (
              filteredRoles.map((r) => {
                const isSelected = selectedRole === r.role;
                const avatar = getRoleAvatarColor(r.role);

                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => setSelectedRole(r.role)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border p-2.5 text-left transition ${
                      isSelected
                        ? "border-[#C81E1E] bg-red-50/50 shadow-xs ring-1 ring-[#C81E1E]"
                        : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Avatar initial badge */}
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          isSelected
                            ? "bg-[#C81E1E] text-white"
                            : `${avatar.bg} ${avatar.text}`
                        }`}
                      >
                        {r.role.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-xs font-bold ${
                            isSelected ? "text-[#C81E1E]" : "text-slate-800"
                          }`}
                        >
                          {r.role}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Role identifier
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {r.bundleCount} {r.bundleCount === 1 ? "bundle" : "bundles"}
                      </span>
                      {isSelected && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C81E1E] text-white text-[10px] font-bold">
                          ✓
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* Right Pane (8 cols): Assigned Policy Bundles Table          */}
        {/* ============================================================ */}
        <div className="lg:col-span-8 space-y-4">
          {/* Header Bar & Add Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Role Policy Matrix
                </span>
                <span className="rounded-md bg-red-100/70 px-1.5 py-0.5 text-[10px] font-extrabold text-[#C81E1E]">
                  Casbin g3 Mapping
                </span>
              </div>
              <h2 className="mt-0.5 text-lg font-black text-slate-900">
                {selectedRole ? selectedRole : "Select a Role"}
              </h2>
              <p className="text-xs text-slate-500">
                Search, filter and manage policy bundles assigned to this user role.
              </p>
            </div>

            {/* Primary Action Button in Crimson Red (from Scan Tag) */}
            <button
              type="button"
              onClick={() => setShowAddBundleModal(true)}
              disabled={!selectedRole}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#C81E1E] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              + Add Policy Bundle to Role
            </button>
          </div>

          {/* Action & Filter Bar (Scan Tag Style) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={bundleSearch}
                onChange={(e) => setBundleSearch(e.target.value)}
                placeholder="Search by bundle name or description..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#C81E1E] focus:bg-white focus:ring-1 focus:ring-[#C81E1E]"
              />
              <svg
                className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <svg
                  className="h-3.5 w-3.5 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span>Filters</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBundleSearch("");
                  setStatusFilter("all");
                }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <svg
                  className="h-3.5 w-3.5 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Status Filter Chips (Scan Tag Style) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`rounded-full px-3.5 py-1 text-xs font-bold transition ${
                statusFilter === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              All ({bundles.length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("assigned")}
              className={`rounded-full px-3.5 py-1 text-xs font-bold transition ${
                statusFilter === "assigned"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              Assigned ({bundles.length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={`rounded-full px-3.5 py-1 text-xs font-bold transition ${
                statusFilter === "active"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              Active ({bundles.length})
            </button>
          </div>

          {/* Data Table with Left Vertical Color Stripe (Exact Scan Tag Style) */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#F9FAFC] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5">Bundle Name</th>
                    <th className="px-5 py-3.5">Description</th>
                    <th className="px-5 py-3.5">Policy Count</th>
                    <th className="px-5 py-3.5">Mapping Type</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingBundles ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                        Loading assigned bundles…
                      </td>
                    </tr>
                  ) : paginatedBundles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <p className="text-xs font-semibold text-slate-600">
                            No policy bundles assigned to role &ldquo;{selectedRole}&rdquo;.
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            Click &ldquo;+ Add Policy Bundle to Role&rdquo; to attach bundles and inspect their policies.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowAddBundleModal(true)}
                            className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#C81E1E] hover:bg-red-50 transition"
                          >
                            + Add Policy Bundle
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedBundles.map((b, idx) => (
                      <tr
                        key={b.id}
                        className={`transition hover:bg-slate-50/80 ${
                          // Alternating or state-based left vertical stripe matching Scan Tag
                          idx % 2 === 0
                            ? "border-l-4 border-amber-500"
                            : "border-l-4 border-emerald-500"
                        }`}
                      >
                        {/* BUNDLE NAME */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">
                              {b.name}
                            </span>
                          </div>
                        </td>

                        {/* DESCRIPTION */}
                        <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">
                          {b.description || "—"}
                        </td>

                        {/* POLICIES COUNT */}
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            onClick={() => handleOpenInspectBundle(b)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition"
                            title="Click to inspect bundle policies"
                          >
                            <span>{b.policyCount} policies</span>
                            <span className="text-[10px] text-slate-400">↗</span>
                          </button>
                        </td>

                        {/* MAPPING */}
                        <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                          g3 (Role → Bundle)
                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Assigned
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* View / Inspect policies button */}
                            <button
                              type="button"
                              onClick={() => handleOpenInspectBundle(b)}
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                              title="Inspect policies in bundle"
                            >
                              <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>

                            {/* Remove from Role button */}
                            <button
                              type="button"
                              onClick={() => setRemoveTarget(b.name)}
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition"
                              title="Remove bundle from role"
                            >
                              <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer (Exact Scan Tag Style) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-[#F9FAFC] px-5 py-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
                <span>entries per page • {filteredBundles.length} results</span>
              </div>

              {/* Page navigation */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  const isActive = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold transition ${
                        isActive
                          ? "bg-slate-900 text-white shadow-xs"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Modals & Overlays                                           */}
      {/* ============================================================ */}

      {/* Add Policy Bundle to Role Modal */}
      {showAddBundleModal && selectedRole && (
        <AddPolicyBundleModal
          role={selectedRole}
          onClose={() => setShowAddBundleModal(false)}
          onAdded={async () => {
            setShowAddBundleModal(false);
            showToast(`Assigned policy bundle to ${selectedRole}!`);
            await loadRoleBundles();
            await loadRoles();
          }}
        />
      )}

      {/* Remove Policy Bundle Confirm Dialog */}
      {removeTarget && selectedRole && (
        <ConfirmDialog
          title="Remove Policy Bundle"
          message={`Are you sure you want to remove policy bundle "${removeTarget}" from role "${selectedRole}"? The role will lose all permissions contained in this bundle.`}
          confirmLabel={removing ? "Removing…" : "Remove from Role"}
          confirmDisabled={removing}
          onConfirm={handleRemoveConfirmed}
          onCancel={() => setRemoveTarget(null)}
        />
      )}

      {/* Inspect Bundle Policies Modal */}
      {inspectBundle && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={() => setInspectBundle(null)}
        >
          <div
            className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-[#C81E1E]">
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l-8 4v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4zm1 14h-2v-3H8v-2h3V8h2v3h3v2h-3v3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {inspectBundle.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Policies assigned within this bundle ({inspectPolicies.length} total)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectBundle(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
              {loadingInspectPolicies ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  Loading policies…
                </p>
              ) : inspectPolicies.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  No individual policies configured in this bundle.
                </p>
              ) : (
                inspectPolicies.map((p, idx) => (
                  <div
                    key={`${p.permission}-${idx}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3 hover:bg-slate-50 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 truncate">
                          {p.permission}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                            p.ptype === "p2"
                              ? "bg-purple-100 text-purple-700"
                              : p.ptype === "p3"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {p.ptype}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                        {p.page && <span>Page: <strong>{p.page}</strong></span>}
                        {p.module && <span>• Module: <strong>{p.module}</strong></span>}
                        {p.section && <span>• Section: <strong>{p.section}</strong></span>}
                        {p.field && <span>• Field: <strong>{p.field}</strong></span>}
                        {p.displayName && <span>Menu: <strong>{p.displayName}</strong></span>}
                      </div>
                    </div>

                    {p.access && (
                      <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 shrink-0">
                        • {p.access}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-3.5">
              <button
                type="button"
                onClick={() => setInspectBundle(null)}
                className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

