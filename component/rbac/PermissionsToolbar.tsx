"use client";

import React from "react";
import type { FilterCounts, FilterTab } from "./types";

interface PermissionsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: FilterTab;
  onFilterChange: (filter: FilterTab) => void;
  counts: FilterCounts;
  hasChanges: boolean;
  changedCount: number;
  updatingPermissions: boolean;
  loadingPermissions: boolean;
  onUpdate: () => void;
  onReset: () => void;
}

export default function PermissionsToolbar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  counts,
  hasChanges,
  changedCount,
  updatingPermissions,
  loadingPermissions,
  onUpdate,
  onReset,
}: PermissionsToolbarProps) {
  return (
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
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by LOB, page, module, section, access..."
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs font-medium text-slate-700 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition shadow-2xs placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Reset Button */}
        <button
          type="button"
          onClick={onReset}
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
          onClick={onUpdate}
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
          onClick={() => onFilterChange("all")}
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
          onClick={() => onFilterChange("assigned")}
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
          onClick={() => onFilterChange("unassigned")}
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
          onClick={() => onFilterChange("edit")}
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
          onClick={() => onFilterChange("view")}
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
  );
}

