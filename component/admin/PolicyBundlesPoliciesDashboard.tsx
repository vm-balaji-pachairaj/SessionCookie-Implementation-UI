"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import AddPolicyToBundleModal from "./AddPolicyToBundleModal";
import CreatePolicyBundleModal from "./CreatePolicyBundleModal";
import ConfirmDialog from "./ConfirmDialog";
import PolicyDefinitionsModal, { PolicyDefinition } from "./PolicyDefinitionsModal";

const ADMIN_API = "http://localhost:5000/api/admin";

interface PolicyBundleSummary {
  id: number;
  name: string;
  description: string | null;
  policyCount: number;
  roleCount: number;
  created_at?: string;
  updated_at?: string;
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
  order?: number | null;
}

type PtypeTab = "all" | "p" | "p2" | "p3";

export default function PolicyBundlesPoliciesDashboard() {
  const router = useRouter();
  const [bundles, setBundles] = useState<PolicyBundleSummary[]>([]);
  const [loadingBundles, setLoadingBundles] = useState(true);
  const [bundleSearch, setBundleSearch] = useState("");
  const [selectedBundleId, setSelectedBundleId] = useState<number | null>(null);

  // Policies of the selected bundle
  const [policies, setPolicies] = useState<BundlePolicy[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [policySearch, setPolicySearch] = useState("");
  const [activeTab, setActiveTab] = useState<PtypeTab>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "assigned">("all");

  // Modals
  const [showCreateBundleModal, setShowCreateBundleModal] = useState(false);
  const [showAddPolicyModal, setShowAddPolicyModal] = useState(false);
  const [removePolicyTarget, setRemovePolicyTarget] = useState<string | null>(null);
  const [removingPolicy, setRemovingPolicy] = useState(false);
  const [inspectPolicy, setInspectPolicy] = useState<{
    permission: string;
    definitions: PolicyDefinition[];
  } | null>(null);
  const [loadingInspect, setLoadingInspect] = useState(false);

  // Pagination for policies table
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

  // Load all policy bundles
  const loadBundles = useCallback(async () => {
    try {
      setLoadingBundles(true);
      const res = await axios.get<PolicyBundleSummary[]>(
        `${ADMIN_API}/policy-bundles`
      );
      setBundles(res.data);
      if (res.data.length > 0 && !selectedBundleId) {
        setSelectedBundleId(res.data[0].id);
      }
    } catch (err) {
      console.error("Load bundles error:", err);
      showToast("Unable to load policy bundles", "error");
    } finally {
      setLoadingBundles(false);
    }
  }, [selectedBundleId]);

  useEffect(() => {
    loadBundles();
  }, [loadBundles]);

  // Load policies for selected bundle
  const loadBundlePolicies = useCallback(async () => {
    if (!selectedBundleId) {
      setPolicies([]);
      return;
    }
    try {
      setLoadingPolicies(true);
      const res = await axios.get<BundlePolicy[]>(
        `${ADMIN_API}/policy-bundles/${selectedBundleId}/policies`
      );
      setPolicies(res.data);
      setCurrentPage(1);
    } catch (err) {
      console.error("Load bundle policies error:", err);
      showToast("Unable to load policies for bundle", "error");
    } finally {
      setLoadingPolicies(false);
    }
  }, [selectedBundleId]);

  useEffect(() => {
    loadBundlePolicies();
  }, [loadBundlePolicies]);

  const selectedBundle = useMemo(
    () => bundles.find((b) => b.id === selectedBundleId) || null,
    [bundles, selectedBundleId]
  );

  // Filtered bundles for left column
  const filteredBundles = useMemo(() => {
    return bundles.filter(
      (b) =>
        b.name.toLowerCase().includes(bundleSearch.toLowerCase()) ||
        (b.description &&
          b.description.toLowerCase().includes(bundleSearch.toLowerCase()))
    );
  }, [bundles, bundleSearch]);

  // Filtered policies for right column
  const filteredPolicies = useMemo(() => {
    return policies
      .filter((p) => {
        if (activeTab === "all") return true;
        return p.ptype === activeTab;
      })
      .filter((p) => {
        if (!policySearch.trim()) return true;
        const q = policySearch.toLowerCase();
        return (
          p.permission.toLowerCase().includes(q) ||
          (p.page && p.page.toLowerCase().includes(q)) ||
          (p.module && p.module.toLowerCase().includes(q)) ||
          (p.section && p.section.toLowerCase().includes(q)) ||
          (p.field && p.field.toLowerCase().includes(q)) ||
          (p.displayName && p.displayName.toLowerCase().includes(q)) ||
          (p.route && p.route.toLowerCase().includes(q))
        );
      });
  }, [policies, activeTab, policySearch]);

  // Tab counts
  const pCount = useMemo(() => policies.filter((p) => p.ptype === "p").length, [policies]);
  const p2Count = useMemo(() => policies.filter((p) => p.ptype === "p2").length, [policies]);
  const p3Count = useMemo(() => policies.filter((p) => p.ptype === "p3").length, [policies]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPolicies.length / pageSize) || 1;
  const paginatedPolicies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPolicies.slice(start, start + pageSize);
  }, [filteredPolicies, currentPage, pageSize]);

  // Handle removing policy from bundle
  const handleRemovePolicyConfirmed = async () => {
    if (!selectedBundleId || !removePolicyTarget) return;
    try {
      setRemovingPolicy(true);
      await axios.delete(
        `${ADMIN_API}/policy-bundles/${selectedBundleId}/policies/${encodeURIComponent(
          removePolicyTarget
        )}`
      );
      showToast(`Removed policy "${removePolicyTarget}" from bundle.`);
      setRemovePolicyTarget(null);
      await loadBundlePolicies();
      await loadBundles();
    } catch (err) {
      console.error("Remove policy error:", err);
      showToast("Unable to remove policy from bundle", "error");
    } finally {
      setRemovingPolicy(false);
    }
  };

  // Inspect raw policy definitions
  const handleInspectPolicy = async (p: BundlePolicy) => {
    try {
      setLoadingInspect(true);
      const res = await axios.get<PolicyDefinition[]>(
        `${ADMIN_API}/policies/${encodeURIComponent(p.permission)}/definitions?ptype=${p.ptype}`
      );
      setInspectPolicy({
        permission: p.permission,
        definitions: res.data,
      });
    } catch (err) {
      console.error("Inspect policy error:", err);
      showToast("Unable to load policy definitions", "error");
    } finally {
      setLoadingInspect(false);
    }
  };

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

      {/* 2-Pane Master Detail Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* ============================================================ */}
        {/* Left Pane (4 cols): Policy Bundles List                     */}
        {/* ============================================================ */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Policy Bundles</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Select a bundle to inspect policies.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateBundleModal(true)}
              onClick={() => router.push("/admin/bundles/create")}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-[#C81E1E] hover:bg-red-50 transition shadow-2xs shrink-0"
              title="Create new bundle"
              title="Create new bundle (Single Page)"
            >
              + Create
            </button>
          </div>

          {/* Search bundles */}
          <div className="mt-3">
            <div className="relative">
              <input
                type="text"
                value={bundleSearch}
                onChange={(e) => setBundleSearch(e.target.value)}
                placeholder="Search policy bundles..."
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

          {/* Bundle list items */}
          <div className="mt-3 max-h-[620px] overflow-y-auto space-y-1.5 pr-1">
            {loadingBundles ? (
              <p className="py-8 text-center text-xs text-slate-400">
                Loading bundles…
              </p>
            ) : filteredBundles.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                No policy bundles found.
              </p>
            ) : (
              filteredBundles.map((b) => {
                const isSelected = selectedBundleId === b.id;

                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setSelectedBundleId(b.id);
                      setActiveTab("all");
                    }}
                    className={`flex w-full items-start justify-between gap-3 rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? "border-[#C81E1E] bg-red-50/50 shadow-xs ring-1 ring-[#C81E1E]"
                        : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold truncate ${
                            isSelected ? "text-[#C81E1E]" : "text-slate-900"
                          }`}
                        >
                          {b.name}
                        </span>
                      </div>
                      {b.description && (
                        <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">
                          {b.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          {b.policyCount} {b.policyCount === 1 ? "policy" : "policies"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {b.roleCount} {b.roleCount === 1 ? "role" : "roles"}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#C81E1E] text-white text-[10px] font-bold">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* Right Pane (8 cols): Policies List with Tabs for p, p2, p3   */}
        {/* ============================================================ */}
        <div className="lg:col-span-8 space-y-4">
          {/* Header Bar & Add Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Policy Bundle Details
                </span>
                <span className="rounded-md bg-red-100/70 px-1.5 py-0.5 text-[10px] font-extrabold text-[#C81E1E]">
                  Casbin g Mapping
                </span>
              </div>
              <h2 className="mt-0.5 text-lg font-black text-slate-900">
                {selectedBundle ? selectedBundle.name : "Select a Bundle"}
              </h2>
              <p className="text-xs text-slate-500">
                {selectedBundle?.description ||
                  "Inspect and configure section, menu, and field permissions for this bundle."}
              </p>
            </div>

            {/* Primary Action Button in Crimson Red (Scan Tag Style) */}
            <button
              type="button"
              onClick={() => setShowAddPolicyModal(true)}
              disabled={!selectedBundleId}
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
              + Add Policy to Bundle
            </button>
          </div>

          {/* Casbin RBAC Tabs: All, p (Section Access), p2 (Menu Access), p3 (Field Access) */}
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
                {policies.length}
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

          {/* Action & Filter Bar (Scan Tag Style) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={policySearch}
                onChange={(e) => {
                  setPolicySearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by permission, page, module, field..."
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

            {/* Reset */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPolicySearch("");
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
              All ({filteredPolicies.length})
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
              Active ({filteredPolicies.length})
            </button>
          </div>

          {/* Data Table with Left Vertical Color Stripe (Scan Tag Style) */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#F9FAFC] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5">Permission Name</th>
                    {activeTab === "all" && <th className="px-5 py-3.5">Type</th>}
                    {activeTab === "p" && (
                      <>
                        <th className="px-5 py-3.5">LOB</th>
                        <th className="px-5 py-3.5">Page</th>
                        <th className="px-5 py-3.5">Module</th>
                        <th className="px-5 py-3.5">Section</th>
                        <th className="px-5 py-3.5">Access</th>
                      </>
                    )}
                    {activeTab === "p2" && (
                      <>
                        <th className="px-5 py-3.5">Parent</th>
                        <th className="px-5 py-3.5">Display Name</th>
                        <th className="px-5 py-3.5">Route</th>
                      </>
                    )}
                    {activeTab === "p3" && (
                      <>
                        <th className="px-5 py-3.5">Page / Module</th>
                        <th className="px-5 py-3.5">Section</th>
                        <th className="px-5 py-3.5">Field</th>
                        <th className="px-5 py-3.5">Access</th>
                      </>
                    )}
                    {activeTab === "all" && <th className="px-5 py-3.5">Target Details</th>}
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingPolicies ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-12 text-center text-xs text-slate-400"
                      >
                        Loading policies for bundle…
                      </td>
                    </tr>
                  ) : paginatedPolicies.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <p className="text-xs font-semibold text-slate-600">
                            No {activeTab !== "all" ? `(${activeTab}) ` : ""}policies found in &ldquo;{selectedBundle?.name}&rdquo;.
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            Click &ldquo;+ Add Policy to Bundle&rdquo; to assign policies to this bundle.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowAddPolicyModal(true)}
                            className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#C81E1E] hover:bg-red-50 transition"
                          >
                            + Add Policy
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedPolicies.map((p, idx) => (
                      <tr
                        key={`${p.permission}-${idx}`}
                        className={`transition hover:bg-slate-50/80 ${
                          // Alternating left vertical stripe matching Scan Tag
                          p.ptype === "p2"
                            ? "border-l-4 border-purple-500"
                            : p.ptype === "p3"
                            ? "border-l-4 border-amber-500"
                            : "border-l-4 border-emerald-500"
                        }`}
                      >
                        {/* PERMISSION NAME */}
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                          {p.permission}
                        </td>

                        {/* TYPE (shown in All tab) */}
                        {activeTab === "all" && (
                          <td className="px-5 py-3.5">
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
                          </td>
                        )}

                        {/* p Tab Columns */}
                        {activeTab === "p" && (
                          <>
                            <td className="px-5 py-3.5 font-semibold uppercase text-slate-700">
                              {p.lob || "—"}
                            </td>
                            <td className="px-5 py-3.5 text-slate-700">{p.page || "—"}</td>
                            <td className="px-5 py-3.5 text-slate-700">{p.module || "—"}</td>
                            <td className="px-5 py-3.5 text-slate-700">{p.section || "—"}</td>
                            <td className="px-5 py-3.5">
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-800">
                                {p.access || "—"}
                              </span>
                            </td>
                          </>
                        )}

                        {/* p2 Tab Columns */}
                        {activeTab === "p2" && (
                          <>
                            <td className="px-5 py-3.5 text-slate-700">{p.parent || "—"}</td>
                            <td className="px-5 py-3.5 font-bold text-slate-900">
                              {p.displayName || "—"}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                              {p.route || "—"}
                            </td>
                          </>
                        )}

                        {/* p3 Tab Columns */}
                        {activeTab === "p3" && (
                          <>
                            <td className="px-5 py-3.5 text-slate-700">
                              {p.page} / {p.module}
                            </td>
                            <td className="px-5 py-3.5 text-slate-700">{p.section || "—"}</td>
                            <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                              {p.field || "—"}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-800">
                                {p.access || "—"}
                              </span>
                            </td>
                          </>
                        )}

                        {/* Target Details for All tab */}
                        {activeTab === "all" && (
                          <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">
                            {p.ptype === "p2"
                              ? `${p.displayName || ""} (${p.route || ""})`
                              : p.ptype === "p3"
                              ? `${p.page}/${p.module}/${p.section} • ${p.field} (${p.access})`
                              : `${p.page}/${p.module}/${p.section} (${p.access})`}
                          </td>
                        )}

                        {/* STATUS */}
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Inspect Definitions Eye button */}
                            <button
                              type="button"
                              onClick={() => handleInspectPolicy(p)}
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                              title="Inspect policy definition rules"
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

                            {/* Remove Policy from Bundle */}
                            <button
                              type="button"
                              onClick={() => setRemovePolicyTarget(p.permission)}
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition"
                              title="Remove policy from bundle"
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

            {/* Pagination Footer (Scan Tag Style) */}
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
                <span>entries per page • {filteredPolicies.length} results</span>
              </div>

              {/* Page numbers */}
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

      {/* Create Policy Bundle Modal */}
      {showCreateBundleModal && (
        <CreatePolicyBundleModal
          onClose={() => setShowCreateBundleModal(false)}
          onCreated={async (newBundleId) => {
            setShowCreateBundleModal(false);
            showToast("Created new policy bundle!");
            await loadBundles();
            if (newBundleId) {
              setSelectedBundleId(newBundleId);
            }
          }}
        />
      )}

      {/* Add Policy to Bundle Modal */}
      {showAddPolicyModal && selectedBundle && (
        <AddPolicyToBundleModal
          bundleId={selectedBundle.id}
          bundleName={selectedBundle.name}
          initialPtype={activeTab}
          onClose={() => setShowAddPolicyModal(false)}
          onAdded={async () => {
            setShowAddPolicyModal(false);
            showToast(`Added policy to bundle "${selectedBundle.name}"!`);
            await loadBundlePolicies();
            await loadBundles();
          }}
        />
      )}

      {/* Remove Policy Confirmation Dialog */}
      {removePolicyTarget && selectedBundle && (
        <ConfirmDialog
          title="Remove Policy from Bundle"
          message={`Are you sure you want to remove policy "${removePolicyTarget}" from "${selectedBundle.name}"? Roles assigned this bundle will lose this permission.`}
          confirmLabel={removingPolicy ? "Removing…" : "Remove Policy"}
          confirmDisabled={removingPolicy}
          onConfirm={handleRemovePolicyConfirmed}
          onCancel={() => setRemovePolicyTarget(null)}
        />
      )}

      {/* Inspect Policy Definitions Modal */}
      {inspectPolicy && (
        <PolicyDefinitionsModal
          title={inspectPolicy.permission}
          definitions={inspectPolicy.definitions}
          onClose={() => setInspectPolicy(null)}
        />
      )}
    </div>
  );
}

