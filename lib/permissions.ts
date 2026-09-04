/**
 * Shared permission utilities.
 *
 * Permissions flow as props from the /dashboard API response — there is no
 * global context. These helpers keep permission logic out of components.
 */

export interface Permission {
  permission: string;
  lob: string;
  page: string;
  module: string;
  section: string;
  access: string;
}

/** Field-level (p3) permission — same shape as Permission plus `field`. */
export interface FieldPermission {
  permission: string;
  lob: string;
  page: string;
  module: string;
  section: string;
  field: string;
  access: string;
}

/** True when the exact permission key is present in the list. */
export function hasPermission(permissions: Permission[], key: string): boolean {
  return permissions.some((p) => p.permission === key);
}

/**
 * Determine how a form section should behave by reading the `access` field
 * that the backend places on each permission object:
 *
 *   "edit"  – the matching permission has access === "edit"
 *   "view"  – the matching permission has access === "view"
 *   "none"  – no matching permission exists
 *
 * @param key  The exact permission string returned by the backend.
 */
export function getSectionMode(
  permissions: Permission[],
  key: string
): "edit" | "view" | "none" {
  const perm = permissions.find((p) => p.permission === key);
  if (!perm) return "none";
  if (perm.access === "edit") return "edit";
  if (perm.access === "view") return "view";
  return "none";
}

/**
 * Determine how a single field should behave: looks for a p3 field-level
 * grant matching `section` + `field` first ("edit"/"view"/"none"); if none
 * exists, falls back to the section's own mode so roles without any p3
 * rows yet keep working exactly as before.
 */
export function getFieldMode(
  fieldPermissions: FieldPermission[],
  section: string,
  field: string,
  fallback: "edit" | "view" | "none" = "none"
): "edit" | "view" | "none" {
  const perm = fieldPermissions.find(
    (p) => p.section === section && p.field === field
  );
  if (!perm) return fallback;
  if (perm.access === "edit") return "edit";
  if (perm.access === "view") return "view";
  return fallback;
}
