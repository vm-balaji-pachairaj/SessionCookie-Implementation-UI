import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface MenuInfo {
  key: string;
  lob: string;
  parent: string;
  displayName: string;
  route: string;
  icon: string;
  order: number;
}

interface MenuState {
  menus: MenuInfo[];
}

const initialState: MenuState = {
  menus: [],
};

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    setMenus: (state, action: PayloadAction<MenuInfo[]>) => {
      state.menus = action.payload;
    },

    clearMenus: (state) => {
      state.menus = [];
    },
  },
});

export const { setMenus, clearMenus } = menuSlice.actions;

export default menuSlice.reducer;