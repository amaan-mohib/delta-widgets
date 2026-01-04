import {
  BrandVariants,
  createDarkTheme,
  createLightTheme,
  Theme,
} from "@fluentui/react-components";

const blue: BrandVariants = {
  10: "#020305",
  20: "#111723",
  30: "#17263E",
  40: "#193254",
  50: "#1B3F6B",
  60: "#1B4C83",
  70: "#18599C",
  80: "#1267B5",
  90: "#0475CF",
  100: "#3983D8",
  110: "#5A90DD",
  120: "#749EE2",
  130: "#8BACE7",
  140: "#A1BBEC",
  150: "#B7CAF0",
  160: "#CBD8F5",
};

export const lightTheme: Theme = {
  ...createLightTheme(blue),
};

export const darkTheme: Theme = {
  ...createDarkTheme(blue),
};

export const color = "#0078D4";

darkTheme.colorBrandForeground1 = blue[110];
darkTheme.colorBrandForeground2 = blue[120];
