"use client";

import { useState } from "react";

interface Permission {
  permission: string;
  module: string;
  section: string;
  access: string;
}

interface SearchPageProps {
  permissions?: Permission[];
}

interface User {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  department: string;
  isActive: boolean;
}

export default function SearchPage({
  permissions = [],
}: SearchPageProps) {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

    const canSearch = permissions.some(
    (p) => p.permission === "userManagement-search"
    );

  async function handleSearch() {
  if (!query.trim() || !canSearch) {
    return;
  }

  try {
    setLoading(true);
    setError("");
    setSearched(true);

    const response = await fetch(
      `http://localhost:5000/api/user-management/users?search=${encodeURIComponent(
        query.trim(),
      )}`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result?.message || `Search failed (${response.status})`,
      );
    }

    setUsers(result.data ?? []);
  } catch (err) {
    console.error("Search error:", err);

    setUsers([]);

    setError(
      err instanceof Error
        ? err.message
        : "Unable to search users.",
    );
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="space-y-6">

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
          User Management
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Search
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Search users from the database.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <h2 className="mb-4 font-semibold text-slate-900">
          Search Users
        </h2>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter employee ID, first name or last name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && handleSearch()
            }
            disabled={!canSearch || loading}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm"
          />

          <button
            onClick={handleSearch}
            disabled={
              !canSearch ||
              !query.trim() ||
              loading
            }
            className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {!canSearch && (
          <p className="mt-3 text-xs text-red-500">
            You do not have permission to search users.
          </p>
        )}

        {error && (
          <p className="mt-3 text-xs text-red-500">
            {error}
          </p>
        )}
      </section>

      {searched && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="font-semibold text-slate-900">
              Results
            </h2>

            <span className="text-xs text-slate-400">
              {users.length} user
              {users.length !== 1 ? "s" : ""} found
            </span>
          </div>

          {users.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">
              No users match your search.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Employee ID
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Name
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Email
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Role
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                      {user.employeeId}
                    </td>

                    <td className="px-6 py-4 font-medium text-slate-800">
                      {user.firstName} {user.lastName}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {user.email}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {user.role}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {user.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </section>
      )}
    </div>
  );
}