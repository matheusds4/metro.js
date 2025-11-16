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

// gray
const gray = structuredClone(dark);
gray.colors.background = "#7c7c7c";
gray.colors.anchor = "#66de0d";
gray.colors.anchor = "#00e4ff";

// red
const red = structuredClone(dark);
red.colors.background = "#a52100";
red.colors.sliderPastBackground =
red.colors.primary = "#bb0000";
red.colors.anchor = "#66de0d";

// green
const green = structuredClone(dark);
green.colors.background = "#3F8700";
green.colors.sliderPastBackground =
green.colors.primary = "#4F970E";
green.colors.anchor = "#ef7127";

// blue
const blue = structuredClone(dark);
blue.colors.background = "#047dc4";
blue.colors.sliderPastBackground =
blue.colors.primary = "#0075d4";
blue.colors.anchor = "#26e4d0";

// purple
const purple: Theme = structuredClone(dark);
purple.colors.background = "#180053";

// pink
const pink = structuredClone(dark);
pink.colors.background = "#c55ac0";
pink.colors.sliderPastBackground =
pink.colors.primary = "#c500a4";
pink.colors.anchor = "#38e6e4";
pink.colors.danger = "#a50000";

// orange
const orange = structuredClone(dark);
orange.colors.background = "#cf7b0d";
orange.colors.sliderPastBackground =
orange.colors.primary = "#d8571c";
orange.colors.anchor = "#0ddecd";
orange.colors.danger = "#a00000";
orange.colors.warning = "#f8d800";

// yellow
const yellow = structuredClone(dark);
yellow.colors.background = "#d8ca08";
yellow.colors.sliderPastBackground =
yellow.colors.primary = "#ebc000";
yellow.colors.anchor = "#1a90fe";
yellow.colors.danger = "#fe1a1a";
yellow.colors.warning = "#e48101";

// brown
const brown = structuredClone(dark);
brown.colors.background = "#7c6a1a";
brown.colors.sliderPastBackground =
brown.colors.primary = "#9c8417";
brown.colors.anchor = "#01e4cc";
brown.colors.danger = "#fb2020";
brown.colors.warning = "#e2ca00";

// cyan
const cyan = structuredClone(dark);
cyan.colors.background = "#0cbdae";
cyan.colors.sliderPastBackground =
cyan.colors.primary = "#00d1c7";
cyan.colors.anchor = "#d741ed";

/**
 * A theme color used in the presets.
 */
export type ThemeColor =
  | "light"
  | "dark"
  | "gray"
  | "red"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "orange"
  | "yellow"
  | "brown"
  | "cyan"
  ;

const __map__ = new Map<ThemeColor, Theme>([
  ["light", light],
  ["dark", dark],
  ["gray", gray],
  ["red", red],
  ["green", green],
  ["blue", blue],
  ["purple", purple],
  ["pink", pink],
  ["orange", orange],
  ["yellow", yellow],
  ["brown", brown],
  ["cyan", cyan],
]);

/**
 * Theme preset utilities.
 */
export const ThemePresets = {
  /**
   * Returns the available colors that may be
   * used in the `ThemePresets.get()` method.
   *
   * Note that if you are trying to enumerate all possible theme
   * presets, do not forget about handling the accent.
   */
  available(): { color: ThemeColor, hex: string }[] {
    return Array.from(__map__.entries().map(([color, theme]) => ({
      color,
      hex: Color(theme.colors.primary).hex().toString(),
    })));
  },

  /**
   * Returns a `Theme` object matching the given colors.
   * 
   * @param accent Applicable when `preset` is one of {
   * `light`, `dark`, `gray` }. Ignored if equals one
   * of { `light`, `dark`, `gray` }.
   */
  get(preset: ThemeColor, accent: null | ThemeColor = null): Theme {
    if (accent
    && ["light", "dark", "gray"].includes(preset)
    && !["light", "dark", "gray"].includes(accent!)) {
      const result = structuredClone(__map__.get(preset)!);
      const accent_preset = __map__.get(accent!)!;

      // assign primary color
      result.colors.sliderPastBackground =
      result.colors.primary = accent_preset.colors.primary;

      return result;
    }
    return structuredClone(__map__.get(preset)!);
  },
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
