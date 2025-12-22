import {
  BrandVariants,
  createDarkTheme,
  createLightTheme,
  Theme,
} from "@fluentui/react-components";

const red: BrandVariants = {
  10: "#060201",
  20: "#26110D",
  30: "#411715",
  40: "#581C1B",
  50: "#6F2020",
  60: "#872325",
  70: "#A0252B",
  80: "#AD3A39",
  90: "#B74E4A",
  100: "#C1615B",
  110: "#CA746C",
  120: "#D3867E",
  130: "#DB9891",
  140: "#E3AAA4",
  150: "#EABDB7",
  160: "#F1CFCB",
};

export const lightTheme: Theme = {
  ...createLightTheme(red),
};

export const darkTheme: Theme = {
  ...createDarkTheme(red),
};

export const color = "#A4262C";

darkTheme.colorBrandForeground1 = red[110];
darkTheme.colorBrandForeground2 = red[120];
