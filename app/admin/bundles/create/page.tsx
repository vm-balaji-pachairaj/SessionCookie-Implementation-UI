"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import ScanTagNavbar from "@/component/ScanTagNavbar";

const ADMIN_API = "http://localhost:5000/api/admin";

interface PolicyDefinition {
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
  order?: number | null;
}

interface PolicySummary {
  permission: string;
  ptype: "p" | "p2" | "p3";
  definitions: PolicyDefinition[];
}

type PtypeTab = "all" | "p" | "p2" | "p3";

function describeDefinitions(policy: PolicySummary): string {
  if (policy.definitions.length === 0) return "—";
  const [d] = policy.definitions;
  if (d.ptype === "p2") {
    return (
      [d.parent, d.displayName].filter(Boolean).join(" / ") +
      (d.route ? ` (${d.route})` : "")
    );
  }
  if (d.ptype === "p3") {
    return (
      [d.page, d.module, d.section, d.field].filter(Boolean).join(" / ") +
      (d.access ? ` • ${d.access}` : "")
    );
  }
  return (
    [d.page, d.module, d.section].filter(Boolean).join(" / ") +
    (d.access ? ` • ${d.access}` : "")
  );
}

function getAccessLevel(policy: PolicySummary): string {
  const [d] = policy.definitions;
  if (!d) return "—";
  if (d.ptype === "p2") return "Navigation";
  return d.access || "Read";
}

