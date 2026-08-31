"use client";

import { useState } from "react";
import {
  getSectionMode,
  hasPermission,
  type Permission,
} from "@/lib/permissions";
import api from "../app/common";

// ── Permission keys used by this form ────────────────────────────────────────

// Section-level permissions
const PERM_BASIC = "userManagement-user-basicDetails";
const PERM_CONTACT = "userManagement-user-contactDetails";
const PERM_ROLE = "userManagement-user-roleAccess";
const PERM_ROLE_VIEW = "userManagement-user-roleAccess-view";
// Action-level permissions
const PERM_CREATE = "userManagement-createUser";
const PERM_UPDATE = "userManagement-updateUser";
const PERM_DEACTIVATE = "userManagement-deactivateUser";
const PERM_ACTIVATE = "userManagement-activateUser";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserFormData {
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  department: string;
}

type FormMode =
  | "create"
  | "update"
  | "deactivate"
  | "activate";

type SectionMode = "edit" | "view" | "none";

export interface UserFormProps {
  /**
   * "create"     – blank form, gated by createUser permission
   * "update"     – pre-filled form, gated by updateUser permission
   * "deactivate" – pre-filled read-only form, gated by deactivateUser permission
   * "activate"   – pre-filled read-only form, gated by activateUser permission
   */
  mode: FormMode;

  permissions: Permission[];

  /** Pre-fill values for update / deactivate / activate mode. */
  initialData?: Partial<UserFormData>;

  userId?: number;

  onSuccess?: () => void;

  onCancel?: () => void;
}

const EMPTY: UserFormData = {
  firstName: "",
  lastName: "",
  employeeId: "",
  email: "",
  phone: "",
  address: "",
  role: "",
  department: "",
};

// ── Main component ───────────────────────────────────────────────────────────

