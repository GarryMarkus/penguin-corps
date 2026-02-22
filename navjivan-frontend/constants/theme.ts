

import { Platform } from "react-native";

const tintColorLight = "#39FF14";
const tintColorDark = "#39FF14";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#ffffff",
    tint: tintColorLight,
    icon: "#687076",
    card: "#f4f4f4",
  },
  dark: {
    text: "#ECEDEE",
    background: "#000000",
    tint: tintColorDark,
    icon: "#9BA1A6",
    card: "#111111",
  },
};


export const LPColors = {
  // Backgrounds
  bg: "#050B07", // Deep dark green/black
  surface: "#0E1F18", // Slightly lighter
  surfaceLight: "#1A2F26", // For cards/inputs
  surfaceHighlight: "#254035", // For active states

  // Brand Colors
  primary: "#39FF14", // Neon Green
  primaryDark: "#2bb810",
  secondary: "#00CF85", // Teal Green
  accent: "#00E5FF", // Cyan for variety

  // Text
  text: "#FFFFFF",
  textGray: "#A0AEC0",
  textMuted: "#6B7280",
  textHighlight: "#E2E8F0",

  // Status
  border: "#1F382A",
  success: "#39FF14",
  error: "#FF453A",
  warning: "#FFD60A",
  info: "#00E5FF",

  // UI Elements
  neon: "#39FF14",
  card: "#0E1F18",
  gray: "#A0AEC0",
  
  // Gradients
  gradientStart: "#39FF14",
  gradientEnd: "#00CF85",
  
  // Shadows
  shadow: {
    shadowColor: "#39FF14",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  }
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono:
      "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
