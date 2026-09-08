"use client";

import { useState } from "react";
import { SearchIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

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

export default function SearchPage({ permissions = [] }: SearchPageProps) {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSearch = permissions.some(
    (p) => p.permission === "userManagement-search"
  );

  async function handleSearch() {
    if (!query.trim() || !canSearch) return;

    try {
      setLoading(true);
      setError("");
      setSearched(true);

      const response = await fetch(
        `http://localhost:5000/api/user-management/users?search=${encodeURIComponent(
          query.trim()
        )}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || `Search failed (${response.status})`);
      }

      setUsers(result.data ?? []);
    } catch (err) {
      console.error("Search error:", err);
      setUsers([]);
      setError(
        err instanceof Error ? err.message : "Unable to search users."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-100 pb-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          Directory Services
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">
          User Search
        </h1>
        <p className="mt-0.5 text-xs text-neutral-500">
          Query system users across employee identifier, first name, and last name.
        </p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xs">
        <h2 className="text-sm font-bold text-neutral-900 mb-3">
          Find Employee
        </h2>

        <div className="flex gap-2.5 max-w-xl">
          <input
            type="text"
            placeholder="Enter employee ID, first name, or last name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            disabled={!canSearch || loading}
            className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50/50 px-3.5 py-2 text-xs text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-neutral-400 focus:bg-white focus:ring-1 focus:ring-neutral-400 disabled:opacity-50"
          />

          <Button
            variant="primary"
            size="md"
            onClick={handleSearch}
            disabled={!canSearch || !query.trim()}
            isLoading={loading}
            leftIcon={<SearchIcon size={14} />}
          >
            Search
          </Button>
        </div>

        {!canSearch && (
          <p className="mt-3 text-xs text-red-500">
            You do not have permission to search users.
          </p>
        )}

        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
      </section>

      {searched && (
        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
            <h2 className="text-sm font-bold text-neutral-900">Search Results</h2>
            <span className="text-xs text-neutral-400 font-medium">
              {users.length} {users.length === 1 ? "user" : "users"} found
            </span>
          </div>

          {users.length === 0 ? (
            <p className="px-6 py-12 text-center text-xs text-neutral-400">
              No users matched your query.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    <th className="px-6 py-3.5">Employee ID</th>
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-neutral-50/70 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-semibold text-neutral-900">
                        {user.employeeId}
                      </td>
                      <td className="px-6 py-4 font-bold text-neutral-800">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="px-6 py-4 text-neutral-600 font-mono text-[11px]">
                        {user.email || "—"}
                      </td>
                      <td className="px-6 py-4 text-neutral-600">
                        {user.role || "—"}
                      </td>
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
      )}
    </div>
  );
}