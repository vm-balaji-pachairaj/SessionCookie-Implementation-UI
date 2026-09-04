"use client";

import React from "react";

interface RBACHeaderProps {
  title?: string;
  subtitle?: string;
  totalRoles: number;
  totalPermissions: number;
  hasChanges?: boolean;
  changedCount?: number;
}

export default function RBACHeader({
  title = "RBAC - Role Permissions",
  subtitle = "Search, filter and manage permission access matrix across system roles.",
  totalRoles,
  totalPermissions,
  hasChanges = false,
  changedCount = 0,
}: RBACHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          {subtitle}
        </p>
      </div>

      {/* Top summary counter pills matching reference image */}
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs">
          <span>Roles</span>
          <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#C81E2B] px-1 text-[10px] font-bold text-white">
            {totalRoles}
          </span>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs">
          <span>Permissions</span>
          <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
            {totalPermissions}
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
  );
}

