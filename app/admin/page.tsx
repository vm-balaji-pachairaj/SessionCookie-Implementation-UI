"use client";

import { useState } from "react";
import Link from "next/link";
import ScanTagNavbar from "@/component/ScanTagNavbar";
import UserRolesBundlesDashboard from "@/component/admin/UserRolesBundlesDashboard";
import PolicyBundlesPoliciesDashboard from "@/component/admin/PolicyBundlesPoliciesDashboard";

type AdminTab = "roles_bundles" | "bundles_policies";

export default function AdminConsolePage() {
  const [tab, setTab] = useState<AdminTab>("roles_bundles");

  return (
    <div className="min-h-screen bg-[#F4F6F9] font-sans">
      {/* Top Navbar matching Scan Tag exact branding */}
      <ScanTagNavbar
        username="Admin User"
        roleName="System Admin"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        {/* Header (Scan Tag Style) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C81E1E]">
                Admin Console
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">
                RBAC Policy Bundle Manager
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-black text-slate-900 tracking-tight">
              Casbin RBAC Administration
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Manage system user roles, policy bundles, and granular permissions (Role → Bundle → Policies).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/admin/enforcer-checker"
              className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
            >
              Enforcer Checker
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
            >
              Dashboard →
            </Link>
          </div>
        </div>

        {/* Segmented Pill Tabs with Casbin RBAC terminology */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setTab("roles_bundles")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
              tab === "roles_bundles"
                ? "bg-slate-900 text-white shadow-xs"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            <span>User Roles & Bundles</span>
            <span
              className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                tab === "roles_bundles"
                  ? "bg-[#C81E1E] text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              g3
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab("bundles_policies")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
              tab === "bundles_policies"
                ? "bg-slate-900 text-white shadow-xs"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            <span>Policy Bundles & Permissions</span>
            <span
              className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                tab === "bundles_policies"
                  ? "bg-[#C81E1E] text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              p, p2, p3
            </span>
          </button>
        </div>

        {/* Dynamic Master-Detail View */}
        {tab === "roles_bundles" ? (
          <UserRolesBundlesDashboard />
        ) : (
          <PolicyBundlesPoliciesDashboard />
        )}
      </div>
    </div>
  );
}
