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
