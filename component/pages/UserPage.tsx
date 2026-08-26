"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UserForm from "@/component/UserForm";
import {
  hasPermission,
  type Permission,
} from "@/lib/permissions";

const PERM_CREATE =
  "userManagement-createUser";

const PERM_UPDATE =
  "userManagement-updateUser";

const PERM_DEACTIVATE =
  "userManagement-deactivateUser";

const PERM_ACTIVATE =
  "userManagement-activateUser";

interface UserPageProps {
  permissions?: Permission[];
}

type PageView = "home" | "create";

export default function UserPage({
  permissions = [],
}: UserPageProps) {
  const router = useRouter();

  const [view, setView] =
    useState<PageView>("home");

  const canCreate = hasPermission(
    permissions,
    PERM_CREATE,
  );

  const canUpdate = hasPermission(
    permissions,
    PERM_UPDATE,
  );

  const canDeactivate = hasPermission(
    permissions,
    PERM_DEACTIVATE,
  );

  const canActivate = hasPermission(
    permissions,
    PERM_ACTIVATE,
  );

  function reset() {
    setView("home");
  }

  if (view === "create") {
    return (
      <PageShell
        title="New User"
        subtitle="Fill in the form below."
        onBack={reset}
      >
        <UserForm
          mode="create"
          permissions={permissions}
          onSuccess={reset}
          onCancel={reset}
        />
      </PageShell>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
          User Management
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          User Management
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage users based on your assigned permissions.
        </p>
      </div>

      {/* No permission */}
      {!canCreate &&
      !canUpdate &&
      !canDeactivate &&
      !canActivate ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center text-sm text-red-500">
          You do not have permission to manage users.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">

          {/* CREATE */}
          {canCreate && (
            <ActionCard
              title="Create User"
              description="Add a new user to the system."
              icon="＋"
              iconColor="bg-violet-100 text-violet-600"
              allowed
              onAction={() =>
                setView("create")
              }
              buttonLabel="New User"
              buttonClass="bg-violet-600 hover:bg-violet-500"
            />
          )}

          {/* UPDATE */}
          {canUpdate && (
            <ActionCard
              title="Update User"
              description="Edit an existing user's details."
              icon="✎"
              iconColor="bg-blue-100 text-blue-600"
              allowed
              onAction={() =>
                router.push("/update-user")
              }
              buttonLabel="Update User"
              buttonClass="bg-blue-600 hover:bg-blue-500"
            />
          )}

          {/* DEACTIVATE */}
          {canDeactivate && (
            <ActionCard
              title="Deactivate User"
              description="Deactivate an active user's account."
              icon="⊘"
              iconColor="bg-red-100 text-red-600"
            allowed
            onAction={() =>
                router.push("/deactivate-user")
            }
            buttonLabel="Deactivate User"
            buttonClass="bg-red-600 hover:bg-red-500"
            />
          )}

          {canActivate && (
          <ActionCard
            title="Activate User"
            description="Activate an inactive user's account."
            icon="✓"
            iconColor="bg-emerald-100 text-emerald-600"
            allowed
            onAction={() =>
              router.push("/activate-user")
            }
            buttonLabel="Activate User"
            buttonClass="bg-emerald-600 hover:bg-emerald-500"
          />
          )}

        </div>
      )}
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
      <div>
        <button
          onClick={onBack}
          className="mb-3 text-xs font-semibold text-slate-400 hover:text-slate-600"
        >
          ← Back to User Management
        </button>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
          User Management
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          {title}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          {subtitle}
        </p>
      </div>

      {children}
    </div>
  );
}

function ActionCard({
  title,
  description,
  icon,
  iconColor,
  allowed,
  onAction,
  buttonLabel,
  buttonClass,
}: {
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  allowed: boolean;
  onAction: () => void;
  buttonLabel: string;
  buttonClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconColor}`}
        >
          {icon}
        </div>

        <div>
          <h2 className="font-semibold text-slate-900">
            {title}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        </div>
      </div>

      {allowed && (
        <button
          onClick={onAction}
          className={`mt-5 rounded-lg px-5 py-2.5 text-sm font-semibold text-white ${buttonClass}`}
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
}
