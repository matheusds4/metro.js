import * as React from "react";
import { Color } from "@hydroperx/color";

/**
 * Basic theme description specifying the color scheme.
 */
export type Theme = {
  colors: {
    /**
     * Background color.
     */
    background: string;

    /**
     * Foreground color (e.g. for text).
     */
    foreground: string;

    /**
     * Used in components such as text inputs, tooltips and popover menu.
     */
    inputBackground: string;

    /**
     * Used in components such as text inputs, tooltips and popover menu.
     */
    inputBorder: string;

    /**
     * Progress bar's background.
     */
    progressBarBackground: string;

    /**
     * Progress bar's foreground (the loaded part).
     */
    progressBarForeground: string;

    /**
     * Slider background.
     */
    sliderBackground: string;

    /**
     * Slider's past background.
     */
    sliderPastBackground: string;

    /**
     * Anchor link color.
     */
    anchor: string;

    /**
     * Scrollbar track (the non-draggable part) color.
     */
    scrollBarTrack: string;

    /**
     * Scrollbar thumb (the draggable part) color.
     */
    scrollBarThumb: string;

    /**
     * Used in buttons for instance.
     */
    primary: string;
    /**
     * Used in buttons for instance.
     */
    primaryForeground: string;

    /**
     * Background used in pressed buttons for instance.
     */
    pressed: string;
    /**
     * Used in pressed buttons for instance.
     */
    pressedForeground: string;

    /**
     * Used in buttons for instance.
     */
    secondary: string;

    /**
     * Used in buttons and label colors for instance.
     */
    danger: string;
    /**
     * Used in buttons for instance.
     */
    dangerForeground: string;

    /**
     * Warning color used in labels. (For example, in a `FormGroup`.)
     */
    warning: string;

    /**
     * Used in certain focusable components such as buttons.
     */
    focusDashes: string;
  };
};

const light: Theme = {
  colors: {
    background: "#fff",
    foreground: "#000",

    inputBorder: "#b5b5b5",
    inputBackground: "#fff",

    progressBarBackground: "#777",
    progressBarForeground: "#000",

    sliderBackground: "#777",
    sliderPastBackground: "#3a00c8",

    anchor: "#b700f3",

    scrollBarTrack: "#E9E9E9",
    scrollBarThumb: "#CDCDCD",

    primary: "#3a00c8",
    primaryForeground: "#fff",

    pressed: "#000",
    pressedForeground: "#fff",

    secondary: "#b5b5b5",

    danger: "#e50000",
    dangerForeground: "#fff",

    warning: "#990",

    focusDashes: "#000",
  },
};

const dark: Theme = {
  colors: {
    background: "#1d1d1d",
    foreground: "#fff",

    inputBorder: "#555",
    inputBackground: "#232323",

    progressBarBackground: "#555",
    progressBarForeground: "#fff",

    sliderBackground: "#555",
    sliderPastBackground: "#3a00c8",

    anchor: "#695C97",

    scrollBarTrack: "rgba(0,0,0,0)",
    scrollBarThumb: "#333",

    primary: "#3a00c8",
    primaryForeground: "#fff",

    pressed: "#fff",
    pressedForeground: "#000",

    secondary: "#777",

    danger: "#e50000",
    dangerForeground: "#fff",

    warning: "#ee3",

    focusDashes: "#fff",
  },
};

// Purple
const purple: Theme = structuredClone(dark);
purple.colors.background = purple.colors.primary = "#180053";

// Green
const green = structuredClone(dark);
green.colors.background = "#3F8700";
green.colors.primary = "#4F970E";
green.colors.sliderPastBackground = green.colors.primary;
green.colors.anchor = "#ef7127";

/**
 * Theme presets.
 */
export const ThemePresets = {
  light,
  dark,
  purple,
  green,
};

/**
 * Theme context.
 */
export const ThemeContext = React.createContext<Theme>(light);

/**
 * Theme provider.
 */
export function ThemeProvider({
  theme,
  children,
}: {
  theme: Theme;
  children?: React.ReactNode;
}) {
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

/**
 * Context indicating whether to prefer theme's primary colors.
 */
export const PrimaryContext = React.createContext<boolean>(false);

/**
 * Provider indicating whether to prefer theme's primary colors.
 */
export function Primary({
  prefer,
  children,
}: {
  prefer: boolean;
  children?: React.ReactNode;
}) {
  return (
    <PrimaryContext.Provider value={prefer}>
      {children}
    </PrimaryContext.Provider>
  );
}
