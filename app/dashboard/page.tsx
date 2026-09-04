"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import api from "../common";
import IdleTimer from "@/component/IdleTimer";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import Sidebar from "@/component/Sidebar";
import ScanTagNavbar from "@/component/ScanTagNavbar";
import UserRolesBundlesDashboard from "@/component/admin/UserRolesBundlesDashboard";
import PolicyBundlesPoliciesDashboard from "@/component/admin/PolicyBundlesPoliciesDashboard";
import MenuPageRenderer, {
  isDashboardHome,
} from "@/component/MenuPageRenderer";
import { setMenus } from "../store/menuSlice";
import { setPermissions, setFieldPermissions } from "../store/permissionsSlice";
import { useDispatch } from "react-redux";
import {
  clearPermissions,
  clearFieldPermissions,
} from "../store/permissionsSlice";
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

interface FieldPermission {
  permission: string;
  lob: string;
  page: string;
  module: string;
  section: string;
  field: string;
  access: string;
}

interface MenuInfo {
  key: string;
  lob: string;
  parent: string;
  displayName: string;
  route: string;
  icon: string;
  order: number;
}

interface DashboardResponse {
  message: string;
  currentRole: Role[];
  user: {
    id: string;
    username: string;
  };
  permissions: Permission[];
  fieldPermissions: FieldPermission[];
  menus: MenuInfo[];
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

export default function DashboardPage() {
  const { isIdle, remainingTime, totalWarningTime } = useIdleTimeout();
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [activeNav, setActiveNav] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Redesigned dashboard segmented tabs: "roles_bundles" vs. "bundles_policies"
  const [dashboardTab, setDashboardTab] = useState<
    "roles_bundles" | "bundles_policies"
  >("roles_bundles");

  // Optional collapsible drawer for developer API session tools
  const [showSessionTools, setShowSessionTools] = useState(false);

  const dispatch = useDispatch();

  function errMsg(e: unknown, fallback: string) {
    if (e && typeof e === "object" && "response" in e) {
      const r = (
        e as { response?: { data?: { message?: string }; status?: number } }
      ).response;
      if (r?.status === 401) return null;
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
      dispatch(setFieldPermissions(response.data.fieldPermissions));
      dispatch(setMenus(response.data.menus));

      setSelectedRole(response.data.role_id);
      if (!activeNav) {
        setActiveNav(
          response.data.landingPage?.[0]?.[2] ||
            response.data.menus?.[0]?.key ||
            "dashboard"
        );
      }
    } catch (error: unknown) {
      console.error("Dashboard error:", error);
      const msg = errMsg(error, "Unable to load dashboard.");
      if (msg === null) {
        router.push("/login");
        return;
      }
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
        dispatch(setFieldPermissions(response.data.fieldPermissions));
        if (cancelled) return;
        setData(response.data);
        setSelectedRole(response.data.role_id);
        setActiveNav((prev) => {
          if (prev) return prev;

          const currentMenu = response.data.menus?.find(
            (menu) => menu.route === pathname || `/${menu.key}` === pathname
          );

          return (
            currentMenu?.key ||
            response.data.landingPage?.[0]?.[2] ||
            response.data.menus?.[0]?.key ||
            "dashboard"
          );
        });
      } catch (error: unknown) {
        if (cancelled) return;
        console.error("Dashboard error:", error);
        const msg = errMsg(error, "Unable to load dashboard.");
        if (msg === null) {
          router.push("/login");
          return;
        }
        setMessage(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [dispatch, pathname, router]);

  // ============================================================
  // Refresh token
  // ============================================================

  const handleRefreshToken = async () => {
    try {
      setRefreshing(true);
      setMessage("");

      const response = await api.post<RefreshResponse>("/refresh");
      setMessage(
        response.data.message || "Access token refreshed successfully."
      );
      await fetchDashboard();
    } catch (error: unknown) {
      console.error("Refresh error:", error);
      setMessage(
        errMsg(error, "Session expired. Please login again.") ??
          "Session expired. Please login again."
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

      const changeRoleRes = await api.post("/changerole", {
        user_role_mapping_id: role.user_role_mapping_id,
        role_id: role.role_id,
      });

      dispatch(setMenus(changeRoleRes.data.menus));
      dispatch(setPermissions(changeRoleRes.data.permissions));
      dispatch(setFieldPermissions(changeRoleRes.data.fieldPermissions));

      setData((prev) =>
        prev
          ? {
              ...prev,
              permissions: changeRoleRes.data.permissions,
              fieldPermissions: changeRoleRes.data.fieldPermissions,
              menus: changeRoleRes.data.menus,
              landingPage: changeRoleRes.data.landingPage,
            }
          : prev
      );

      setSelectedRole(role.role_id);
      setMessage(
        `Active session switched to ${
          role.role_master?.role_name || "selected role"
        }.`
      );
    } catch (error: unknown) {
      console.error("Role change error:", error);
      setMessage(
        errMsg(error, "Unable to change role.") ?? "Unable to change role."
      );
    }
  };

  const handleNavClick = (key: string) => {
    setActiveNav(key);
  };

  // ============================================================
  // Logout
  // ============================================================

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await api.post("/logout");
      dispatch(clearPermissions());
      dispatch(clearFieldPermissions());
      dispatch(clearMenus());
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#C81E1E]" />
          <p className="text-xs font-semibold text-slate-500">
            Loading Casbin RBAC Portal…
          </p>
        </div>
      </main>
    );
  }

  const currentRoleName =
    data?.currentRole?.find((r) => r.role_id === selectedRole)?.role_master
      ?.role_name ?? "RBAC Administrator";

  return (
    <div className="flex min-h-screen bg-[#F4F6F9]">
      {/* ======================================================
          Collapsible Sidebar
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
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
      />

      {/* ======================================================
          Main Content Column
      ====================================================== */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Navbar with Casbin RBAC branding */}
        <ScanTagNavbar
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
          username={data?.user?.username || "Security Admin"}
          roleName={currentRoleName}
          onLogout={handleLogout}
        />

        {/* Scrollable Page Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Status / Alert Banner */}
          {message && (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50/70 px-4 py-2.5 text-xs font-semibold text-red-700">
              <span>{message}</span>
              <button
                type="button"
                onClick={() => setMessage("")}
                className="text-red-400 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          )}

          {/* Idle Timeout Warning */}
          {isIdle && (
            <div className="mb-4">
              <IdleTimer
                remainingTime={remainingTime}
                totalWarningTime={totalWarningTime}
              />
            </div>
          )}

          {/* If another menu item like User Management or Search is selected */}
          {activeNav && !isDashboardHome(activeNav) ? (
            <MenuPageRenderer
              activeKey={activeNav}
              permissions={data?.permissions}
              fieldPermissions={data?.fieldPermissions}
            />
          ) : (
            <>
              {/* ====================================================
                  Casbin RBAC Page Header & Segmented Pill Switch
              ==================================================== */}
              <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#C81E1E]">
                      Access Control
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-medium text-slate-500">
                      Casbin RBAC Matrix
                    </span>
                  </div>
                  <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                    Role & Policy Management
                  </h1>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    Search, filter and manage user roles, policy bundles, and granular permission access rules.
                  </p>
                </div>

                {/* Segmented Pill Tabs: User Roles & Bundles / Policy Bundles & Permissions */}
                <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setDashboardTab("roles_bundles")}
                    className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                      dashboardTab === "roles_bundles"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>User Roles & Bundles</span>
                    <span
                      className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                        dashboardTab === "roles_bundles"
                          ? "bg-[#C81E1E] text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      g3
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDashboardTab("bundles_policies")}
                    className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                      dashboardTab === "bundles_policies"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>Policy Bundles & Permissions</span>
                    <span
                      className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                        dashboardTab === "bundles_policies"
                          ? "bg-[#C81E1E] text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      p, p2, p3
                    </span>
                  </button>
                </div>
              </div>

              {/* ====================================================
                  Dashboard Master-Detail Views
              ==================================================== */}
              {dashboardTab === "roles_bundles" ? (
                <UserRolesBundlesDashboard />
              ) : (
                <PolicyBundlesPoliciesDashboard />
              )}

              {/* Collapsible Session & Developer Quick Tools */}
              <div className="mt-8 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSessionTools((prev) => !prev)}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  <svg
                    className={`h-3.5 w-3.5 transition-transform ${
                      showSessionTools ? "rotate-90" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  <span>API Session & Token Tools</span>
                  <span className="rounded bg-slate-200 px-1.5 py-0.2 text-[10px] font-mono text-slate-600">
                    Active Role: {selectedRole}
                  </span>
                </button>

                {showSessionTools && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                    <div className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          Refresh Access Token
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Issue a new session access token using refresh cookie.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRefreshToken}
                        disabled={refreshing}
                        className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-100 disabled:opacity-50 transition"
                      >
                        {refreshing ? "Refreshing…" : "Refresh Token"}
                      </button>
                    </div>

                    <div className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          Reload Dashboard Session
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Re-fetch permission matrices and backend menus.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={fetchDashboard}
                        className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
                      >
                        Fetch /dashboard
                      </button>
                    </div>

                    <div className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          Casbin Enforcer Checker
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Live permission evaluator testing tool.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push("/admin/enforcer-checker")}
                        className="mt-3 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition"
                      >
                        Open Checker →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
