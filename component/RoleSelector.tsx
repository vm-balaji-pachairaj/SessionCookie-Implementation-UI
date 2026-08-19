"use client";

import { useState } from "react";

type Role = {
  user_role_mapping_id: string;
  nt_id: string;
  role_id: string;
  is_active: boolean;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  role_master: {
    role_id: string;
    role_name: string;
    short_name: string;
    role_hcs_id: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;
  };
};

type RoleSelectorProps = {
  currentRole: any[];
};

export default function RoleSelector({ data }: any) {
  const { currentRole } = data || {};
  const [selectedRole, setSelectedRole] = useState<string>(
    currentRole?.[0]?.role_id || ""
  );

  console.log("Current Role => ", currentRole);

  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleRoleChange = async (role: Role) => {
    if (loadingRole) return;

    try {
      setError("");
      setLoadingRole(role.role_id);

      const response = await fetch("http://localhost:5000/changerole", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_role_mapping_id: role.user_role_mapping_id,
          role_id: role.role_id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to change role");
      }

      const data = await response.json();

      console.log("Change role response:", data);

      setSelectedRole(role.role_id);
    } catch (err) {
      console.error("Role change error:", err);
      setError("Unable to change role. Please try again.");
    } finally {
      setLoadingRole(null);
    }
  };

  if (!currentRole || currentRole.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-500">No roles available</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Select Role</h2>

        <p className="mt-1 text-sm text-gray-500">
          Choose the role you want to continue with.
        </p>
      </div>

      {/* Roles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {currentRole?.map((role: any) => {
          const isSelected = selectedRole === role.role_id;
          const isLoading = loadingRole === role.role_id;

          return (
            <button
              key={role.user_role_mapping_id}
              type="button"
              disabled={!!loadingRole || !role.is_active}
              onClick={() => handleRoleChange(role)}
              className={`
                relative rounded-xl border p-4 text-left
                transition-all duration-200
                ${
                  isSelected
                    ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                    : "border-gray-200 bg-white hover:border-blue-400 hover:bg-gray-50"
                }
                ${
                  !role.is_active
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }
              `}
            >
              {/* Selected indicator */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`
                      flex h-10 w-10 items-center justify-center
                      rounded-lg text-sm font-bold
                      ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600"
                      }
                    `}
                  >
                    {role.role_master.short_name?.charAt(0)?.toUpperCase()}
                  </div>

                  <div>
                    <h3
                      className={`
                        text-sm font-semibold
                        ${isSelected ? "text-blue-700" : "text-gray-900"}
                      `}
                    >
                      {role.role_master.short_name}
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      Role ID: {role.role_id}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                    ✓
                  </div>
                )}
              </div>

              {/* Full role name */}
              <p className="mt-4 text-xs leading-5 text-gray-600">
                {role.role_master.role_name}
              </p>

              {/* Loading */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Current role */}
      <div className="mt-6 border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-500">Current Role</p>

        <p className="mt-1 text-sm font-medium text-gray-900">
          {
            currentRole.find((role: any) => role.role_id === selectedRole)
              ?.role_master.role_name
          }
        </p>
      </div>
    </div>
  );
}
