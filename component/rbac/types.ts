export type PermissionItem = {
  permission: string;
  lob: string;
  page: string;
  module: string;
  section: string;
  access: string;
  assigned?: boolean;
};

export type RoleItem = {
  role?: string;
  role_name?: string;
  role_id?: string | number;
  permissions?: {
    menus?: unknown[];
    pages?: PermissionItem[];
    defaultMenu?: string;
  };
};

export type FilterTab = "all" | "assigned" | "unassigned" | "edit" | "view";

export type FilterCounts = {
  total: number;
  assigned: number;
  unassigned: number;
  edit: number;
  view: number;
};

