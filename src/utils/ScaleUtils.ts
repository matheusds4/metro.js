/**
 * Computes the scale of an element, multiplying from predecessors.
 */
export function getScale(el: HTMLElement): { x: number, y: number } {
  let scaleX = 1;
  let scaleY = 1;
  let current: HTMLElement | null = el;

  while (current) {
    // Get computed style
    const computed_style = window.getComputedStyle(current);

    // Try looking at scale
    const scale = computed_style.scale;

    if (scale && scale !== "none") {
      const s1 = scale.split(/\s+/);
      const s1_x = parseFloat(s1[0]);
      const s1_y = s1[1] ? parseFloat(s1[1]) : s1_x;
      scaleX *= s1_x;
      scaleY *= s1_y;
      current = current.parentElement;
      continue;
    }

    // Try looking at transform
    const transform = computed_style.transform;

    if (transform && transform !== "none") {
      const match = transform.match(/^matrix\((.+)\)$/);
      if (match) {
        const values = match[1].split(",").map(parseFloat);
        // 2D matrix: a, b, c, d, e, f
        // scaleX = a, scaleY = d (shearing and rotation are ignored here)
        const a = values[0], d = values[3];
        scaleX *= a;
        scaleY *= d;
      }

      const match3d = transform.match(/^matrix3d\((.+)\)$/);
      if (match3d) {
        const values = match3d[1].split(",").map(parseFloat);
        // matrix3d index 0 = scaleX, index 5 = scaleY
        scaleX *= values[0];
        scaleY *= values[5];
      }
    }

    current = current.parentElement;
  }

  return { x: scaleX, y: scaleY };
}