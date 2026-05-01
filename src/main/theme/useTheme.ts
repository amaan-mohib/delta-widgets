import { useEffect, useMemo, useState } from "react";
import { getStore } from "../../common";
import { useThemeStore } from "./useThemeStore";
import { getResolvedTheme } from "../../common/themes";
import { tokens } from "@fluentui/react-components";
import { commands } from "../../common/commands";

export const useTheme = () => {
  const { mode, color } = useThemeStore();
  const [initializing, setInitializing] = useState(true);

  const getTheme = async () => {
    const { mode, color, overrideTheme } = await getStore();
    useThemeStore.setState({
      mode: mode || "system",
      color: color || "default",
      overrideTheme: overrideTheme || false,
    });
    setInitializing(false);
  };

  const applyBlur = async (mode: string) => {
    try {
      let modeValue = mode;
      if (mode === "system") {
        const isSysDark =
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches;
        modeValue = isSysDark ? "dark" : "light";
      }
      const themeApplied = await commands.applyBlurTheme({
        mode: modeValue,
        label: "main",
      });
      const mainWindow = document.querySelector<HTMLDivElement>(".main-window");
      if (!mainWindow) return;
      if (themeApplied) {
        mainWindow.style.backgroundColor = "transparent";
        document.body.style.backgroundColor = "transparent";
      } else {
        mainWindow.style.backgroundColor = tokens.colorNeutralBackground2;
        document.body.style.backgroundColor = "#1f1f1f";
      }
    } catch (error) {
      console.error("Could not apply blur", error);
    }
  };

  useEffect(() => {
    if (initializing) {
      return;
    }
    applyBlur(mode);
  }, [mode, initializing]);

  useEffect(() => {
    getTheme();
  }, []);

  const theme = useMemo(() => {
    return getResolvedTheme(mode, color);
  }, [mode, color]);

  return { theme };
};
