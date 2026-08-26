import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface MenuState {
  menus: string[];
}

const initialState: MenuState = {
  menus: [],
};

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    setMenus: (state, action: PayloadAction<string[]>) => {
      state.menus = action.payload;
    },

    clearMenus: (state) => {
      state.menus = [];
    },
  },
});

export const { setMenus, clearMenus } = menuSlice.actions;

export default menuSlice.reducer;