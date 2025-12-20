import {
  BrandVariants,
  createDarkTheme,
  createLightTheme,
  Theme,
} from "@fluentui/react-components";

const yellow: BrandVariants = {
  10: "#050301",
  20: "#1E170A",
  30: "#322610",
  40: "#413112",
  50: "#513C13",
  60: "#614815",
  70: "#725415",
  80: "#836016",
  90: "#956D15",
  100: "#A77A15",
  110: "#B98713",
  120: "#CC9411",
  130: "#DFA20C",
  140: "#F2AF06",
  150: "#FFBF3A",
  160: "#FFD489",
};

export const lightTheme: Theme = {
  ...createLightTheme(yellow),
};

export const darkTheme: Theme = {
  ...createDarkTheme(yellow),
};

export const color = "#FFB900";

darkTheme.colorBrandForeground1 = yellow[110];
darkTheme.colorBrandForeground2 = yellow[120];
