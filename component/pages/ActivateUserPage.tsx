
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UserForm, {
  type UserFormData,
} from "@/component/UserForm";
import {
  hasPermission,
  type Permission,
  type FieldPermission,
} from "@/lib/permissions";

const PERM_ACTIVATE =
  "userManagement-activateUser";

interface UserResponse {
  id: number;
  employeeId?: string;
  employee_id?: string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  role: string | null;
  department: string | null;
  isActive?: boolean;
  is_active?: boolean;
}

interface ActiveUserPageProps {
  permissions?: Permission[];
  fieldPermissions?: FieldPermission[];
}

export default function ActiveUserPage({
  permissions = [],
  fieldPermissions = [],
}: ActiveUserPageProps) {
  const router = useRouter();

  const [employeeId, setEmployeeId] =
    useState("");

  const [loadedUser, setLoadedUser] =
    useState<Partial<UserFormData> | null>(null);

  const [loadedUserId, setLoadedUserId] =
    useState<number | null>(null);

  const [lookupError, setLookupError] =
    useState("");

  const [loaded, setLoaded] =
    useState(false);

  const canActivate = hasPermission(
    permissions,
    PERM_ACTIVATE,
  );

  async function handleLoad() {
    try {
      setLookupError("");

      const search = employeeId.trim().toUpperCase();

      if (!search) {
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/user-management/users?search=${encodeURIComponent(
          search,
        )}&includeInactive=true`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch users",
        );
      }

      const result =
        await response.json();

      const users =
        result.data as UserResponse[];

      if (!users.length) {
        setLookupError(
          `No inactive user found for "${search}".`,
        );
        return;
      }

      const user = users[0];
      const isActive = user.isActive ?? user.is_active ?? false;

      /*
       * This page is specifically for
       * activating inactive users.
       */
      if (isActive) {
        setLookupError(
          `User "${search}" is already active.`,
        );
        return;
      }

      /*
       * Permission check.
       */
      if (!canActivate) {
        setLookupError(
          "You do not have permission to activate users.",
        );
        return;
      }

      setLoadedUserId(user.id);

      setLoadedUser({
        firstName: user.firstName ?? user.first_name ?? "",
        lastName: user.lastName ?? user.last_name ?? "",
        employeeId: user.employeeId ?? user.employee_id ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        address: user.address ?? "",
        role: user.role ?? "",
        department: user.department ?? "",
      });

      setLoaded(true);
    } catch (error) {
      console.error(error);

      setLookupError(
        "Unable to load user.",
      );
    }
  }

  function reset() {
    setEmployeeId("");
    setLoadedUser(null);
    setLoadedUserId(null);
    setLookupError("");
    setLoaded(false);
  }

  /*
   * No permission.
   */
  if (!canActivate) {
    return (
      <div className="space-y-5">
        <div>
          <button
            onClick={() =>
              router.push(
                "/user-management",
              )
            }
            className="mb-3 text-xs font-semibold text-slate-400 hover:text-slate-600"
          >
            ← Back to User Management
          </button>

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
            User Management
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Activate User
          </h1>
        </div>

        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center text-sm text-red-500">
          You do not have permission to activate users.
        </div>
      </div>
    );
  }

  /*
   * User loaded.
   */
  if (
    loaded &&
    loadedUser
  ) {
    return (
      <div className="space-y-5">
        <div>
          <button
            onClick={reset}
            className="mb-3 text-xs font-semibold text-slate-400 hover:text-slate-600"
          >
            ← Back to Activate User
          </button>

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
            User Management
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Activate User
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review the user before activating the account.
          </p>
        </div>

        <UserForm
          mode="activate"
          permissions={permissions}
          fieldPermissions={fieldPermissions}
          initialData={loadedUser}
          userId={
            loadedUserId ??
            undefined
          }
          onSuccess={() => {
            reset();

            router.push(
              "/user-management",
            );
          }}
          onCancel={reset}
        />
      </div>
    );
  }

  /*
   * Search page.
   */
  return (
    <div className="space-y-5">
      <div>
        <button
          onClick={() =>
            router.push(
              "/user-management",
            )
          }
          className="mb-3 text-xs font-semibold text-slate-400 hover:text-slate-600"
        >
          ← Back to User Management
        </button>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
          User Management
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Activate User
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Search for an inactive user to activate their account.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900">
          Find User
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Enter an employee ID to load the inactive user.
        </p>

        <div className="mt-5 flex gap-2">
          <input
            type="text"
            value={employeeId}
            onChange={(e) => {
              setEmployeeId(
                e.target.value.toUpperCase(),
              );

              setLookupError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleLoad();
              }
            }}
            placeholder="Enter employee ID"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />

          <button
            onClick={handleLoad}
            disabled={!employeeId.trim()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Load
          </button>
        </div>

        {lookupError && (
          <p className="mt-3 text-xs text-red-500">
            {lookupError}
          </p>
        )}
      </div>
    </div>
  );
}
