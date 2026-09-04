"use client";

import React, { useState } from "react";
import type { RoleItem } from "./types";

interface RoleSidebarProps {
  roles: RoleItem[];
  selectedIndex: number;
  currentRoleId?: string | null;
  loadingRoles: boolean;
  rolesError: string | null;
  onRoleClick: (index: number) => void;
}

export default function RoleSidebar({
  roles,
  selectedIndex,
  currentRoleId,
  loadingRoles,
  rolesError,
  onRoleClick,
}: RoleSidebarProps) {
  const [roleSearch, setRoleSearch] = useState("");

  const filteredRoles = roles
    .map((role, idx) => ({ role, idx }))
    .filter(({ role }) => {
      const name = role.role ?? role.role_name ?? `Role ${role.role_id}`;
      return name.toLowerCase().includes(roleSearch.toLowerCase());
    });

  return (
    <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="mb-3 px-1">
        <h2 className="text-sm font-bold text-slate-900">Roles</h2>
        <p className="text-xs text-slate-400">Select a role to inspect matrix.</p>
      </div>

      {/* Role search input */}
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
        {loadingRoles && (
          <p className="p-3 text-center text-xs text-slate-400">Loading roles...</p>
        )}
        {rolesError && (
          <p className="p-3 text-xs text-red-500">{rolesError}</p>
        )}
        {!loadingRoles && !rolesError && roles.length === 0 && (
          <p className="p-3 text-center text-xs text-slate-400">No roles found.</p>
        )}

        {filteredRoles.map(({ role, idx }) => {
          const name = role.role ?? role.role_name ?? `Role ${role.role_id}`;
          const isSelected = idx === selectedIndex;
          const isCurrent = String(role.role_id) === currentRoleId;

          return (
            <button
              key={`${role.role_id ?? name}-${idx}`}
              type="button"
              onClick={() => onRoleClick(idx)}
              className={`w-full flex items-center gap-3 rounded-xl p-2.5 text-left text-xs transition cursor-pointer ${
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
  );
}

