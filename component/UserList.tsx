"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/app/common";
import type { FieldPermission } from "@/lib/permissions";

type User = {
  id: number;
  isActive: boolean;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  department?: string | null;
};

const COLUMNS = [
  ["employeeId", "Employee ID"],
  ["firstName", "First name"],
  ["lastName", "Last name"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["role", "Role"],
  ["department", "Department"],
] as const;

export default function UserList({ fieldPermissions }: { fieldPermissions: FieldPermission[] }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const columns = COLUMNS.filter(([field]) =>
    fieldPermissions.some(
      (permission) =>
        permission.module === "userList" &&
        permission.section === "columns" &&
        permission.field === field &&
        (permission.access === "view" || permission.access === "edit"),
    ),
  );

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get<{ data: User[] }>("/user-management/users");
      setUsers(response.data.data ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <h2 className="font-semibold text-slate-900">Existing users</h2>
          <p className="mt-0.5 text-xs text-slate-500">Columns are shown only when your p3 policy grants access.</p>
        </div>
        <button onClick={() => void loadUsers()} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="px-6 py-10 text-center text-sm text-slate-400">Loading users…</p>
      ) : error ? (
        <p className="px-6 py-10 text-center text-sm text-red-600">{error}</p>
      ) : columns.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-slate-500">You can list users, but no user fields are assigned to your role.</p>
      ) : users.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-slate-400">No active users found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {columns.map(([field, label]) => <th key={field} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</th>)}
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  {columns.map(([field]) => <td key={field} className="whitespace-nowrap px-6 py-4 text-slate-700">{user[field] || "—"}</td>)}
                  <td className="px-6 py-4"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{user.isActive ? "Active" : "Inactive"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
