import {
  BrandVariants,
  createDarkTheme,
  createLightTheme,
  Theme,
} from "@fluentui/react-components";

const green: BrandVariants = {
  10: "#020401",
  20: "#101C0A",
  30: "#142F10",
  40: "#163D11",
  50: "#174C12",
  60: "#175A12",
  70: "#156A12",
  80: "#117910",
  90: "#308728",
  100: "#4B9440",
  110: "#62A156",
  120: "#79AE6D",
  130: "#8EBB84",
  140: "#A4C89A",
  150: "#BAD5B2",
  160: "#CFE2C9",
};

export const lightTheme: Theme = {
  ...createLightTheme(green),
};

export const darkTheme: Theme = {
  ...createDarkTheme(green),
};

export const color = "#107C10";

darkTheme.colorBrandForeground1 = green[110];
darkTheme.colorBrandForeground2 = green[120];