export default function UserForm({
  mode,
  permissions,
  initialData = {},
  userId,
  onSuccess,
  onCancel,
}: UserFormProps) {
  const [fields, setFields] = useState<UserFormData>({
    ...EMPTY,
    ...initialData,
  });

  const [saved, setSaved] = useState(false);
  const [reason, setReason] = useState("");

  // ── Resolve section modes from backend permissions ─────────────────────────

  const rawBasicMode: SectionMode = getSectionMode(
    permissions,
    PERM_BASIC,
  );

  const rawContactMode: SectionMode = getSectionMode(
    permissions,
    PERM_CONTACT,
  );

  const rawRoleMode: SectionMode = (() => {
    const editMode = getSectionMode(
      permissions,
      PERM_ROLE,
    );

    if (editMode !== "none") {
      return editMode;
    }

    return getSectionMode(
      permissions,
      PERM_ROLE_VIEW,
    );
  })();
  // Activate and deactivate are status actions.
  // User details should be read-only for both.
  const isStatusAction =
    mode === "deactivate" || mode === "activate";

  const basicMode: SectionMode =
    isStatusAction && rawBasicMode !== "none"
      ? "view"
      : rawBasicMode;

  const contactMode: SectionMode =
    isStatusAction && rawContactMode !== "none"
      ? "view"
      : rawContactMode;

  const roleMode: SectionMode =
    isStatusAction && rawRoleMode !== "none"
      ? "view"
      : rawRoleMode;

  // ── Action permissions ─────────────────────────────────────────────────────

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

  // ── Primary action permission ──────────────────────────────────────────────

  const actionAllowed =
    mode === "create"
      ? canCreate
      : mode === "update"
        ? canUpdate
        : mode === "deactivate"
          ? canDeactivate
          : canActivate;

  function set(
    key: keyof UserFormData,
    value: string,
  ) {
    setFields((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    if (!actionAllowed) {
      return;
    }

    try {
      const payload = {
        employee_id: fields.employeeId,
        first_name: fields.firstName,
        last_name: fields.lastName,
        email: fields.email,
        phone: fields.phone,
        address: fields.address,
        role: fields.role,
        department: fields.department,
      };

      // CREATE
      if (mode === "create") {
        const response = await fetch(
          "http://localhost:5000/api/user-management/users",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => null);

          throw new Error(
            errorData?.message ||
              "Failed to create user",
          );
        }
      }

      // UPDATE
      else if (mode === "update" && userId) {
        await api.put(
          `/user-management/users/${userId}`,
          payload,
        );
      }

      // DEACTIVATE
      else if (
        mode === "deactivate" &&
        userId
      ) {
        await api.patch(
          `/user-management/users/${userId}/deactivate`,
        );
      }

      // ACTIVATE
      else if (
        mode === "activate" &&
        userId
      ) {
        await api.patch(
          `/user-management/users/${userId}/activate`,
        );
      }

      else {
        return;
      }

      setSaved(true);

      if (onSuccess) {
        // Give the success state a moment to render,
        // then return to the parent page.
        setTimeout(() => {
          onSuccess();
        }, 500);
      }
    } catch (error: any) {
      console.error(
        "User save failed:",
        error,
      );

      console.error(
        "Response:",
        error?.message,
      );
    }
  }

  // ── Success ────────────────────────────────────────────────────────────────

  if (saved) {
    const successLabel =
      mode === "create"
        ? "created"
        : mode === "update"
          ? "updated"
          : mode === "deactivate"
            ? "deactivated"
            : "activated";

    const resetLabel =
      mode === "create"
        ? "Add another"
        : mode === "update"
          ? "Edit again"
          : "Back";

    return (
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
        ✓ User {successLabel} successfully.

        <button
          onClick={() => {
            setSaved(false);
            if (mode !== "create" && onCancel) {
              onCancel();
            }
          }}
          className="ml-3 underline text-emerald-600"
        >
          {resetLabel}
        </button>
      </div>
    );
  }

  // ── No section access ──────────────────────────────────────────────────────

  if (
    basicMode === "none" &&
    contactMode === "none" &&
    roleMode === "none"
  ) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-8 text-center text-sm text-red-500">
        You do not have permission to view this form.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* ── Section 1: Basic Details ── */}

      {basicMode !== "none" && (
        <FormSection
          title="Basic Details"
          mode={basicMode}
          description="Name and employee identifier."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="First Name"
              value={fields.firstName}
              onChange={(v) =>
                set("firstName", v)
              }
              readonly={
                basicMode === "view"
              }
              required={
                basicMode === "edit" &&
                mode === "create"
              }
            />

            <Field
              label="Last Name"
              value={fields.lastName}
              onChange={(v) =>
                set("lastName", v)
              }
              readonly={
                basicMode === "view"
              }
              required={
                basicMode === "edit" &&
                mode === "create"
              }
            />

            <Field
              label="Employee ID"
              value={fields.employeeId}
              onChange={(v) =>
                set("employeeId", v)
              }
              readonly={
                basicMode === "view"
              }
              placeholder="e.g. EMP-00123"
            />
          </div>
        </FormSection>
      )}

      {/* ── Section 2: Contact Details ── */}

      {contactMode !== "none" && (
        <FormSection
          title="Contact Details"
          mode={contactMode}
          description="Email address, phone number, and office address."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Email"
              type="email"
              value={fields.email}
              onChange={(v) =>
                set("email", v)
              }
              readonly={
                contactMode === "view"
              }
              required={
                contactMode === "edit" &&
                mode === "create"
              }
            />

            <Field
              label="Phone"
              type="tel"
              value={fields.phone}
              onChange={(v) =>
                set("phone", v)
              }
              readonly={
                contactMode === "view"
              }
              placeholder="+91 XXXXX XXXXX"
            />

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Address
              </label>

              {contactMode === "view" ? (
                <div className="min-h-[68px] w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  {fields.address || (
                    <span className="text-slate-300">
                      —
                    </span>
                  )}
                </div>
              ) : (
                <textarea
                  rows={2}
                  value={fields.address}
                  onChange={(e) =>
                    set(
                      "address",
                      e.target.value,
                    )
                  }
                  placeholder="Office / building address"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              )}
            </div>
          </div>
        </FormSection>
      )}

      {/* ── Section 3: Role & Access ── */}

      {roleMode !== "none" && (
        <FormSection
          title="Role & Access"
          mode={roleMode}
          description="Assign the user's role, department, and view their permissions."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Role"
              value={fields.role}
              onChange={(v) =>
                set("role", v)
              }
              readonly={
                roleMode === "view"
              }
              placeholder="e.g. Support Initiator"
            />

            <Field
              label="Department"
              value={fields.department}
              onChange={(v) =>
                set(
                  "department",
                  v,
                )
              }
              readonly={
                roleMode === "view"
              }
              placeholder="e.g. HCP Operations"
            />
          </div>

          {/* Permissions display */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Assigned Permissions
            </p>

            {permissions.length === 0 ? (
              <p className="text-xs text-slate-400">
                No permissions assigned.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {permissions.map((p) => (
                  <span
                    key={p.permission}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
                  >
                    <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-violet-400" />
                    {p.permission}
                  </span>
                ))}
              </div>
            )}
          </div>
        </FormSection>
      )}

      {/* ── Deactivation reason ── */}

      {mode === "deactivate" && (
        <section className="rounded-2xl border border-red-100 bg-red-50 p-6">
          <h3 className="mb-1 font-semibold text-red-700">
            Deactivation Reason
          </h3>

          <p className="mb-3 text-xs text-red-400">
            Required. Explain why this user is being deactivated.
          </p>

          {actionAllowed ? (
            <textarea
              rows={3}
              value={reason}
              onChange={(e) =>
                setReason(e.target.value)
              }
              required
              placeholder="e.g. Employee separation, role change…"
              className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          ) : (
            <p className="text-xs text-red-400">
              You do not have permission to deactivate users.
            </p>
          )}
        </section>
      )}

      {/* ── Activation information ── */}

      {mode === "activate" && (
        <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
          <h3 className="mb-1 font-semibold text-emerald-700">
            Activate User
          </h3>

          <p className="text-xs text-emerald-600">
            This user is currently inactive. Activating the user
            will restore their active status.
          </p>
        </section>
      )}

      {/* ── Action buttons ── */}

      <div className="flex items-center gap-3 pt-2">
        {actionAllowed ? (
          <button
            type="submit"
            className={`rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-md transition ${
              mode === "deactivate"
                ? "bg-red-600 shadow-red-600/20 hover:bg-red-500"
                : mode === "activate"
                  ? "bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-500"
                  : "bg-violet-600 shadow-violet-600/20 hover:bg-violet-500"
            }`}
          >
            {mode === "create"
              ? "Create User"
              : mode === "update"
                ? "Update User"
                : mode === "deactivate"
                  ? "Deactivate User"
                  : "Activate User"}
          </button>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-6 py-2.5 text-sm text-slate-400">
            {mode === "create"
              ? "Create"
              : mode === "update"
                ? "Update"
                : mode === "deactivate"
                  ? "Deactivate"
                  : "Activate"}{" "}
            not permitted
          </div>
        )}

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function FormSection({
  title,
  mode,
  description,
  children,
}: {
  title: string;
  mode: SectionMode;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-900">
            {title}
          </h3>

          {description && (
            <p className="mt-0.5 text-xs text-slate-400">
              {description}
            </p>
          )}
        </div>

        {/* Permission badge */}
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            mode === "edit"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-600"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              mode === "edit"
                ? "bg-emerald-500"
                : "bg-amber-400"
            }`}
          />

          {mode === "edit"
            ? "Editable"
            : "View Only"}
        </span>
      </div>

      {children}
    </section>
  );
}

// ── Single field ──────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  readonly = false,
  required = false,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  readonly?: boolean;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}

        {required && (
          <span className="ml-0.5 text-red-500">
            *
          </span>
        )}
      </label>

      {readonly ? (
        <div className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          {value || (
            <span className="text-slate-300">
              —
            </span>
          )}
        </div>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          required={required}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
        />
      )}
    </div>
  );
}