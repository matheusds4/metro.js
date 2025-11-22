// third-party
import React from "react";
import { styled } from "styled-components";
import { gsap } from "gsap";
import { Color } from "@hydroperx/color";

// local
import { Icon } from "./Icon";
import { TileModeContext } from "./TileModeContext";
import { TileSize } from "../liveTiles/TileSize";
import { RTLContext } from "../layout/RTL";
import { ThemeContext, Theme } from "../theme/Theme";
import * as ColorUtils from "../utils/ColorUtils";
import { REMObserver } from "../utils/REMObserver";
import * as REMConvert from "../utils/REMConvert";

/**
 * Live tile drag-n-drop region inside a `Tiles` container.
 */
export function TileDND(params: {
  className?: string,
  id?: string,
  style?: React.CSSProperties,
  children?: React.ReactNode,
  ref?: React.Ref<null | HTMLDivElement>,

}): React.ReactNode {
  return (
    <TileDND_div
      className={[
        "TileDND",
        ...(params.className ?? "").split(" ").filter(c => c != "")
      ].join(" ")}
      id={params.id}
      style={params.style}
      ref={params.ref}>

      {params.children}
    </TileDND_div>
  );
}

// style sheet
const TileDND_div = styled.div `
  && .Tile {
    width: 100%;
    height: 100%;
  }
`;