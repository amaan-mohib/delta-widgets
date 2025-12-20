import { useEffect, useMemo } from "react";
import { getStore } from "../../common";
import { useThemeStore } from "./useThemeStore";
import { getResolvedTheme } from "../../common/themes";

export const useTheme = () => {
  const { mode, color } = useThemeStore();

  const getTheme = async () => {
    const { mode, color, overrideTheme } = await getStore();
    useThemeStore.setState({
      mode: mode || "system",
      color: color || "default",
      overrideTheme: overrideTheme || false,
    });
  };

  useEffect(() => {
    getTheme();
  }, []);

  const theme = useMemo(() => {
    return getResolvedTheme(mode, color);
  }, [mode, color]);

  return { theme };
};
