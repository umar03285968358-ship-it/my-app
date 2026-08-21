const tintColorLight = "#F1731F";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

export const colors = {
  background: "#FDF6F0",
  card: "#FFFFFF",

  // Purple ↔ Orange swapped
  primaryDark: "#F1731F",
  primaryLight: "#FF914D",

  accentOrange: "#2A2560",
  accentOrangeDark: "#454091",

  textPrimary: "#211E3D",
  textSecondary: "#8A7B6E",
  border: "#EFE6DD",

  success: "#4CAF50",
  danger: "#E53935",

  white: "#FFFFFF",
  black: "#000000",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: "700" as const },
  h2: { fontSize: 22, fontWeight: "700" as const },
  h3: { fontSize: 18, fontWeight: "600" as const },
  body: { fontSize: 15, fontWeight: "400" as const },
  caption: { fontSize: 13, fontWeight: "400" as const },
  button: { fontSize: 16, fontWeight: "600" as const },
};
