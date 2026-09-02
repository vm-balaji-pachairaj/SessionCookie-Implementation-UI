"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import RolePermissionsPanel from "@/component/admin/RolePermissionsPanel";

export default function RolePermissionsPage() {
  const params = useParams<{ role: string }>();
  const role = decodeURIComponent(params.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
              Admin / User Roles
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              {role}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              View, add and remove policies assigned to this role.
            </p>
          </div>

          <Link
            href="/admin"
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
          >
            ← Admin Console
          </Link>
        </div>

        <RolePermissionsPanel role={role} />
      </div>
    </div>
  );
}
