import {
  color as colorBlue,
  darkTheme as darkThemeBlue,
  lightTheme as lightThemeBlue,
} from "./blue";
import {
  color as colorGreen,
  darkTheme as darkThemeGreen,
  lightTheme as lightThemeGreen,
} from "./green";
import {
  color as colorRed,
  darkTheme as darkThemeRed,
  lightTheme as lightThemeRed,
} from "./red";
import {
  color as colorYellow,
  darkTheme as darkThemeYellow,
  lightTheme as lightThemeYellow,
} from "./yellow";
import {
  color as colorDefault,
  darkTheme as darkThemeDefault,
  lightTheme as lightThemeDefault,
} from "./default";

const blue = {
  lightTheme: lightThemeBlue,
  darkTheme: darkThemeBlue,
  color: colorBlue,
};

const green = {
  lightTheme: lightThemeGreen,
  darkTheme: darkThemeGreen,
  color: colorGreen,
};

const yellow = {
  lightTheme: lightThemeYellow,
  darkTheme: darkThemeYellow,
  color: colorYellow,
};

const red = {
  lightTheme: lightThemeRed,
  darkTheme: darkThemeRed,
  color: colorRed,
};

const defaultTheme = {
  lightTheme: lightThemeDefault,
  darkTheme: darkThemeDefault,
  color: colorDefault,
};

export const getResolvedTheme = (mode: string, color: string) => {
  let theme = darkThemeDefault;
  let modeValue = mode;
  if (mode === "system") {
    const isSysDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    modeValue = isSysDark ? "dark" : "light";
  }
  const isDark = modeValue === "dark";
  if (color === "blue") {
    theme = isDark ? blue.darkTheme : blue.lightTheme;
  } else if (color === "red") {
    theme = isDark ? red.darkTheme : red.lightTheme;
  } else if (color === "green") {
    theme = isDark ? green.darkTheme : green.lightTheme;
  } else if (color === "yellow") {
    theme = isDark ? yellow.darkTheme : yellow.lightTheme;
  } else {
    theme = isDark ? defaultTheme.darkTheme : defaultTheme.lightTheme;
  }
  if (isDark) {
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  }
  return theme;
};

export { blue, green, yellow, red, defaultTheme };
