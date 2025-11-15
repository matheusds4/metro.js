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
  const a_isDark = a.isDark();
  const b = Color(color);
  let r = (
    a_isDark
      ? (b.isDark()
        ? lighten(b, 0.25)
        : b.toString())
      : (b.isLight()
        ? darken(b, 0.25)
        : b.toString())
  );
  for (let i = 0; i < 5; i++) {
    if (a_isDark) {
      if (Color(r).isDark()) {
        r = lighten(r, 0.0045);
      } else {
        break;
      }
    } else if (Color(r).isLight()) {
      r = darken(r, 0.0045);
    } else {
      break;
    }
  }
  return r;
}

/**
 * Color alpha=0 if backgrund is far different.
 */
export function alphaZeroIfFar({ background, color }: {
  background: any,
  color: any,
}): string {
  return like(background, color) ? color : Color(color).alpha(0).toString();
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
