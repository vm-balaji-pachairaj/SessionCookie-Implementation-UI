"use client";

import { useState } from "react";
import Link from "next/link";
import ScanTagNavbar from "@/component/ScanTagNavbar";
import UserRolesBundlesDashboard from "@/component/admin/UserRolesBundlesDashboard";
import PolicyBundlesPoliciesDashboard from "@/component/admin/PolicyBundlesPoliciesDashboard";
import { ChevronRightIcon } from "@/components/ui/Icons";

type AdminTab = "roles_bundles" | "bundles_policies";

export default function AdminConsolePage() {
  const [tab, setTab] = useState<AdminTab>("roles_bundles");

  return (
    <div className="min-h-screen bg-white font-sans text-neutral-900">
      {/* Top Navbar with Theme Color #C81E1E */}
      <ScanTagNavbar
        username="Admin User"
        roleName="System Admin"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Security Administration
              </span>
              <span className="text-neutral-300">•</span>
              <span className="text-xs font-semibold text-neutral-600">
                RBAC Policy Bundle Manager
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-neutral-900 tracking-tight">
              Casbin RBAC Administration
            </h1>
            <p className="mt-0.5 text-xs text-neutral-500">
              Manage system user roles, policy bundles, and granular permissions (Role → Bundle → Policies).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/admin/enforcer-checker"
              className="rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 shadow-2xs hover:bg-neutral-50 transition"
            >
              Enforcer Checker
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-neutral-900 px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-neutral-800 transition flex items-center gap-1"
            >
              <span>Dashboard</span>
              <ChevronRightIcon size={14} />
            </Link>
          </div>
        </div>

        {/* Segmented Switch (Restrained Greyish Styling) */}
        <div className="flex items-center gap-1 border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-neutral-100/80 p-1">
            <button
              type="button"
              onClick={() => setTab("roles_bundles")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                tab === "roles_bundles"
                  ? "bg-white text-neutral-900 shadow-2xs font-bold"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <span>User Roles &amp; Bundles</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  tab === "roles_bundles"
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-200 text-neutral-600"
                }`}
              >
                g3
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTab("bundles_policies")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                tab === "bundles_policies"
                  ? "bg-white text-neutral-900 shadow-2xs font-bold"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <span>Policy Bundles &amp; Permissions</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  tab === "bundles_policies"
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-200 text-neutral-600"
                }`}
              >
                p, p2, p3
              </span>
            </button>
          </div>
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
