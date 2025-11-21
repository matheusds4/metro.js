//
let element: null | HTMLElement = null;
//
const updateFns: ((value: number) => void)[] = [];

/**
 * Observes the pixels measure of the cascading `rem` unit.
 */
export class REMObserver {
  /**
   * Cascading style class.
   */
  public static CLASS: string = "REMObserver-element";

  /**
   * Constructor.
   */
  constructor(private readonly updateFn: (value: number) => void) {
    updateFns.push(updateFn);
    updateFn(read());
  }

  /**
   * Cleanup
   */
  cleanup() {
    const i = updateFns.indexOf(this.updateFn);
    if (i != -1) {
      updateFns.splice(i, 1);
    }
  }
}

// element creation
if (typeof window === "object") {
  element = document.createElement("div");
  element.classList.add(REMObserver.CLASS);
  element.style.position = "absolute";
  element.style.left = "0";
  element.style.top = "0";
  element.style.pointerEvents = "none";
  element.style.width = "1rem";
  document.body.append(element!);

  const resize_observer = new ResizeObserver(() => {
    const val = read();
    for (const updateFn of updateFns) {
      updateFn(val);
    }
  });
  resize_observer.observe(element!);
}

// read font-size
function read(): number {
  const widthMatch = window
    .getComputedStyle(element!)
    .getPropertyValue("width")
    .match(/^(\d*\.?\d*)px$/);

  if (!widthMatch || widthMatch.length < 1) {
    return 0;
  }

  const result = Number(widthMatch[1]);
  return !isNaN(result) ? result : 0;
}