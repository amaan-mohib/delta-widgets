import { create } from "zustand";
import { defaultTheme } from "../../common/themes";

interface IThemeStore {
  mode: string;
  color: string;
  overrideTheme: boolean;
}

export const useThemeStore = create<IThemeStore>(() => ({
  mode: "system",
  color: defaultTheme.color,
  overrideTheme: false,
}));
