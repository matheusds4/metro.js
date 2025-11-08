// third-party
import React from "react";

// local
import * as ComboBoxStatic from "./combobox/ComboBoxStatic";
import { BUTTON_NAVIGABLE } from "../utils/Constants";

/**
 * Option inside a `ComboBox`.
 */
export function Option(params: {
  /**
   * Option's internal value.
   */
  value: string,

  className?: string,
  children?: React.ReactNode,
  style?: React.CSSProperties,
}): React.ReactNode {
  // button
  const button = React.useRef<null | HTMLButtonElement>(null);

  // value sync
  const value_sync = React.useRef<string>(params.value);

  // value sync
  React.useEffect(() => {
    value_sync.current = params.value;
  }, [params.value]);

  // update parent
  React.useEffect(() => {
    const p = button.current!.parentElement?.parentElement?.previousElementSibling;
    if (p?.classList.contains("ComboBox")) {
      p.dispatchEvent(new Event("_ComboBox_reflect"));
    }
  });

  // handle click
  function click(): void {
    const p = button.current!.parentElement;
    if (p?.classList.contains("ComboBox-list")) {
      if (Date.now() - ComboBoxStatic.cooldown < 50) {
        return;
      }
      ComboBoxStatic.change?.(value_sync.current);
      ComboBoxStatic.close?.();
    }
  }

  return (
    <button
      className={["Option", BUTTON_NAVIGABLE, ...(params.className ?? "").split(" ").filter(c => c != "")].join(" ")}
      style={params.style}
      data-value={params.value}
      onClick={click}
      onPointerOver={() => {
        button.current!.focus();
      }}
      ref={button}>

      {params.children}
    </button>
  );
}