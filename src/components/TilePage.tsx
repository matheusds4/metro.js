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

}): React.ReactNode {

  return (
    <div
      className={[
        "TilePage",
        ...(params.className ?? "").split(" ").filter(c => c != "")
      ].join(" ")}
      id={params.id}
      style={params.style}
      ref={params.ref}
      data-variant={(params.variant || "custom").toString()}>

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