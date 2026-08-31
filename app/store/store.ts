import { configureStore } from "@reduxjs/toolkit";
import menuReducer from "./menuSlice";
import permissionsReducer from "./permissionsSlice"

export const store = configureStore({
  reducer: {
    menu: menuReducer,
    permissions: permissionsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;