// third-party
import * as React from "react";
import { Color } from "com.sweaxizone.color";

// local
import * as ColorUtils from "../utils/ColorUtils";

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
    sliderPastBackground: "#3000aa",

    anchor: "#b700f3",

    scrollBarTrack: "#E9E9E9",
    scrollBarThumb: "#CDCDCD",

    primary: "#3000aa",
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
    sliderPastBackground: "#8c5fff",

    anchor: "#695C97",

    scrollBarTrack: "rgba(0,0,0,0)",
    scrollBarThumb: "#333",

    primary: "#9c75ff",
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
gray.colors.sliderPastBackground =
gray.colors.primary = "#bebebe";
gray.colors.anchor = "#66de0d";
gray.colors.anchor = "#bebebe";

// graylight
const gray_light = structuredClone(light);
gray_light.colors.background = "#999";

// red
const red = structuredClone(dark);
red.colors.background = "#a52100";
red.colors.sliderPastBackground =
red.colors.primary = "#ff5c5c";
red.colors.anchor = "#66de0d";

// green
const green = structuredClone(dark);
green.colors.background = "#3F8700";
green.colors.sliderPastBackground =
green.colors.primary = "#88fc22";
green.colors.anchor = "#ff8e4c";

// blue
const blue = structuredClone(dark);
blue.colors.background = "#007ac0";
blue.colors.sliderPastBackground =
blue.colors.primary = "#3fa5f8";
blue.colors.anchor = "#26e4d0";

// purple
const purple: Theme = structuredClone(dark);
purple.colors.background = "#450086";
purple.colors.anchor = "#26e4d0";

// pink
const pink = structuredClone(dark);
pink.colors.background = "#b848b2";
pink.colors.sliderPastBackground =
pink.colors.primary = "#ff8bec";
pink.colors.anchor = "#38e6e4";
pink.colors.danger = "#a50000";

// orange
const orange = structuredClone(dark);
orange.colors.background = "#ca770a";
orange.colors.sliderPastBackground =
orange.colors.primary = "#ff8d40";
orange.colors.anchor = "#0ddecd";
orange.colors.danger = "#a00000";
orange.colors.warning = "#f8d800";

// yellow
const yellow = structuredClone(dark);
yellow.colors.background = "#c2b507";
yellow.colors.sliderPastBackground =
yellow.colors.primary = "#f7d958";
yellow.colors.anchor = "#1a90fe";
yellow.colors.danger = "#fe1a1a";
yellow.colors.warning = "#e48101";

// brown
const brown = structuredClone(dark);
brown.colors.background = "#7c6a1a";
brown.colors.sliderPastBackground =
brown.colors.primary = "#cfae18";
brown.colors.anchor = "#01e4cc";
brown.colors.danger = "#fb2020";
brown.colors.warning = "#e2ca00";

// cyan
const cyan = structuredClone(dark);
cyan.colors.background = "#00a396";
cyan.colors.sliderPastBackground =
cyan.colors.primary = "#09eee2";
cyan.colors.anchor = "#9b00b3";

/**
 * A theme color used in the presets.
 *
 * `gray` is a dark-gray.
 */
export type ThemeColor =
  | "light"
  | "dark"
  | "gray"
  | "graylight"
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
  ["dark", dark],
  ["gray", gray],
  ["graylight", gray_light],
  ["light", light],
  ["red", red],
  ["orange", orange],
  ["yellow", yellow],
  ["green", green],
  ["cyan", cyan],
  ["blue", blue],
  ["purple", purple],
  ["pink", pink],
  ["brown", brown],
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
   * `light`, `dark`, `gray`, `graylight` }. Ignored if equals one
   * of { `light`, `dark`, `graylight` }.
   */
  get(preset: ThemeColor, accent: null | ThemeColor = null): Theme {
    if (accent
    && ["light", "dark", "gray", "graylight"].includes(preset)
    && !["light", "dark", "graylight"].includes(accent!)) {
      const result = structuredClone(__map__.get(preset)!);
      const accent_preset = __map__.get(accent!)!;

      // find primary color
      let primary_color = Color(accent_preset.colors.primary);
      if (preset == "light") {
        for (let i = 0; i < 1024; i++) {
          if (primary_color.isLight()) {
            primary_color = primary_color.darken(0.05);
          } else {
            break;
          }
        }
      }

      // assign primary color
      result.colors.sliderPastBackground =
      result.colors.primary = primary_color.hex().toString();

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
