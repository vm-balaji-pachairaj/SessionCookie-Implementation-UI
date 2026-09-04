"use client";

import React from "react";
import StatusBadge from "@/component/ui/StatusBadge";
import type { PermissionItem, RoleItem } from "./types";

interface PermissionsTableProps {
  permissions: { item: PermissionItem; originalIndex: number }[];
  selectedRole?: RoleItem;
  loadingPermissions: boolean;
  hasFilterOrSearch: boolean;
  onPermissionChange: (
    permissionIndex: number,
    field: "access" | "assigned",
    value: string | boolean,
  ) => void;
}

export default function PermissionsTable({
  permissions,
  selectedRole,
  loadingPermissions,
  hasFilterOrSearch,
  onPermissionChange,
}: PermissionsTableProps) {
  return (
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

          {!loadingPermissions && selectedRole && permissions.length === 0 && (
            <tr>
              <td colSpan={8} className="py-12 text-center text-slate-400">
                {hasFilterOrSearch
                  ? "No permissions match your search or filter."
                  : "No permissions configured for this role."}
              </td>
            </tr>
          )}

          {!loadingPermissions &&
            permissions.map(({ item, originalIndex }) => {
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
                        onPermissionChange(originalIndex, "access", e.target.value.toLowerCase())
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
                        onPermissionChange(originalIndex, "assigned", e.target.value === "assigned")
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

                  {/* Actions column */}
                  <td className="py-3 pl-3 pr-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Toggle Access button */}
                      <button
                        type="button"
                        title={`Switch access to ${item.access === "edit" ? "view" : "edit"}`}
                        onClick={() =>
                          onPermissionChange(
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
                          onPermissionChange(originalIndex, "assigned", !item.assigned)
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
  );
}

