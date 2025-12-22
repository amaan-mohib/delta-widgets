import { useEffect, useMemo, useState } from "react";
import { getResolvedTheme } from "../../common/themes";
import { getStore } from "../../common";
import { useDataTrackStore } from "../stores/useDataTrackStore";

export const useTheme = () => {
  const [{ mode, color }, setTheme] = useState({
    mode: "system",
    color: "default",
  });
  const manifestTheme = useDataTrackStore(
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
    setTheme(value);
  };

  useEffect(() => {
    getTheme();
  }, [manifestTheme]);

  const theme = useMemo(() => {
    return getResolvedTheme(mode, color);
  }, [mode, color]);

  return { theme };
};
