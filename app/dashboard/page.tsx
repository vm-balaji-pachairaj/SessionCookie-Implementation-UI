"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import api from "../common";
import IdleTimer from "@/component/IdleTimer";
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import ViewPermissions from "@/component/ViewPermissions";
import Sidebar from "@/component/Sidebar";
import MenuPageRenderer from "@/component/MenuPageRenderer";
import { setMenus } from "../store/menuSlice";
import { setPermissions } from "../store/permissionsSlice";
import { useDispatch } from "react-redux";
import { clearPermissions } from "../store/permissionsSlice";
import { clearMenus } from "../store/menuSlice";

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

interface Permission {
  permission: string;
  lob: string;
  page: string;
  module: string;
  section: string;
  access: string;
}

interface DashboardResponse {
  message: string;
  currentRole: Role[];
  user: {
    id: string;
    username: string;
  };
  permissions: Permission[];
  menus: string[];
  landingPage: string[][];
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

interface TestLoggerResponse {
  success: boolean;
  message: string;
  logSeverity: 'info' | 'debug' | 'warn' | 'error';
  timestamp: string;
  statusCode: number;
}

export default function DashboardPage() {
    const {
    isIdle,
    remainingTime,
    totalWarningTime,
  } = useIdleTimeout();
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState<DashboardResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [testLoggerData, setTestLoggerData] =
    useState<TestLoggerResponse | null>(null);
  const [testLoggerLoading, setTestLoggerLoading] = useState(false);
  const [activeNav, setActiveNav] = useState("");

  const dispatch = useDispatch();
  // ── Axios error helper ────────────────────────────────────────
  function errMsg(e: unknown, fallback: string) {
    if (e && typeof e === "object" && "response" in e) {
      const r = (e as { response?: { data?: { message?: string }; status?: number } }).response;
      if (r?.status === 401) return null; // signal 401
      return r?.data?.message ?? fallback;
    }
    return fallback;
  }

  // ============================================================
  // Fetch dashboard
  // ============================================================

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await api.get<DashboardResponse>("/dashboard");
      setData(response.data);
      dispatch(setPermissions(response.data.permissions));   
      dispatch(setMenus(response.data.menus)); 

      setSelectedRole(response.data.role_id);
      // Set active nav to the current route on first load, then fall back to the landing page.
      if (!activeNav) {
        setActiveNav(
          response.data.landingPage?.[0]?.[2] ||
            response.data.menus?.[0] ||
            ""
        );
      }
    } catch (error: unknown) {
      console.error("Dashboard error:", error);
      const msg = errMsg(error, "Unable to load dashboard.");
      if (msg === null) { router.push("/login"); return; }
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Initial load
  // ============================================================

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setMessage("");
        const response = await api.get<DashboardResponse>("/dashboard");
        dispatch(setMenus(response.data.menus));
        dispatch(setPermissions(response.data.permissions)); 
        if (cancelled) return;
        setData(response.data);
        setSelectedRole(response.data.role_id);
        setActiveNav((prev) => {
          if (prev) return prev;

          const currentMenu = response.data.menus?.find(
            (menu) => `/${menu}` === pathname
          );

          return (
            currentMenu ||
            response.data.landingPage?.[0]?.[2] ||
            response.data.menus?.[0] ||
            ""
          );
        });
      } catch (error: unknown) {
        if (cancelled) return;
        console.error("Dashboard error:", error);
        const msg = errMsg(error, "Unable to load dashboard.");
        if (msg === null) { router.push("/login"); return; }
        setMessage(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch (error: unknown) {
      console.error("Refresh error:", error);
      setMessage(errMsg(error, "Session expired. Please login again.") ?? "Session expired. Please login again.");
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

    // /changerole already returns permissions + menus directly —
    // no need to call /dashboard again at all
    const changeRoleRes = await api.post("/changerole", {
      user_role_mapping_id: role.user_role_mapping_id,
      role_id: role.role_id,
    });

    dispatch(setMenus(changeRoleRes.data.menus));
    dispatch(setPermissions(changeRoleRes.data.permissions));

    setData((prev) => prev ? {
      ...prev,
      currentRole: changeRoleRes.data.currentRole ?? prev.currentRole,
      permissions: changeRoleRes.data.permissions,
      menus: changeRoleRes.data.menus,
      landingPage: changeRoleRes.data.landingPage,
    } : prev);

    setSelectedRole(role.role_id);

    const landingKey =
      changeRoleRes.data.landingPage?.[0]?.[2] ??
      changeRoleRes.data.menus?.[0] ??
      "";

    setActiveNav(landingKey);
    router.push(`/${landingKey}`);
    setMessage(`Role changed to ${role.role_master?.role_name || "selected role"}.`);
  } catch (error: unknown) {
    console.error("Role change error:", error);
    setMessage(errMsg(error, "Unable to change role.") ?? "Unable to change role.");
  }
  };

  const handleNavClick = (key: string) => {
    setActiveNav(key);
    // router.push(`/${key}`);
  };

  // ============================================================
  // Logout
  // ============================================================

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await api.post("/logout");
      dispatch(clearPermissions());
      dispatch(clearMenus());
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
  // Test Logger
  // ============================================================

  const handleTestLogger = async () => {
    try {
      setTestLoggerLoading(true);
      setMessage("");

      const response = await api.post<TestLoggerResponse>("/test-logger");

      setTestLoggerData(response.data);
      setMessage(response.data.message);
    } catch (error: any) {
      console.error("Test logger error:", error);

      setMessage(error?.response?.data?.message || "Failed to test logger.");
      setTestLoggerData(null);
    } finally {
      setTestLoggerLoading(false);
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

  const currentRoleName =
    data?.currentRole?.find((r) => r.role_id === selectedRole)
      ?.role_master?.role_name ?? undefined;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ======================================================
          Sidebar
      ====================================================== */}

      <Sidebar
        username={data?.user?.username}
        ntId={data?.user?.id}
        currentRoleName={currentRoleName}
        selectedRoleId={selectedRole}
        roles={data?.currentRole}
        onRoleChange={handleRoleChange}
        activeKey={activeNav}
        onNavClick={handleNavClick}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />

      {/* ======================================================
          Main content
      ====================================================== */}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between px-6 py-5">
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
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8">

        {/* Message */}
        {message && (
          <div className="mb-6 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-700">
            {message}
          </div>
        )}

        {/* Non-dashboard menu pages */}
        {activeNav && activeNav !== "dashboard" ? (
            <MenuPageRenderer
              activeKey={activeNav}
              permissions={data?.permissions}
            />
          ) : (
        <>

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

          {/* View Permissions */}
          <ViewPermissions permissions={data?.permissions} />

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
              Test Logger
          ================================================== */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                📝
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">Test Logger</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add a log with random severity level.
                </p>
              </div>
            </div>

            <button
              onClick={handleTestLogger}
              disabled={testLoggerLoading}
              className="mt-6 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-600/20 transition hover:bg-amber-500 disabled:opacity-50"
            >
              {testLoggerLoading ? "Testing..." : "Add Log Entry"}
            </button>

            {/* Log Result Display */}
            {testLoggerData && (
              <div className="mt-6 space-y-3 border-t border-slate-100 pt-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white ${
                      testLoggerData.logSeverity === "info"
                        ? "bg-blue-600"
                        : testLoggerData.logSeverity === "debug"
                          ? "bg-gray-600"
                          : testLoggerData.logSeverity === "warn"
                            ? "bg-yellow-600"
                            : "bg-red-600"
                    }`}
                  >
                    {testLoggerData.logSeverity.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      Log Severity
                    </p>

                    <p className="text-xs text-slate-500">
                      {testLoggerData.logSeverity.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-medium text-slate-500">
                    Status Code
                  </p>

                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      testLoggerData.statusCode === 200 ||
                      testLoggerData.statusCode === 202
                        ? "bg-green-100 text-green-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {testLoggerData.statusCode}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-medium text-slate-500">
                    Timestamp
                  </p>

                  <p className="truncate text-right text-xs font-mono text-slate-700">
                    {new Date(testLoggerData.timestamp).toLocaleTimeString()}
                  </p>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-medium text-slate-500">Message</p>

                  <p className="mt-1 text-sm text-slate-700">
                    {testLoggerData.message}
                  </p>
                </div>
              </div>
            )}
          </section>

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
        </>
        )}
        </div>
      </div>
    </div>
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
