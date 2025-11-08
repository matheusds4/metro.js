import { Color } from "@hydroperx/color";

/**
 * Returns a value between 0 and 100 inclusive that determines
 * the difference between the two given colors.
 */
export function delta(a: any, b: any): number {
  return Color(a).delta(Color(b));
}

/**
 * Determines if two colors are close.
 */
export function like(a: any, b: any): boolean {
  return delta(a, b) <= 20;
}

/**
 * Enhances brightness of a color in a given background.
 */
export function enhance({ background, color }: {
  background: any,
  color: any,
}): string {
  const a = Color(background);
  const b = Color(color);
  if (like(a, b)) {
    let r = a.isDark() ? lighten(b, 0.25) : darken(b, 0.25);
    r = a.isDark()
      ? (Color(r).isDark()
        ? lighten(r, 0.25)
        : r)
      : (Color(r).isLight()
        ? darken(r, 0.25)
        : r);
    r = a.isDark()
      ? (Color(r).isDark()
        ? lighten(r, 0.25)
        : r)
      : (Color(r).isLight()
        ? darken(r, 0.25)
        : r);
    return r;
  }
  let r = (
    a.isDark()
      ? (b.isDark()
        ? lighten(b, 0.25)
        : b.toString())
      : (b.isLight()
        ? darken(b, 0.25)
        : b.toString())
  );
  r = (
    a.isDark()
      ? (Color(r).isDark()
        ? lighten(r, 0.25)
        : r.toString())
      : (Color(r).isLight()
        ? darken(r, 0.25)
        : r.toString())
  );
  return r;
}

/**
 * Forced darkening of a color.
 */
export function darken(a: any, ratio: number): string {
  a = Color(a);
  let r = a.darken(ratio);
  if (delta(a, r) < 10) {
    r = r.darken(ratio);
  }
  return r.toString();
}

/**
 * Forced enlightening of a color.
 */
export function lighten(a: any, ratio: number): string {
  a = Color(a);
  let r = a.lighten(ratio);
  if (delta(a, r) < 10) {
    r = r.lighten(ratio);
  }
  return r.toString();
}

/**
 * Lightens a color if dark; darkens a color if light.
 */
export function contrast(a: any, ratio: number): string {
  a = Color(a);
  return a.isLight() ? darken(a, ratio) : lighten(a, ratio);
}
