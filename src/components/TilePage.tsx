// third-party
import React from "react";
import { styled } from "styled-components";
import { Color } from "@hydroperx/color";

// local
import { TileSize } from "../liveTiles/TileSize";
import { RTLContext } from "../layout/RTL";
import { ThemeContext, Theme } from "../theme/Theme";
import * as ColorUtils from "../utils/ColorUtils";
import { REMObserver } from "../utils/REMObserver";

/**
 * Live tile page put inside a `Tile` component.
 */
export function TilePage(params: {
  className?: string,
  id?: string,
  style?: React.CSSProperties,
  children?: React.ReactNode,
  ref?: React.Ref<null | HTMLDivElement>,

  /**
   * Page structure type, like `"custom"`, `"iconLabel"` or `"labelIcon"`.
   * @default "custom"
   */
  variant?: TilePageVariant,

  /**
   * Size condition.
   * @example
   * ```
   * size="small" // equals
   * size="=small" // equals
   * size=">=wide" // greater-than-or-equals
   * size="<wide" // less-than
   * ```
   */
  size?: string,

}): React.ReactNode {

  //
  const div_ref = React.useRef<null | HTMLDivElement>(null);

  // updating size condition should reset
  // page roll animation.
  React.useEffect(() => {
    div_ref.current!.parentElement!.parentElement!.dispatchEvent(new Event("_Tile_pageRollReset"));
  }, [params.size]);

  return (
    <div
      className={[
        "TilePage",
        ...(params.className ?? "").split(" ").filter(c => c != "")
      ].join(" ")}
      id={params.id}
      style={params.style}
      ref={obj => {
        div_ref.current = obj;
        if (typeof params.ref == "function") {
          params.ref(obj);
        } else if (params.ref) {
          params.ref!.current = obj;
        }
      }}
      data-variant={(params.variant || "custom").toString()}
      data-size={params.size}>

      {params.children}
    </div>
  );
}

/**
 * Structure type of a `TilePage` component.
 *
 * - `custom` is used for pages that may contain any DOM.
 * - `iconLabel` is used for organizing an icon +
 *   a normal label together.
 * - `labelIcon` is used for organizing a heading label +
 *   a smaller icon together.
 */
export type TilePageVariant =
  | "custom"
  | "iconLabel"
  | "labelIcon";