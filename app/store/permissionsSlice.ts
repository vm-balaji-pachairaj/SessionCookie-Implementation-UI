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

interface PermissionsState {
  permissions: Permission[];
}

const initialState: PermissionsState = {
  permissions: [],
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
  },
});

export const { setPermissions, clearPermissions } = permissionsSlice.actions;
export default permissionsSlice.reducer;