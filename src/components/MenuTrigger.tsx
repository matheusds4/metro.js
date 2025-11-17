// third-party
import assert from "assert";
import React from "react";

// local
import type { PopoverMenuOpenParams } from "./PopoverMenu";
import { SimplePlacementType } from "../utils/PlacementUtils";

/**
 * Trigger for buttons combined with popover menus.
 *
 * @example
 * ```
 * <MenuTrigger>
 *     <Button>click me</Button>
 *     <PopoverMenu>
 *         <Item>
 *             <span></span>
 *             <Label>option a</Label>
 *             <span></span>
 *         </Item>
 *     </PopoverMenu>
 * </MenuTrigger>
 * ```
 */
export function MenuTrigger(params: {
  /**
   * Which placement to prefer for the menu to be placed at.
   */
  prefer?: SimplePlacementType,

  id?: string,
  className?: string,
  style?: React.CSSProperties,
  children?: React.ReactNode,
}): React.ReactNode {
  // prefer sync
  const prefer_sync = React.useRef(params.prefer ?? "bottom");

  // div
  const div = React.useRef<null | HTMLDivElement>(null);
  const menu = React.useRef<null | HTMLElement>(null);

  // initialization
  React.useEffect(() => {
    assert(div.current!.children.length >= 2, "Expected at least 2 children inside MenuTrigger.");
    const button = div.current!.children[0] as HTMLElement;

    window.setTimeout(() => {
      assert(button.classList.contains("Button"), "Expected first child of MenuTrigger to be a Button.");
      menu.current = div.current!.children[1] as HTMLElement;
      if (!menu.current!.classList.contains("PopoverMenu") && div.current!.children.length >= 3) {
        menu.current = div.current!.children[2] as HTMLElement
      }
      assert(menu.current!.classList.contains("PopoverMenu"), "Expected second/third child of MenuTrigger to be a PopoverMenu.");

      // handle click
      button.addEventListener("click", click);
    }, 10);

    // handle click
    function click(): void {
      const p: PopoverMenuOpenParams = {
        reference: button,
        prefer: prefer_sync.current,
      };

      // close tooltip if any
      button.dispatchEvent(new Event("_Tooltip_close"));

      // open PopoverMenu
      menu.current!.dispatchEvent(new CustomEvent("_PopoverMenu_open", {
        detail: p,
      }));
    }

    // cleaunp
    return () => {
      button.removeEventListener("click", click);
    };
  }, []);

  // sync prefer parameter
  React.useEffect(() => {
    prefer_sync.current = params.prefer ?? "bottom";
  }, [params.prefer]);

  return (
    <div
      className={["MenuTrigger", ...(params.className ?? "").split(" ").filter(c => c != "")].join(" ")}
      id={params.id}
      ref={div}
      style={params.style}>

      {params.children}
    </div>
  );
}