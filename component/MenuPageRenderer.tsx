"use client";

import SearchPage from "@/component/pages/SearchPage";
import UserPage from "@/component/pages/UserPage";
import UpdateUserPage from "@/component/pages/UpdateUserPage";
import DeactivateUserPage from "@/component/pages/DeactivateUserPage";
import ActivateUserPage from "@/component/pages/ActivateUserPage";
import ReviewPendingPage from "@/component/pages/ReviewPendingPage";
import PageGuard from "./pages/PageGaurd";
import RBACPage from "@/component/pages/RBACPage";

interface Permission {
  permission: string;
  lob: string;
  page: string;
  module: string;
  section: string;
  access: string;
}

interface MenuPageRendererProps {
  activeKey: string;
  permissions?: Permission[];
  currentRoleId?: string | null;
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

const SEARCH_NORM = new Set([
  "search",
  "search_user",
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

const RBAC_NORM = new Set(["rbac"]);

export default function MenuPageRenderer({
  activeKey,
  permissions,
  currentRoleId,
}: MenuPageRendererProps) {
  const key = normalize(activeKey);

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
        <UpdateUserPage permissions={permissions} />
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
        <DeactivateUserPage permissions={permissions} />
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
        <ActivateUserPage permissions={permissions} />
      </PageGuard>
    );
  }

  // RBAC page
  if (RBAC_NORM.has(key)) {
    return <RBACPage currentRoleId={currentRoleId} />;
  }

  // Fallback
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400">
        ○
      </div>

      <h2 className="mt-4 text-lg font-bold text-slate-800 capitalize">
        {activeKey.replace(/_/g, " ")}
      </h2>

      <p className="mt-2 text-sm text-slate-400">
        This page is under construction.
      </p>
    </div>
  );
}
