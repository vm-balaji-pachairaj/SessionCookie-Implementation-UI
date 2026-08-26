"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UserForm, { type UserFormData } from "@/component/UserForm";
import { hasPermission, type Permission } from "@/lib/permissions";

const PERM_UPDATE = "userManagement-updateUser";

interface UpdateUserPageProps {
  permissions?: Permission[];
}

interface UserResponse {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  role: string | null;
  department: string | null;
  isActive: boolean;
}

export default function UpdateUserPage({
  permissions = [],
}: UpdateUserPageProps) {
  const router = useRouter();

  const [ntIdInput, setNtId] = useState("");
  const [loadedUser, setLoadedUser] =
    useState<Partial<UserFormData> | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<number | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const canUpdate = hasPermission(permissions, PERM_UPDATE);

  async function handleLoad() {
    try {
      setLookupError("");

      const response = await fetch(
        `http://localhost:5000/api/user-management/users?search=${encodeURIComponent(
          ntIdInput.trim(),
        )}`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const result = await response.json();
      const users = result.data as UserResponse[];

      if (!users.length) {
        setLookupError(`No user found for "${ntIdInput}"`);
        return;
      }

      const user = users[0];

      setLoadedUserId(user.id);

      setLoadedUser({
        firstName: user.firstName,
        lastName: user.lastName,
        employeeId: user.employeeId,
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
    }
  }

  function reset() {
    setLoaded(false);
    setNtId("");
    setLoadedUser(null);
    setLoadedUserId(null);
    setLookupError("");
  }

  return (
    <div className="space-y-5">
      <div>
        <button
          onClick={() => router.push("/user-management")}
          className="mb-3 text-xs font-semibold text-slate-400 hover:text-slate-600"
        >
          ← Back to User Management
        </button>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
          User Management
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Update User
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Search for a user and edit their details.
        </p>
      </div>

      {!canUpdate ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center text-sm text-red-500">
          You do not have permission to update users.
        </div>
      ) : !loaded ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Find User
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Enter an employee ID to load the user for editing.
          </p>

          <div className="mt-5 flex gap-2">
            <input
              type="text"
              value={ntIdInput}
              onChange={(e) => {
                setNtId(e.target.value);
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
      ) : (
        <UserForm
          mode="update"
          permissions={permissions}
          initialData={loadedUser ?? {}}
          userId={loadedUserId ?? undefined}
          onSuccess={() => {
            reset();
            router.push("/user-management");
          }}
          onCancel={reset}
        />
      )}
    </div>
  );
}