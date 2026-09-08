"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import UserForm from "@/component/UserForm";
import UserList from "@/component/UserList";
import {
  hasPermission,
  hasFieldPermission,
  type Permission,
  type FieldPermission,
} from "@/lib/permissions";
import {
  PlusSquareIcon,
  EditIcon,
  LockIcon,
  CheckIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

const PERM_CREATE = "userManagement-createUser";
const PERM_UPDATE = "userManagement-updateUser";
const PERM_DEACTIVATE = "userManagement-deactivateUser";
const PERM_ACTIVATE = "userManagement-activateUser";
const PERM_LIST = "userManagement-listUsers";

interface UserPageProps {
  permissions?: Permission[];
  fieldPermissions?: FieldPermission[];
}

type PageView = "home" | "create";

export default function UserPage({
  permissions = [],
  fieldPermissions = [],
}: UserPageProps) {
  const router = useRouter();
  const [view, setView] = useState<PageView>("home");

  const hasUsersSection = hasPermission(permissions, "sec_user_users");

  const canCreate =
    hasPermission(permissions, PERM_CREATE) ||
    hasFieldPermission(fieldPermissions, "field_user_create") ||
    hasFieldPermission(fieldPermissions, "create") ||
    hasUsersSection;

  const canUpdate =
    hasPermission(permissions, PERM_UPDATE) ||
    hasFieldPermission(fieldPermissions, "field_user_update") ||
    hasFieldPermission(fieldPermissions, "update") ||
    hasUsersSection;

  const canDeactivate =
    hasPermission(permissions, PERM_DEACTIVATE) ||
    hasFieldPermission(fieldPermissions, "field_user_deactivate") ||
    hasFieldPermission(fieldPermissions, "deactivate") ||
    hasUsersSection;

  const canActivate =
    hasPermission(permissions, PERM_ACTIVATE) ||
    hasFieldPermission(fieldPermissions, "field_user_activate") ||
    hasFieldPermission(fieldPermissions, "activate") ||
    hasUsersSection;

  const canList =
    hasPermission(permissions, PERM_LIST) ||
    hasFieldPermission(fieldPermissions, "field_user_list") ||
    hasFieldPermission(fieldPermissions, "list") ||
    hasUsersSection;

  function reset() {
    setView("home");
  }

  if (view === "create") {
    return (
      <PageShell
        title="New User"
        subtitle="Fill in the details to create a new user account."
        onBack={reset}
      >
        <UserForm
          mode="create"
          permissions={permissions}
          fieldPermissions={fieldPermissions}
          onSuccess={reset}
          onCancel={reset}
        />
      </PageShell>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header (Clean Minimalist Greyish) */}
      <div className="border-b border-neutral-100 pb-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          User Management
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">
          User Management
        </h1>

        <p className="mt-0.5 text-xs text-neutral-500">
          Manage system users and access based on your assigned Casbin permissions.
        </p>
      </div>

      {/* No permission */}
      {!canCreate &&
      !canUpdate &&
      !canDeactivate &&
      !canActivate &&
      !canList ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center text-xs text-neutral-500">
          You do not have permission to manage users.
        </div>
      ) : (
        /* Action Cards (Restrained Greyish Palette) */
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* CREATE */}
          {canCreate && (
            <ActionCard
              title="Create User"
              description="Add a new employee to the system."
              icon={<PlusSquareIcon size={18} />}
              allowed
              onAction={() => setView("create")}
              buttonLabel="New User"
            />
          )}

          {/* UPDATE */}
          {canUpdate && (
            <ActionCard
              title="Update User"
              description="Edit an existing user's details and role."
              icon={<EditIcon size={18} />}
              allowed
              onAction={() => router.push("/update-user")}
              buttonLabel="Update User"
            />
          )}

          {/* DEACTIVATE */}
          {canDeactivate && (
            <ActionCard
              title="Deactivate User"
              description="Temporarily suspend an active account."
              icon={<LockIcon size={18} />}
              allowed
              onAction={() => router.push("/deactivate-user")}
              buttonLabel="Deactivate"
            />
          )}

          {/* ACTIVATE */}
          {canActivate && (
            <ActionCard
              title="Activate User"
              description="Restore access for an inactive account."
              icon={<CheckIcon size={18} />}
              allowed
              onAction={() => router.push("/activate-user")}
              buttonLabel="Activate"
            />
          )}
        </div>
      )}

      {/* User Table */}
      {canList && <UserList fieldPermissions={fieldPermissions} />}
    </div>
  );
}

function PageShell({
  title,
  subtitle,
  onBack,
  children,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div className="border-b border-neutral-100 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition"
        >
          <ChevronLeftIcon size={14} />
          <span>Back to User Management</span>
        </button>

        <h1 className="text-xl font-bold tracking-tight text-neutral-900">
          {title}
        </h1>
        <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>
      </div>

      {children}
    </div>
  );
}

function ActionCard({
  title,
  description,
  icon,
  allowed,
  onAction,
  buttonLabel,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  allowed: boolean;
  onAction: () => void;
  buttonLabel: string;
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs hover:border-neutral-300 transition duration-150">
      <div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800 mb-3">
          {icon}
        </div>

        <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
        <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
          {description}
        </p>
      </div>

      {allowed && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onAction}
          className="mt-5 w-full justify-between"
          rightIcon={<ChevronRightIcon size={14} />}
        >
          {buttonLabel}
        </Button>
      )}
    </div>
  );
}
