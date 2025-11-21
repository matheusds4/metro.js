// third-party
import React from "react";
import { styled } from "styled-components";
import { Color } from "@hydroperx/color";

// local
import { TileSize } from "../liveTiles/TileSize";
import { RTLContext } from "../layout/RTL";
import { ThemeContext, Theme } from "../theme/Theme";
import * as ColorUtils from "../utils/ColorUtils";

/**
 * Live tile group inside a `Tiles` container.
 */
export function TileGroup(params: {
  className?: string,
  style?: React.CSSProperties,
  children?: React.ReactNode,
  ref?: React.Ref<null | HTMLDivElement>,

  /**
   * The unique ID of the group.
   */
  id: string,

  /**
   * Group label.
   */
  label?: string,

  /**
   * Group index.
   */
  index: number,

}): React.ReactNode {

  //
  const div_ref = React.useRef<null | HTMLDivElement>(null);

  //
  const detection_timeout = React.useRef<number>(-1);

  // initialization
  React.useEffect(() => {

    const div = div_ref.current!;
    const container = div.parentElement!;

    return () => {
      // final node detection
      if (container.classList.contains("Tiles-sub") && detection_timeout.current == -1) {
        window.setTimeout(() => {
          detection_timeout.current = -1;
          container.dispatchEvent(new CustomEvent("_Tiles_detect", {
            detail: div,
          }));
        }, 5);
      }
    };

  }, []);

  // reflect { index, label }
  React.useEffect(() => {

    const div = div_ref.current!;
    const container = div.parentElement!;

    // node detection
    if (container.classList.contains("Tiles-sub") && detection_timeout.current == -1) {
      detection_timeout.current = window.setTimeout(() => {
        detection_timeout.current = -1;
        container.dispatchEvent(new CustomEvent("_Tiles_detect", {
          detail: div,
        }));
        detection_timeout.current = -1;
      }, 5);
    }

  }, [params.index, params.label]);

  return (
    <div
      className={[
        "TileGroup",
        ...(params.className ?? "").split(" ").filter(c => c != "")
      ].join(" ")}
      data-id={params.id}
      data-label={params.label ?? ""}
      data-index={params.index.toString()}
      style={params.style}
      id={params.id}
      ref={obj => {
        div_ref.current = obj;
        if (typeof params.ref == "function") {
          params.ref(obj);
        } else if (params.ref) {
          params.ref!.current = obj;
        }
      }}>
      <div className="TileGroup-label">
        <span className="TileGroup-label-text"></span>
      </div>
      <div className="TileGroup-tiles">
        {params.children}
      </div>
    </div>
  );
}