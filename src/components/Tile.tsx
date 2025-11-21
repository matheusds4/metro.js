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
  const content_ref = React.useRef<null | HTMLDivElement>(null);

  //
  const tilting = React.useRef(false);
  const tilting_pointer_id = React.useRef(-1);
  const window_pointer_up = React.useRef<null | Function>(null);

  //
  const detection_timeout = React.useRef<number>(-1);

  //
  const rem = React.useRef<number>(16);

  // initialization
  React.useEffect(() => {

    const button = button_ref.current!;
    const container = button.parentElement?.parentElement?.parentElement;

    // REMObserver
    const rem_observer = new REMObserver(val => {
      rem.current = val;
    });

    // cleanup
    return () => {
      // dispose of REMObserver
      rem_observer.cleanup();

      // dispose of window handlers
      if (window_pointer_up.current) {
        window.removeEventListener("pointerup", window_pointer_up.current as any);
      }

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

  // tilting
  function pointer_down(e: React.PointerEvent<HTMLButtonElement>): void {
    if (tilting.current) {
      return;
    }
    tilting.current = true;
    tilting_pointer_id.current = e.pointerId;

    // stop tilting
    window_pointer_up.current = (e: PointerEvent) => {
      if (!tilting.current || tilting_pointer_id.current != e.pointerId) {
        return;
      }
      window.removeEventListener("pointerup", window_pointer_up.current as any);
      window_pointer_up.current = null;
      content_ref.current!.style.transform = "";
      tilting.current = false;
      tilting_pointer_id.current = -1;
    };

    window.addEventListener("pointerup", window_pointer_up.current as any);
    
    // slightly tilt tile depending on where the click held.
    const deg = 5;
    const rect = button_ref.current!.getBoundingClientRect();
    const x = e.clientX,
      y = e.clientY;
    let rotate_3d = "";
    if (
      x < rect.left + rect.width / 2 &&
      y > rect.top + rect.height / 3 &&
      y < rect.bottom - rect.height / 3
    )
      rotate_3d = `perspective(${rect.width / rem.current!}rem) rotate3d(0, -1, 0, ${deg}deg)`;
    else if (
      x > rect.right - rect.width / 2 &&
      y > rect.top + rect.height / 3 &&
      y < rect.bottom - rect.height / 3
    )
      rotate_3d = `perspective(${rect.width / rem.current!}rem) rotate3d(0, 1, 0, ${deg}deg)`;
    else if (y < rect.top + rect.height / 2)
      rotate_3d = `perspective(${rect.width / rem.current!}rem) rotate3d(1, 0, 0, ${deg}deg)`;
    else
      rotate_3d = `perspective(${rect.width / rem.current!}rem) rotate3d(-1, 0, 0, ${deg}deg)`;

    // content <div>
    const content = content_ref.current!;
    content.style.transform = rotate_3d;
  }

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
      }}
      onPointerDown={pointer_down}>

      <div className="Tile-content" ref={content_ref}>
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