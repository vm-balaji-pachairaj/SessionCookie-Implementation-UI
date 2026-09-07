"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import ScanTagNavbar from "@/component/ScanTagNavbar";
import PolicyResourceHierarchy, {
  HierarchyCounts,
} from "@/component/admin/PolicyResourceHierarchy";

const ADMIN_API = "http://localhost:5000/api/admin";

export default function CreatePolicyBundleSinglePage() {
  const router = useRouter();

  // Bundle metadata state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Hierarchy selection & counts state
  const [selectedPolicies, setSelectedPolicies] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState<HierarchyCounts>({
    sections: 0,
    menus: 0,
    fields: 0,
    total: 0,
  });

  // Submission state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Submit and create bundle
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
                Policy Bundle Creator
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-black text-slate-900 tracking-tight">
              Create New Policy Bundle
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Configure Section, Menu, and Field resource permissions with cascading hierarchy.
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
              {saving
                ? "Creating Bundle…"
                : `Create Bundle (${selectedPolicies.size} Selected)`}
            </button>
          </div>
        </div>

        {/* Error banner */}
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
                placeholder="e.g. Sales Executive Bundle"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#C81E1E] focus:bg-white focus:ring-1 focus:ring-[#C81E1E]"
                autoFocus
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Unique identifier for Casbin g rules (assigned to roles via g3).
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
        {/* Step 2: Hierarchical Policy Selection Tree                  */}
        {/* ============================================================ */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-red-100 text-[#C81E1E] text-xs font-black">
                2
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Select Policies by Resource Hierarchy
                </h2>
                <p className="text-xs text-slate-500">
                  Cascading selection: Section (p) → Menu (p2) → Field (p3). Deselecting parent hides & deselects children.
                </p>
              </div>
            </div>
          </div>

          {/* Unified Hierarchy Component */}
          <PolicyResourceHierarchy
            mode="create"
            selectedPolicies={selectedPolicies}
            onChange={(sel) => setSelectedPolicies(sel)}
            onCountsChange={(c) => setCounts(c)}
          />
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
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              {counts.sections} Sections
            </span>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">
              {counts.menus} Menus
            </span>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
              {counts.fields} Fields
            </span>
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-black text-[#C81E1E]">
              {selectedPolicies.size} Total
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
              {saving
                ? "Creating Bundle…"
                : `Create Policy Bundle (${selectedPolicies.size} Policies)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
