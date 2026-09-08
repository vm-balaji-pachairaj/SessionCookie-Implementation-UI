"use client";

import { useState } from "react";
import {
  getSectionMode,
  getFieldMode,
  hasPermission,
  type Permission,
  type FieldPermission,
} from "@/lib/permissions";
import api from "../app/common";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

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

type FormMode = "create" | "update" | "deactivate" | "activate";
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
  /** Field-level (p3) access — refines what's editable/viewable within a section the role can already see. */
  fieldPermissions?: FieldPermission[];
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
  fieldPermissions = [],
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
  const [loading, setLoading] = useState(false);

  // ── Resolve section modes from backend permissions ─────────────────────────

  const rawBasicMode: SectionMode = getSectionMode(permissions, PERM_BASIC);
  const rawContactMode: SectionMode = getSectionMode(permissions, PERM_CONTACT);
  const rawRoleMode: SectionMode = (() => {
    const editMode = getSectionMode(permissions, PERM_ROLE);
    if (editMode !== "none") return editMode;
    return getSectionMode(permissions, PERM_ROLE_VIEW);
  })();

  // Activate and deactivate are status actions. User details should be read-only for both.
  const isStatusAction = mode === "deactivate" || mode === "activate";

  const basicMode: SectionMode =
    isStatusAction && rawBasicMode !== "none" ? "view" : rawBasicMode;
  const contactMode: SectionMode =
    isStatusAction && rawContactMode !== "none" ? "view" : rawContactMode;
  const roleMode: SectionMode =
    isStatusAction && rawRoleMode !== "none" ? "view" : rawRoleMode;

  // ── Resolve field-level (p3) modes, falling back to the section mode ───────
  function resolveFieldMode(
    section: string,
    field: string,
    sectionFallback: SectionMode
  ): SectionMode {
    const raw = getFieldMode(
      fieldPermissions,
      section,
      field,
      sectionFallback
    );
    return isStatusAction && raw !== "none" ? "view" : raw;
  }

  const firstNameMode = resolveFieldMode("basicDetails", "firstName", rawBasicMode);
  const lastNameMode = resolveFieldMode("basicDetails", "lastName", rawBasicMode);
  const employeeIdMode = resolveFieldMode("basicDetails", "employeeId", rawBasicMode);

  const emailMode = resolveFieldMode("contactDetails", "email", rawContactMode);
  const phoneMode = resolveFieldMode("contactDetails", "phone", rawContactMode);
  const addressMode = resolveFieldMode("contactDetails", "address", rawContactMode);

  const roleFieldMode = resolveFieldMode("roleAccess", "role", rawRoleMode);
  const departmentMode = resolveFieldMode("roleAccess", "department", rawRoleMode);

  // ── Action permissions ─────────────────────────────────────────────────────

  const canCreate = hasPermission(permissions, PERM_CREATE);
  const canUpdate = hasPermission(permissions, PERM_UPDATE);
  const canDeactivate = hasPermission(permissions, PERM_DEACTIVATE);
  const canActivate = hasPermission(permissions, PERM_ACTIVATE);

  // ── Primary action permission ──────────────────────────────────────────────

  const actionAllowed =
    mode === "create"
      ? canCreate
      : mode === "update"
      ? canUpdate
      : mode === "deactivate"
      ? canDeactivate
      : canActivate;

  function set(key: keyof UserFormData, value: string) {
    setFields((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!actionAllowed) return;

    try {
      setLoading(true);
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
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || "Failed to create user");
        }
      } else if (mode === "update" && userId) {
        await api.put(`/user-management/users/${userId}`, payload);
      } else if (mode === "deactivate" && userId) {
        await api.patch(`/user-management/users/${userId}/deactivate`);
      } else if (mode === "activate" && userId) {
        await api.patch(`/user-management/users/${userId}/activate`);
      } else {
        return;
      }

      setSaved(true);

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 500);
      }
    } catch (error: any) {
      console.error("User save failed:", error);
    } finally {
      setLoading(false);
    }
  }

  // ── Success State ───────────────────────────────────────────────────────────

  if (saved) {
    const successLabel =
      mode === "create"
        ? "created"
        : mode === "update"
        ? "updated"
        : mode === "deactivate"
        ? "deactivated"
        : "activated";

    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xs text-center space-y-3">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-lg">
          ✓
        </div>
        <h3 className="text-sm font-bold text-neutral-900">
          User {successLabel} successfully.
        </h3>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setSaved(false);
            if (mode !== "create" && onCancel) {
              onCancel();
            }
          }}
        >
          {mode === "create" ? "Add Another User" : "Done"}
        </Button>
      </div>
    );
  }

  // ── No Access ──────────────────────────────────────────────────────────────

  if (basicMode === "none" && contactMode === "none" && roleMode === "none") {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center text-xs text-neutral-500">
        You do not have permission to view this form.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Section 1: Basic Details ── */}
      {basicMode !== "none" && (
        <FormSection
          title="Basic Details"
          mode={basicMode}
          description="Name and employee identifier."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {firstNameMode !== "none" && (
              <Field
                label="First Name"
                value={fields.firstName}
                onChange={(v) => set("firstName", v)}
                readonly={firstNameMode === "view"}
                required={firstNameMode === "edit" && mode === "create"}
              />
            )}

            {lastNameMode !== "none" && (
              <Field
                label="Last Name"
                value={fields.lastName}
                onChange={(v) => set("lastName", v)}
                readonly={lastNameMode === "view"}
                required={lastNameMode === "edit" && mode === "create"}
              />
            )}

            {employeeIdMode !== "none" && (
              <Field
                label="Employee ID"
                value={fields.employeeId}
                onChange={(v) => set("employeeId", v)}
                readonly={employeeIdMode === "view"}
                placeholder="e.g. EMP-00123"
              />
            )}
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
            {emailMode !== "none" && (
              <Field
                label="Email Address"
                type="email"
                value={fields.email}
                onChange={(v) => set("email", v)}
                readonly={emailMode === "view"}
                required={emailMode === "edit" && mode === "create"}
              />
            )}

            {phoneMode !== "none" && (
              <Field
                label="Phone Number"
                type="tel"
                value={fields.phone}
                onChange={(v) => set("phone", v)}
                readonly={phoneMode === "view"}
                placeholder="+91 XXXXX XXXXX"
              />
            )}

            {addressMode !== "none" && (
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                  Office Address
                </label>
                {addressMode === "view" ? (
                  <div className="min-h-[50px] w-full rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                    {fields.address || <span className="text-neutral-300">—</span>}
                  </div>
                ) : (
                  <textarea
                    rows={2}
                    value={fields.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="Office / building address"
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 text-xs text-neutral-800 placeholder-neutral-400 outline-none focus:border-neutral-400 focus:bg-white focus:ring-1 focus:ring-neutral-400"
                  />
                )}
              </div>
            )}
          </div>
        </FormSection>
      )}

      {/* ── Section 3: Role & Access ── */}
      {roleMode !== "none" && (
        <FormSection
          title="Role & Access"
          mode={roleMode}
          description="Assign the user's role, department, and view assigned access policies."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {roleFieldMode !== "none" && (
              <Field
                label="Role"
                value={fields.role}
                onChange={(v) => set("role", v)}
                readonly={roleFieldMode === "view"}
                placeholder="e.g. Support Initiator"
              />
            )}

            {departmentMode !== "none" && (
              <Field
                label="Department"
                value={fields.department}
                onChange={(v) => set("department", v)}
                readonly={departmentMode === "view"}
                placeholder="e.g. Operations"
              />
            )}
          </div>

          {/* Assigned Permissions Tags */}
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Assigned Casbin Policies
            </p>

            {permissions.length === 0 ? (
              <p className="text-xs text-neutral-400">No permissions assigned.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {permissions.map((p) => (
                  <span
                    key={p.permission}
                    className="inline-flex items-center rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-mono text-neutral-600"
                  >
                    <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-neutral-400" />
                    {p.permission}
                  </span>
                ))}
              </div>
            )}
          </div>
        </FormSection>
      )}

      {/* ── Deactivation Reason ── */}
      {mode === "deactivate" && (
        <section className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-6">
          <h3 className="mb-1 text-sm font-bold text-neutral-900">
            Deactivation Reason
          </h3>
          <p className="mb-3 text-xs text-neutral-500">
            Required. Explain why this user account is being deactivated.
          </p>

          {actionAllowed ? (
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              placeholder="e.g. Employee separation, role transfer…"
              className="w-full rounded-lg border border-neutral-200 bg-white p-3 text-xs text-neutral-800 placeholder-neutral-400 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400"
            />
          ) : (
            <p className="text-xs text-red-500">
              You do not have permission to deactivate users.
            </p>
          )}
        </section>
      )}

      {/* ── Activation Notice ── */}
      {mode === "activate" && (
        <section className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-6">
          <h3 className="mb-1 text-sm font-bold text-neutral-900">
            Activate Account
          </h3>
          <p className="text-xs text-neutral-500">
            This account is currently inactive. Activating the user will restore their authorization access.
          </p>
        </section>
      )}

      {/* ── Actions Row ── */}
      <div className="flex items-center gap-3 pt-2">
        {actionAllowed ? (
          <Button
            type="submit"
            variant={mode === "deactivate" ? "danger" : "primary"}
            size="md"
            isLoading={loading}
          >
            {mode === "create"
              ? "Create User"
              : mode === "update"
              ? "Update User"
              : mode === "deactivate"
              ? "Deactivate Account"
              : "Activate Account"}
          </Button>
        ) : (
          <div className="rounded-lg border border-neutral-200 bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-400">
            Action not permitted
          </div>
        )}

        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onCancel}
          >
            Cancel
          </Button>
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
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xs">
      <div className="mb-4 flex items-center justify-between gap-4 border-b border-neutral-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-neutral-500 font-normal">
              {description}
            </p>
          )}
        </div>

        <Badge variant="neutral" dot={mode === "edit"}>
          {mode === "edit" ? "Editable" : "View Only"}
        </Badge>
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
      <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {readonly ? (
        <div className="w-full rounded-lg border border-neutral-100 bg-neutral-50 px-3.5 py-2 text-xs text-neutral-700">
          {value || <span className="text-neutral-300">—</span>}
        </div>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          className="w-full rounded-lg border border-neutral-200 bg-neutral-50/50 px-3.5 py-2 text-xs text-neutral-800 placeholder-neutral-400 outline-none transition focus:border-neutral-400 focus:bg-white focus:ring-1 focus:ring-neutral-400"
        />
      )}
    </div>
  );
}