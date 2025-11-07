// third-party
import * as React from "react";

/**
 * A context-dependent item component. Currently used
 * inside a `PopoverMenu`.
 */
export function Item(params: {
  disabled?: boolean,

  children?: React.ReactNode,
  className?: string,
  id?: string,
  style?: React.CSSProperties,
}): React.ReactNode {
  return (
    <button
      className={
        ["Item", ...(params.className ?? "").split(" ").filter(c => c != "")].join(" ")
      }
      id={params.id}
      style={params.style}
      disabled={params.disabled}>

      {params.children}
    </button>
  );
}