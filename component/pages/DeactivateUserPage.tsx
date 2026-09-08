"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UserForm, { type UserFormData } from "@/component/UserForm";
import { hasPermission, type Permission, type FieldPermission } from "@/lib/permissions";
import { ChevronLeftIcon, SearchIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

const PERM_DEACTIVATE = "userManagement-deactivateUser";
const PERM_ACTIVATE = "userManagement-activateUser";

interface DeactivateUserPageProps {
  permissions?: Permission[];
  fieldPermissions?: FieldPermission[];
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
  fieldPermissions = [],
}: DeactivateUserPageProps) {
  const router = useRouter();

  const [ntIdInput, setNtId] = useState("");
  const [loadedUser, setLoadedUser] = useState<Partial<UserFormData> | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<number | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionMode, setActionMode] = useState<ActionMode | null>(null);

  const canDeactivate = hasPermission(permissions, PERM_DEACTIVATE);
  const canActivate = hasPermission(permissions, PERM_ACTIVATE);

  async function handleLoad() {
    try {
      setLoading(true);
      setLookupError("");

      const search = ntIdInput.trim().toUpperCase();
      if (!search) return;

      const response = await fetch(
        `http://localhost:5000/api/user-management/users?search=${encodeURIComponent(
          search
        )}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const result = await response.json();
      const users = (result.data || []) as UserResponse[];

      if (!users.length) {
        setLookupError(`No user found for "${search}"`);
        return;
      }

      const user = users[0];
      const isActive = user.isActive ?? user.is_active ?? false;

      if (isActive) {
        if (!canDeactivate) {
          setLookupError("You do not have permission to deactivate this user.");
          return;
        }
        setActionMode("deactivate");
      } else {
        if (!canActivate) {
          setLookupError("You do not have permission to activate this user.");
          return;
        }
        setActionMode("activate");
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
      setLookupError("Unable to load user.");
    } finally {
      setLoading(false);
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

  if (!canActivate && !canDeactivate) {
    return (
      <div className="space-y-6">
        <div className="border-b border-neutral-100 pb-4">
          <button
            type="button"
            onClick={() => router.push("/user-management")}
            className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition"
          >
            <ChevronLeftIcon size={14} />
            <span>Back to User Management</span>
          </button>

          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Account Status
          </h1>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center text-xs text-neutral-500">
          You do not have permission to activate or deactivate users.
        </div>
      </div>
    );
  }

  if (loaded && actionMode) {
    return (
      <div className="space-y-6">
        <div className="border-b border-neutral-100 pb-4">
          <button
            type="button"
            onClick={reset}
            className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition"
          >
            <ChevronLeftIcon size={14} />
            <span>Back to Account Status</span>
          </button>

          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            {actionMode === "deactivate" ? "Deactivate User" : "Activate User"}
          </h1>
          <p className="mt-0.5 text-xs text-neutral-500">
            {actionMode === "deactivate"
              ? "Review user details before suspending access."
              : "Review user details before restoring access."}
          </p>
        </div>

        <UserForm
          mode={actionMode}
          permissions={permissions}
          fieldPermissions={fieldPermissions}
          initialData={loadedUser ?? {}}
          userId={loadedUserId ?? undefined}
          onSuccess={() => {
            reset();
            router.push("/user-management");
          }}
          onCancel={reset}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-100 pb-4">
        <button
          type="button"
          onClick={() => router.push("/user-management")}
          className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition"
        >
          <ChevronLeftIcon size={14} />
          <span>Back to User Management</span>
        </button>

        <h1 className="text-xl font-bold tracking-tight text-neutral-900">
          Account Status Management
        </h1>
        <p className="mt-0.5 text-xs text-neutral-500">
          Search for an employee account to modify active status.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xs max-w-xl">
        <h2 className="text-sm font-bold text-neutral-900 mb-1">
          Find User Record
        </h2>
        <p className="text-xs text-neutral-500 mb-4">
          Enter an employee ID to check account status.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={ntIdInput}
            onChange={(e) => {
              setNtId(e.target.value.toUpperCase());
              setLookupError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleLoad()}
            placeholder="Enter employee ID…"
            className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50/50 px-3.5 py-2 text-xs text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-neutral-400 focus:bg-white focus:ring-1 focus:ring-neutral-400"
          />

          <Button
            variant="primary"
            size="md"
            onClick={handleLoad}
            disabled={!ntIdInput.trim()}
            isLoading={loading}
            leftIcon={<SearchIcon size={14} />}
          >
            Check Status
          </Button>
        </div>

        {lookupError && (
          <p className="mt-3 text-xs text-red-500">{lookupError}</p>
        )}
      </div>
    </div>
  );
}
