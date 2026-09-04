"use client";

import { useSelector } from "react-redux";
import type { RootState } from "../app/store/store";
import SearchPage from "@/component/pages/SearchPage";
import UserPage from "@/component/pages/UserPage";
import UpdateUserPage from "@/component/pages/UpdateUserPage";
import DeactivateUserPage from "@/component/pages/DeactivateUserPage";
import ActivateUserPage from "@/component/pages/ActivateUserPage";
import ReviewPendingPage from "@/component/pages/ReviewPendingPage";
import PageGuard from "./pages/PageGaurd";

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

interface MenuPageRendererProps {
  activeKey: string;
  permissions?: Permission[];
  fieldPermissions?: FieldPermission[];
}

function normalize(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

const DASHBOARD_NORM = new Set([
  "dashboard",
  "dashboard_initiator",
  "dashboard_reviewer",
]);

// Menu keys that should keep showing the dashboard home content instead of MenuPageRenderer.
export function isDashboardHome(key: string): boolean {
  return DASHBOARD_NORM.has(normalize(key));
}

const SEARCH_NORM = new Set([
  "search",
  "search_user",
  "generic_search",
]);

const USER_NORM = new Set([
  "user",
  "user_management",
  "initiate_new_user",
  "modify_user",
]);

const REVIEW_NORM = new Set([
  "review_pending",
]);

const UPDATE_USER_NORM = new Set([
  "update_user",
]);

const DEACTIVATE_USER_NORM = new Set([
  "deactivate_user",
]);

const ACTIVATE_USER_NORM = new Set([
  "activate_user",
  "active_user",
]);

export default function MenuPageRenderer({
  activeKey,
  permissions,
  fieldPermissions,
}: MenuPageRendererProps) {
  const key = normalize(activeKey);
  const menus = useSelector((state: RootState) => state.menu.menus);

  // Search page
  if (SEARCH_NORM.has(key)) {
    return (
      <SearchPage
        permissions={permissions}
      />
    );
  }

  // User Management page
  if (USER_NORM.has(key)) {
    return (
      <PageGuard
        permissions={permissions ?? []}
        requiredPermission="userManagement-page"
      >
        <UserPage
          permissions={permissions}
          fieldPermissions={fieldPermissions}
        />
      </PageGuard>
    );
  }

  // Review Pending page
  if (REVIEW_NORM.has(key)) {
    return (
      <ReviewPendingPage
        permissions={permissions}
      />
    );
  }

  // Update User page
  if (UPDATE_USER_NORM.has(key)) {
    return (
      <PageGuard
        permissions={permissions ?? []}
        requiredPermission="userManagement-page"
      >
        <UpdateUserPage permissions={permissions} fieldPermissions={fieldPermissions} />
      </PageGuard>
    );
  }

  // Deactivate User page
  if (DEACTIVATE_USER_NORM.has(key)) {
    return (
      <PageGuard
        permissions={permissions ?? []}
        requiredPermission="userManagement-page"
      >
        <DeactivateUserPage permissions={permissions} fieldPermissions={fieldPermissions} />
      </PageGuard>
    );
  }

  // Activate User page
  if (ACTIVATE_USER_NORM.has(key)) {
    return (
      <PageGuard
        permissions={permissions ?? []}
        requiredPermission="userManagement-page"
      >
        <ActivateUserPage permissions={permissions} fieldPermissions={fieldPermissions} />
      </PageGuard>
    );
  }

  // No dedicated page for this menu yet — reuse the sidebar's own icon and just show the page title.
  const menuInfo = menus.find((menu) => menu.key === activeKey);
  const title = menuInfo?.displayName || activeKey.replace(/_/g, " ");

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        {menuInfo?.icon ? (
          <img src={menuInfo.icon} alt="" className="h-8 w-8" />
        ) : (
          <span className="text-2xl text-slate-400">○</span>
        )}
      </div>

      <h2 className="mt-4 text-lg font-bold text-slate-800 capitalize">
        {title}
      </h2>
    </div>
  );
}
