import { create } from "zustand";

interface IThemeStore {
  mode: string;
  color: string;
  overrideTheme: boolean;
}

export const useThemeStore = create<IThemeStore>(() => ({
  mode: "system",
  color: "default",
  overrideTheme: false,
}));
