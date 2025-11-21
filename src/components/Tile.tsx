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
 * Live tile inside a `TileGroup` container.
 */
export function Tile(params: {
  className?: string,
  style?: React.CSSProperties,
  children?: React.ReactNode,
  ref?: React.Ref<null | HTMLButtonElement>,

  /**
   * The unique ID of the tile (unique **across** groups).
   */
  id: string,

  /**
   * Tile X-coordinate in 1x1 tile units.
   * If `-1` or unspecified, `y` is also taken as `-1`
   * and the tile is added to the end of the group.
   */
  x?: number,

  /**
   * Tile Y-coordinate in 1x1 tile units.
   * If `-1` or unspecified, `x` is also taken as `-1`
   * and the tile is added to the end of the group.
   */
  y?: number,

  /**
   * Tile size variant.
   */
  size: TileSize,

}): React.ReactNode {

  //
  const button_ref = React.useRef<null | HTMLButtonElement>(null);

  //
  const detection_timeout = React.useRef<number>(-1);

  // initialization
  React.useEffect(() => {

    const button = button_ref.current!;
    const container = button.parentElement?.parentElement?.parentElement;

    return () => {
      // final node detection
      if (container?.classList.contains("Tiles-sub") && detection_timeout.current == -1) {
        window.setTimeout(() => {
          detection_timeout.current = -1;
          container.dispatchEvent(new CustomEvent("_Tiles_detect", {
            detail: button,
          }));
        }, 5);
      }
    };

  }, []);

  // reflect { x, y, size }
  React.useEffect(() => {

    const button = button_ref.current!;
    const container = button.parentElement?.parentElement?.parentElement;

    // node detection
    if (container?.classList.contains("Tiles-sub") && detection_timeout.current == -1) {
      detection_timeout.current = window.setTimeout(() => {
        detection_timeout.current = -1;
        container.dispatchEvent(new CustomEvent("_Tiles_detect", {
          detail: button,
        }));
        detection_timeout.current = -1;
      }, 5);
    }

  }, [params.x, params.y, params.size]);

  return (
    <Tile_button
      className={[
        "Tile",
        ...(params.className ?? "").split(" ").filter(c => c != "")
      ].join(" ")}
      data-id={params.id}
      data-x={params.x?.toString()}
      data-y={params.y?.toString()}
      data-size={params.size}
      style={params.style}
      id={params.id}
      ref={obj => {
        button_ref.current = obj;
        if (typeof params.ref == "function") {
          params.ref(obj);
        } else if (params.ref) {
          params.ref!.current = obj;
        }
      }}>
      <div className="Tile-content">
        {params.children}
      </div>
    </Tile_button>
  );
}

// style sheet
const Tile_button = styled.button<{
  //
}> `

`;