import { useEffect, useMemo } from "react";
import { useThemeStore } from "./useThemeStore";
import { getResolvedTheme } from "../../common/themes";
import { getStore } from "../../common";
import { useManifestStore } from "../stores/useManifestStore";

export const useTheme = () => {
  const { mode, color } = useThemeStore();
  const manifestTheme = useManifestStore(
    (state) => state.manifest?.theme || null
  );

  const getTheme = async () => {
    const { mode, color, overrideTheme } = await getStore();
    const value = {
      mode: "system",
      color: "default",
      overrideTheme: overrideTheme || false,
    };
    if (value.overrideTheme) {
      value.mode = mode || "system";
      value.color = color || "default";
    }
    if (manifestTheme) {
      value.mode = manifestTheme.mode;
      value.color = manifestTheme.color;
    }
    useThemeStore.setState(value);
  };

  useEffect(() => {
    getTheme();
  }, [manifestTheme]);

  const theme = useMemo(() => {
    return getResolvedTheme(mode, color);
  }, [mode, color]);

  return { theme };
};