export default function CreatePolicyBundleSinglePage() {
  const router = useRouter();

  // Bundle metadata state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Policies selection state
  const [allPolicies, setAllPolicies] = useState<PolicySummary[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [selectedPolicies, setSelectedPolicies] = useState<Set<string>>(new Set());

  // Search & Tab filters
  const [policySearch, setPolicySearch] = useState("");
  const [activeTab, setActiveTab] = useState<PtypeTab>("all");

  // Pagination for permissions table
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Submission state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load all available policies from backend
  const loadPolicies = useCallback(async () => {
    try {
      setLoadingPolicies(true);
      setError("");
      const res = await axios.get<PolicySummary[]>(`${ADMIN_API}/policies`);
      setAllPolicies(res.data);
    } catch (err) {
      console.error("Failed to load policies:", err);
      setError("Unable to load permissions from server.");
    } finally {
      setLoadingPolicies(false);
    }
  }, []);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  // Tab counts
  const pCount = useMemo(() => allPolicies.filter((p) => p.ptype === "p").length, [allPolicies]);
  const p2Count = useMemo(() => allPolicies.filter((p) => p.ptype === "p2").length, [allPolicies]);
  const p3Count = useMemo(() => allPolicies.filter((p) => p.ptype === "p3").length, [allPolicies]);

  // Filtered policies list
  const filteredPolicies = useMemo(() => {
    return allPolicies
      .filter((p) => {
        if (activeTab === "all") return true;
        return p.ptype === activeTab;
      })
      .filter((p) => {
        if (!policySearch.trim()) return true;
        const q = policySearch.toLowerCase();
        const desc = describeDefinitions(p).toLowerCase();
        return p.permission.toLowerCase().includes(q) || desc.includes(q);
      });
  }, [allPolicies, activeTab, policySearch]);

  // Pagination
  const totalPages = Math.ceil(filteredPolicies.length / pageSize) || 1;
  const paginatedPolicies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPolicies.slice(start, start + pageSize);
  }, [filteredPolicies, currentPage, pageSize]);

  // Toggle single policy selection
  const togglePolicy = (permissionName: string) => {
    setSelectedPolicies((prev) => {
      const next = new Set(prev);
      if (next.has(permissionName)) {
        next.delete(permissionName);
      } else {
        next.add(permissionName);
      }
      return next;
    });
  };

  // Select all filtered policies
  const selectAllFiltered = () => {
    setSelectedPolicies((prev) => {
      const next = new Set(prev);
      filteredPolicies.forEach((p) => next.add(p.permission));
      return next;
    });
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedPolicies(new Set());
  };

  // Submit and create bundle with policies in one go
  const handleCreateBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a Policy Bundle Name.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setSaving(true);
      setError("");

      await axios.post(`${ADMIN_API}/policy-bundles`, {
        name: name.trim(),
        description: description.trim() || undefined,
        policyNames: Array.from(selectedPolicies),
      });

      // Redirect back to dashboard with the new bundle
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("Create bundle error:", err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(String(err.response.data.message));
      } else {
        setError("Failed to create policy bundle.");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] font-sans pb-28">
      {/* Top Navbar */}
      <ScanTagNavbar username="Security Admin" roleName="RBAC Administrator" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition"
              >
                ← Back to Dashboard
              </Link>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C81E1E]">
                Single-Page Creator
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-black text-slate-900 tracking-tight">
              Create New Policy Bundle
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Enter bundle details and choose all assigned permissions in one go.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleCreateBundle}
              disabled={saving || !name.trim()}
              className="rounded-lg bg-[#C81E1E] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#B91C1C] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? "Creating Bundle…" : `Create Bundle (${selectedPolicies.size} Selected)`}
            </button>
          </div>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* Step 1: Bundle Metadata Details Card                        */}
        {/* ============================================================ */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-red-100 text-[#C81E1E] text-xs font-black">
              1
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              Bundle Information
            </h2>
            <span className="text-xs text-slate-400">
              (Name and Purpose of this Policy Group)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Policy Bundle Name <span className="text-[#C81E1E]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Call Center Supervisor Bundle"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#C81E1E] focus:bg-white focus:ring-1 focus:ring-[#C81E1E]"
                autoFocus
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Unique identifier for Casbin g rules (e.g. assigned to roles via g3).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what access permissions are granted by this bundle..."
                className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#C81E1E] focus:bg-white focus:ring-1 focus:ring-[#C81E1E]"
              />
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* Step 2: Select Policies in One Go                           */}
        {/* ============================================================ */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-red-100 text-[#C81E1E] text-xs font-black">
                2
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Select Policies to Include in Bundle
                </h2>
                <p className="text-xs text-slate-500">
                  Select permissions across section, menu, and field levels in one go.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllFiltered}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                Select All ({filteredPolicies.length})
              </button>
              <button
                type="button"
                onClick={clearSelection}
                disabled={selectedPolicies.size === 0}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition shadow-2xs"
              >
                Clear Selection
              </button>
            </div>
          </div>

          {/* Selected Policies Chip Tray */}
          {selectedPolicies.size > 0 && (
            <div className="rounded-xl border border-red-100 bg-red-50/40 p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-[#C81E1E]">
                  Selected Permissions ({selectedPolicies.size}):
                </span>
                <span className="text-[11px] text-slate-500">
                  Click any chip to remove
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {Array.from(selectedPolicies).map((perm) => (
                  <button
                    key={perm}
                    type="button"
                    onClick={() => togglePolicy(perm)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-2.5 py-0.5 text-[11px] font-mono font-semibold text-slate-800 shadow-2xs hover:bg-red-50 transition"
                  >
                    <span>{perm}</span>
                    <span className="text-red-500 font-bold text-xs">✕</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filter Tabs (Casbin RBAC Styled) */}
          <div className="flex items-center gap-2 overflow-x-auto rounded-xl bg-slate-200/60 p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab("all");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeTab === "all"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>All Permissions</span>
              <span
                className={`rounded-full px-2 py-0.2 text-[10px] ${
                  activeTab === "all" ? "bg-white/20" : "bg-slate-300/80 text-slate-700"
                }`}
              >
                {allPolicies.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("p");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeTab === "p"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Section Access (p)</span>
              <span
                className={`rounded-full px-2 py-0.2 text-[10px] ${
                  activeTab === "p" ? "bg-white/20" : "bg-slate-300/80 text-slate-700"
                }`}
              >
                {pCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("p2");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeTab === "p2"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Menu Access (p2)</span>
              <span
                className={`rounded-full px-2 py-0.2 text-[10px] ${
                  activeTab === "p2" ? "bg-white/20" : "bg-slate-300/80 text-slate-700"
                }`}
              >
                {p2Count}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("p3");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeTab === "p3"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Field Access (p3)</span>
              <span
                className={`rounded-full px-2 py-0.2 text-[10px] ${
                  activeTab === "p3" ? "bg-white/20" : "bg-slate-300/80 text-slate-700"
                }`}
              >
                {p3Count}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative max-w-md">
            <input
              type="text"
              value={policySearch}
              onChange={(e) => {
                setPolicySearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by permission name, page, module, field..."
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

          {/* Permissions Table with Checkboxes and Left Color Stripe */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#F9FAFC] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="w-12 px-4 py-3 text-center">
                      <span className="sr-only">Select</span>
                    </th>
                    <th className="px-4 py-3">Permission Rule</th>
                    <th className="px-4 py-3">Rule Type</th>
                    <th className="px-4 py-3">Target / Path</th>
                    <th className="px-4 py-3">Access Level</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingPolicies ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-xs text-slate-400"
                      >
                        Loading available permissions…
                      </td>
                    </tr>
                  ) : paginatedPolicies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                        No permissions found matching current filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedPolicies.map((p) => {
                      const isSelected = selectedPolicies.has(p.permission);
                      return (
                        <tr
                          key={p.permission}
                          onClick={() => togglePolicy(p.permission)}
                          className={`cursor-pointer transition hover:bg-slate-50 ${
                            isSelected
                              ? "bg-red-50/40 border-l-4 border-[#C81E1E]"
                              : p.ptype === "p2"
                              ? "border-l-4 border-purple-400"
                              : p.ptype === "p3"
                              ? "border-l-4 border-amber-400"
                              : "border-l-4 border-emerald-400"
                          }`}
                        >
                          {/* Checkbox */}
                          <td
                            className="px-4 py-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => togglePolicy(p.permission)}
                              className="h-4 w-4 rounded border-slate-300 text-[#C81E1E] focus:ring-[#C81E1E] cursor-pointer"
                            />
                          </td>

                          {/* PERMISSION RULE */}
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {p.permission}
                            </span>
                          </td>

                          {/* RULE TYPE */}
                          <td className="px-4 py-3">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                                p.ptype === "p2"
                                  ? "bg-purple-100 text-purple-700"
                                  : p.ptype === "p3"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {p.ptype === "p"
                                ? "p (section)"
                                : p.ptype === "p2"
                                ? "p2 (menu)"
                                : "p3 (field)"}
                            </span>
                          </td>

                          {/* TARGET / PATH */}
                          <td className="px-4 py-3 text-slate-600 max-w-sm truncate">
                            {describeDefinitions(p)}
                          </td>

                          {/* ACCESS LEVEL */}
                          <td className="px-4 py-3">
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-800">
                              {getAccessLevel(p)}
                            </span>
                          </td>

                          {/* STATUS */}
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Available
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-[#F9FAFC] px-4 py-3 text-xs text-slate-500">
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
                  <option value={50}>50</option>
                </select>
                <span>entries per page • {filteredPolicies.length} permissions</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  ‹
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
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
        </section>
      </div>

      {/* ============================================================ */}
      {/* Sticky Bottom Action Bar                                     */}
      {/* ============================================================ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-6 py-3.5 shadow-lg backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-900">
              {name ? `Bundle: "${name}"` : "New Policy Bundle"}
            </span>
            <span className="text-slate-300">•</span>
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-black text-[#C81E1E]">
              {selectedPolicies.size} {selectedPolicies.size === 1 ? "Permission" : "Permissions"} Selected
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleCreateBundle}
              disabled={saving || !name.trim()}
              className="rounded-lg bg-[#C81E1E] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#B91C1C] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? "Creating Bundle in One Go…" : "Create Policy Bundle in One Go"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

