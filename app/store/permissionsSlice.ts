// app/store/permissionsSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

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

interface PermissionsState {
  permissions: Permission[];
  fieldPermissions: FieldPermission[];
}

const initialState: PermissionsState = {
  permissions: [],
  fieldPermissions: [],
};

const permissionsSlice = createSlice({
  name: "permissions",
  initialState,
  reducers: {
    setPermissions: (state, action: PayloadAction<Permission[]>) => {
      state.permissions = action.payload;
    },
    clearPermissions: (state) => {
      state.permissions = [];
    },
    setFieldPermissions: (state, action: PayloadAction<FieldPermission[]>) => {
      state.fieldPermissions = action.payload;
    },
    clearFieldPermissions: (state) => {
      state.fieldPermissions = [];
    },
  },
});

export const {
  setPermissions,
  clearPermissions,
  setFieldPermissions,
  clearFieldPermissions,
} = permissionsSlice.actions;
export default permissionsSlice.reducer;