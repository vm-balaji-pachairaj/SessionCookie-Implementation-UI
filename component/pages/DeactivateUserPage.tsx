"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UserForm, {
  type UserFormData,
} from "@/component/UserForm";
import {
  hasPermission,
  type Permission,
} from "@/lib/permissions";

const PERM_DEACTIVATE =
  "userManagement-deactivateUser";

const PERM_ACTIVATE =
  "userManagement-activateUser";

interface DeactivateUserPageProps {
  permissions?: Permission[];
}

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

type ActionMode = "deactivate" | "activate";

export default function DeactivateUserPage({
  permissions = [],
}: DeactivateUserPageProps) {
  const router = useRouter();

  const [ntIdInput, setNtId] = useState("");

  const [loadedUser, setLoadedUser] =
    useState<Partial<UserFormData> | null>(null);

  const [loadedUserId, setLoadedUserId] =
    useState<number | null>(null);

  const [lookupError, setLookupError] =
    useState("");

  const [loaded, setLoaded] =
    useState(false);

  const [actionMode, setActionMode] =
    useState<ActionMode | null>(null);

  const canDeactivate = hasPermission(
    permissions,
    PERM_DEACTIVATE,
  );

  const canActivate = hasPermission(
    permissions,
    PERM_ACTIVATE,
  );

  async function handleLoad() {
    try {
      setLookupError("");

      const search = ntIdInput.trim().toUpperCase();

      if (!search) {
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/user-management/users?search=${encodeURIComponent(
          search,
        )}`,
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
          `No user found for "${search}"`,
        );
        return;
      }

      const user = users[0];
      const isActive = user.isActive ?? user.is_active ?? false;

      /*
       * ACTIVE USER
       * ----------------
       * Only a role with deactivate
       * permission can continue.
       */
      if (isActive) {
        if (!canDeactivate) {
          setLookupError(
            "You do not have permission to deactivate this user.",
          );
          return;
        }

        setActionMode("deactivate");
      }

      /*
       * INACTIVE USER
       * ----------------
       * Only a role with activate
       * permission can continue.
       */
      else {
        if (!canActivate) {
          setLookupError(
            "You do not have permission to activate this user.",
          );
          return;
        }

        setActionMode("activate");
      }

      /*
       * Load user data into the form.
       */
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
    setLoaded(false);
    setNtId("");
    setLoadedUser(null);
    setLoadedUserId(null);
    setLookupError("");
    setActionMode(null);
  }

  /*
   * User has neither activate nor deactivate permission.
   */
  if (!canActivate && !canDeactivate) {
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

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">
            User Management
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            User Status
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Activate or deactivate users based on your permissions.
          </p>
        </div>

        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center text-sm text-red-500">
          You do not have permission to activate or deactivate users.
        </div>
      </div>
    );
  }

  /*
   * User has been loaded.
   *
   * Open UserForm using the action determined
   * from the user's current status.
   */
  if (
    loaded &&
    actionMode
  ) {
    return (
      <div className="space-y-5">
        <div>
          <button
            onClick={reset}
            className="mb-3 text-xs font-semibold text-slate-400 hover:text-slate-600"
          >
            ← Back to User Status
          </button>

          <p
            className={`text-xs font-semibold uppercase tracking-[0.2em] ${
              actionMode ===
              "deactivate"
                ? "text-red-500"
                : "text-emerald-600"
            }`}
          >
            User Management
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {actionMode ===
            "deactivate"
              ? "Deactivate User"
              : "Activate User"}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {actionMode ===
            "deactivate"
              ? "Deactivate the selected user's account."
              : "Activate the selected user's account."}
          </p>
        </div>

        <UserForm
          mode={actionMode}
          permissions={permissions}
          initialData={
            loadedUser ?? {}
          }
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
      {/* Header */}
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

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
          User Management
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          User Status
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Search for a user to activate or deactivate their account.
        </p>
      </div>

      {/* Find User */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900">
          Find User
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Enter an employee ID to check the user's current status.
        </p>

        <div className="mt-5 flex gap-2">
          <input
            type="text"
            value={ntIdInput}
            onChange={(e) => {
              setNtId(e.target.value.toUpperCase());
              setLookupError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleLoad();
              }
            }}
            placeholder="Enter employee ID"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />

          <button
            onClick={handleLoad}
            disabled={!ntIdInput.trim()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
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
