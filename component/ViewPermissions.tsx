"use client";

import { useState } from "react";

interface Permission {
  permission: string;
  lob: string;
  page: string;
  module: string;
  section: string;
  access: string;
}

interface ViewPermissionsProps {
  permissions: Permission[] | undefined;
}

export default function ViewPermissions({ permissions }: ViewPermissionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            🔑
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">Permissions</h2>

            <p className="mt-1 text-sm text-slate-500">
              View all permissions assigned to the current role.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          disabled={!permissions || permissions.length === 0}
          className="mt-6 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-500/20 transition hover:bg-amber-400 disabled:opacity-50"
        >
          View Permissions
        </button>
      </section>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Permissions
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {permissions?.length ?? 0} permission
                  {permissions?.length !== 1 ? "s" : ""} assigned
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto max-h-[calc(80vh-72px)] px-6 py-4">
              {!permissions || permissions.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  No permissions found.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                        #
                      </th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Permission
                      </th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Page
                      </th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Module
                      </th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Section
                      </th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                        LOB
                      </th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Access
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {permissions.map((perm, idx) => (
                      <tr key={perm.permission} className="hover:bg-slate-50">
                        <td className="py-3 pr-4 text-xs text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs text-slate-700 max-w-[200px] truncate">
                          {perm.permission}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {perm.page}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {perm.module}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {perm.section}
                        </td>
                        <td className="py-3 pr-4 text-slate-700 uppercase text-xs">
                          {perm.lob}
                        </td>
                        <td className="py-3">
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            {perm.access}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
