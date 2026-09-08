"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/app/common";
import type { FieldPermission } from "@/lib/permissions";
import { RefreshIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

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
  ["firstName", "First Name"],
  ["lastName", "Last Name"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["role", "Role"],
  ["department", "Department"],
] as const;

export default function UserList({
  fieldPermissions,
}: {
  fieldPermissions: FieldPermission[];
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const columns = COLUMNS.filter(([field]) =>
    fieldPermissions.some(
      (permission) =>
        permission.module === "userList" &&
        permission.section === "columns" &&
        permission.field === field &&
        (permission.access === "view" || permission.access === "edit")
    )
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
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xs">
      <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
        <div>
          <h2 className="text-sm font-bold text-neutral-900 tracking-tight">
            Existing Users Directory
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Columns are dynamically gated according to your Casbin p3 field policies.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void loadUsers()}
          isLoading={loading}
          leftIcon={<RefreshIcon size={14} />}
        >
          Refresh
        </Button>
      </div>

      {loading ? (
        <p className="px-6 py-12 text-center text-xs text-neutral-400">
          Loading users…
        </p>
      ) : error ? (
        <p className="px-6 py-12 text-center text-xs text-red-600">{error}</p>
      ) : columns.length === 0 ? (
        <p className="px-6 py-12 text-center text-xs text-neutral-500">
          You can list users, but no user fields are assigned to your role.
        </p>
      ) : users.length === 0 ? (
        <p className="px-6 py-12 text-center text-xs text-neutral-400">
          No users found in database.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                {columns.map(([field, label]) => (
                  <th key={field} className="px-6 py-3.5">
                    {label}
                  </th>
                ))}
                <th className="px-6 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-neutral-50/70 transition-colors"
                >
                  {columns.map(([field]) => (
                    <td
                      key={field}
                      className="whitespace-nowrap px-6 py-4 text-neutral-700 font-medium"
                    >
                      {field === "employeeId" ? (
                        <span className="font-mono text-neutral-900 font-semibold">
                          {user[field as keyof User] as string || "—"}
                        </span>
                      ) : (
                        (user[field as keyof User] as string) || "—"
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    <Badge
                      variant={user.isActive ? "success" : "neutral"}
                      dot
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
