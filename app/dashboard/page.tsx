"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../common";
import IdleTimer from "@/component/IdleTimer";
import { useIdleTimeout } from '@/hooks/useIdleTimeout';

interface Role {
  user_role_mapping_id: string;
  nt_id: string;
  role_id: string;
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  role_master?: {
    role_name?: string;
    short_name?: string;
  };
}

interface DashboardResponse {
  message: string;
  currentRole: Role[];
  user: {
    id: string;
    username: string;
  };
  role_id: string;
}

interface RefreshResponse {
  message: string;
  userDetails: {
    nt_id: string;
    userDetails: string;
    role_name?: string;
    short_name?: string;
    is_active: boolean;
  };
  role_id?: string;
  user_role_mapping_id?: string;
}

export default function DashboardPage() {
    const {
    isIdle,
    remainingTime,
    totalWarningTime,
  } = useIdleTimeout();
  const router = useRouter();

  const [data, setData] = useState<DashboardResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const [message, setMessage] = useState("");

  // ============================================================
  // Fetch dashboard
  // ============================================================

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await api.get<DashboardResponse>("/dashboard");

      setData(response.data);

      setSelectedRole(response.data.role_id);
      // Find current role from token-backed response
      if (response.data.currentRole?.length) {
      }
    } catch (error: any) {
      console.error("Dashboard error:", error);

      if (error?.response?.status === 401) {
        router.push("/login");
        return;
      }

      setMessage(error?.response?.data?.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Initial load
  // ============================================================

  useEffect(() => {
    fetchDashboard();
  }, []);

  // ============================================================
  // Refresh access token manually
  // ============================================================

  const handleRefreshToken = async () => {
    try {
      setRefreshing(true);
      setMessage("");

      const response = await api.post<RefreshResponse>("/refresh");

      setMessage(
        response.data.message || "Access token refreshed successfully.",
      );

      await fetchDashboard();
    } catch (error: any) {
      console.error("Refresh error:", error);

      setMessage(
        error?.response?.data?.message ||
          "Session expired. Please login again.",
      );

      router.push("/login");
    } finally {
      setRefreshing(false);
    }
  };

  // ============================================================
  // Change role
  // ============================================================

  const handleRoleChange = async (role: Role) => {
    try {
      setSelectedRole(role.role_id);
      setMessage("");

      await api.post("/changerole", {
        user_role_mapping_id: role.user_role_mapping_id,

        role_id: role.role_id,
      });

      setMessage(
        `Role changed to ${role.role_master?.role_name || "selected role"}.`,
      );

      // Reload dashboard/current user
      await fetchDashboard();
    } catch (error: any) {
      console.error("Role change error:", error);

      setMessage(error?.response?.data?.message || "Unable to change role.");

      // Restore dashboard state
      await fetchDashboard();
    }
  };

  // ============================================================
  // Logout
  // ============================================================

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await api.post("/logout");

      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);

      // Even if API fails, don't keep user on dashboard
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  // ============================================================
  // Loading
  // ============================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />

          <p className="text-sm text-slate-500">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  // ============================================================
  // Dashboard
  // ============================================================

  return (
    <main className="min-h-screen bg-slate-50">
      {/* ======================================================
          Header
      ====================================================== */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
              Overview
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your application and API session.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection */}
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              API Connected
            </div>

            {isIdle && (
              <IdleTimer
                remainingTime={remainingTime}
                totalWarningTime={totalWarningTime}
              />
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 disabled:opacity-50"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================
          Content
      ====================================================== */}

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Message */}
        {message && (
          <div className="mb-6 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-700">
            {message}
          </div>
        )}

        {/* ====================================================
            Top cards
        ==================================================== */}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Dashboard API */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                ↗
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">Dashboard API</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Fetch the latest dashboard information from the backend.
                </p>
              </div>
            </div>

            <button
              onClick={fetchDashboard}
              className="mt-6 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-600/20 transition hover:bg-violet-500"
            >
              Call Dashboard API
            </button>
          </section>

          {/* Access Token */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                ↻
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">Access Token</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Generate a new access token using your refresh token.
                </p>
              </div>
            </div>

            <button
              onClick={handleRefreshToken}
              disabled={refreshing}
              className="mt-6 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "Refresh Access Token"}
            </button>
          </section>
        </div>

        {/* ====================================================
            Main grid
        ==================================================== */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* ==================================================
              Role selector
          ================================================== */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Select Role</h2>

              <p className="mt-1 text-sm text-slate-500">
                Choose the role you want to continue with.
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {data?.currentRole?.map((role) => {
                const isSelected = selectedRole === role.role_id;

                const roleName = role.role_master?.role_name || "Unknown Role";

                return (
                  <button
                    key={role.user_role_mapping_id}
                    onClick={() => handleRoleChange(role)}
                    className={`rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100"
                        : "border-slate-200 bg-white hover:border-violet-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${
                          isSelected
                            ? "bg-violet-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {roleName.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {roleName}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          Role ID: {role.role_id}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-xs text-slate-500">
                      {role.role_master?.short_name || roleName}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Current role */}
            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="text-xs font-medium text-slate-400">Current Role</p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {data?.currentRole?.find(
                  (role) => role.role_id === selectedRole,
                )?.role_master?.role_name || "No role selected"}
              </p>
            </div>
          </section>

          {/* ==================================================
              Current User
          ================================================== */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Current User</h2>

              <button
                onClick={fetchDashboard}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
              >
                Refresh
              </button>
            </div>

            <div className="mt-5 divide-y divide-slate-100">
              <InfoRow label="NT ID" value={data?.user?.id || "-"} />

              <InfoRow label="Username" value={data?.user?.username || "-"} />

              <InfoRow
                label="Role"
                value={
                  data?.currentRole?.find(
                    (role) => role.role_id === selectedRole,
                  )?.role_master?.role_name || "-"
                }
              />

              <InfoRow label="Role ID" value={selectedRole || "-"} />

              <InfoRow
                label="Role Mapping ID"
                value={
                  data?.currentRole?.find(
                    (role) => role.role_id === selectedRole,
                  )?.user_role_mapping_id || "-"
                }
              />

              <InfoRow label="Token Type" value="access" />

              <InfoRow
                label="Active"
                value={
                  data?.currentRole?.find(
                    (role) => role.role_id === selectedRole,
                  )?.is_active
                    ? "Yes"
                    : "No"
                }
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

// ============================================================
// Reusable information row
// ============================================================

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <span className="text-sm font-medium text-slate-500">{label}</span>

      <span className="truncate text-right text-sm font-semibold text-slate-900">
        {value}
      </span>
    </div>
  );
}
