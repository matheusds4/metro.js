/**
 * Logical pixels conversion to cascading `rem`.
 */
export const pixels = {
  /**
   * Returns a cascading `rem` unit.
   */
  remPlusUnit(value: number): string {
    return pixels.rem(value) + "em";
  },

  /**
   * Returns a cascading `rem` unit's value.
   */
  rem(value: number): number {
    return value * 0.0625;
  }
};

/**
 * Cascading `rem` conversion to logical pixels.
 */
export const rem = {
  /**
   * Returns logical pixels from `rem`.
   */
  pixels(value: number): number {
    return value * 16;
  },
};