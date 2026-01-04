import {
  BrandVariants,
  createDarkTheme,
  createLightTheme,
  Theme,
} from "@fluentui/react-components";

const defaultTheme: BrandVariants = {
  10: "#020304",
  20: "#11191D",
  30: "#182930",
  40: "#1E3540",
  50: "#25424F",
  60: "#2C505F",
  70: "#345D70",
  80: "#3D6B80",
  90: "#477A90",
  100: "#5188A1",
  110: "#5C97B1",
  120: "#68A6C1",
  130: "#75B5D2",
  140: "#83C4E2",
  150: "#91D3F2",
  160: "#A5E2FF",
};

export const lightTheme: Theme = {
  ...createLightTheme(defaultTheme),
};

export const darkTheme: Theme = {
  ...createDarkTheme(defaultTheme),
};

export const color = "#9EE0FF";

darkTheme.colorBrandForeground1 = defaultTheme[110];
darkTheme.colorBrandForeground2 = defaultTheme[120];
