import { ESCAPABLE } from "./Constants";

/**
 * Checks whether a container is escapable based
 * on the `ESCAPABLE` class name.
 */
export function escapable(target: HTMLElement): boolean {
  const escapables = Array.from(document.documentElement.getElementsByClassName(ESCAPABLE)) as HTMLElement[];
  const i = escapables.indexOf(target);
  if (i != -1) {
    escapables.splice(i, 1);
  } else {
    return false;
  }
  for (const e of escapables) {
    if (e.checkVisibility({
      contentVisibilityAuto: true,
      visibilityProperty: true,
      opacityProperty: true,
    })) {
      const deeper = compareNesting(target, e);
      if (deeper == e) {
        return false;
      }
    }
  }
  return true;
}

function compareNesting(a: HTMLElement, b: HTMLElement): HTMLElement | null {
  if (a === b) return null;

  // Quick check: is A inside B?
  if (b.contains(a)) return a;

  // Quick check: is B inside A?
  if (a.contains(b)) return b;

  // They are in unrelated parts of the DOM.
  // Compare depth in the document tree.
  const depthA = getDomDepth(a);
  const depthB = getDomDepth(b);

  if (depthA > depthB) return a;
  if (depthB > depthA) return b;

  // Same depth but not related
  // → neither is more nested
  return null;
}

function getDomDepth(el: HTMLElement | null): number {
  let depth = 0;
  while (el) {
    depth++;
    el = el.parentElement;
  }
  return depth;
}