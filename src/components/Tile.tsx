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

  /**
   * Background color. If unspecified,
   * the tile is transparent.
   */
  background?: string,

  /**
   * Foreground color. If unspecified, defaults
   * to the theme's color.
   */
  foreground?: string,

  /**
   * Whether the tile is disabled or not.
   */
  disabled?: boolean,

  /**
   * Icon size percent inside 47x47 logical pixels.
   * Clamps to minimum 60%.
   *
   * @default 100
   */
  iconSize?: number,

}): React.ReactNode {

  //
  const mode = React.useContext(TileModeContext);

  //
  const theme = React.useContext(ThemeContext);

  //
  const button_ref = React.useRef<null | HTMLButtonElement>(null);
  const content_ref = React.useRef<null | HTMLDivElement>(null);

  //
  const tilting = React.useRef(false);
  const tilting_pointer_id = React.useRef(-1);
  const window_pointer_up = React.useRef<null | Function>(null);
  const window_pointer_cancel = React.useRef<null | Function>(null);

  //
  const detection_timeout = React.useRef<number>(-1);

  //
  const page_roll = React.useRef<null | PageRoll>(null);

  //
  const rem = React.useRef<number>(16);

  // initialization
  React.useEffect(() => {

    const button = button_ref.current!;
    const container = button.parentElement?.parentElement?.parentElement;

    //
    const page_roll_obj = new PageRoll(button);
    page_roll.current = page_roll_obj;

    // REMObserver
    const rem_observer = new REMObserver(val => {
      rem.current = val;
    });

    // internal request to reset page roll
    let roll_reset_timeout = -1;
    function internal_page_roll_reset(): void {
      if (roll_reset_timeout != -1) return;
      roll_reset_timeout = window.setTimeout(() => {
        page_roll.current!.reset();
      }, 5);
    }
    button.addEventListener("_Tile_pageRollReset" as any, internal_page_roll_reset);

    // cleanup
    return () => {
      // dispose of REMObserver
      rem_observer.cleanup();

      // PageRoll stuff
      page_roll_obj.destroy();
      button.removeEventListener("_Tile_pageRollReset" as any, internal_page_roll_reset);
      if (roll_reset_timeout != -1) {
        window.clearTimeout(roll_reset_timeout);
      }

      // dispose of window handlers
      if (window_pointer_up.current) {
        window.removeEventListener("pointerup", window_pointer_up.current as any);
      }
      if (window_pointer_cancel.current) {
        window.removeEventListener("pointercancel", window_pointer_cancel.current as any);
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

  // size changing should reset the PageRoll animation
  React.useEffect(() => {

    //
    page_roll.current!.reset();

  }, [params.size]);

  // tilting
  function pointer_down(e: React.PointerEvent<HTMLButtonElement>): void {
    if (tilting.current) {
      return;
    }

    // do not tilt if the tile <button> is inside
    // a TileDND container.
    if (button_ref.current!.getAttribute("data-dragging") == "true") {
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

    // stop tilting
    window_pointer_cancel.current = (e: PointerEvent) => {
      if (!tilting.current || tilting_pointer_id.current != e.pointerId) {
        return;
      }
      window.removeEventListener("pointercancel", window_pointer_cancel.current as any);
      window_pointer_cancel.current = null;
      content_ref.current!.style.transform = "";
      tilting.current = false;
      tilting_pointer_id.current = -1;
    };

    window.addEventListener("pointercancel", window_pointer_cancel.current as any);
    
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
        params.size,
        ...(mode.checking ? ["checking-mode"] : []),
        ...(mode.dnd ? ["dnd-mode"] : []),
        ...(params.background ? [] : ["transparent"]),
        ...(params.className ?? "").split(" ").filter(c => c != "")
      ].join(" ")}
      disabled={params.disabled}
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
      onPointerDown={pointer_down}
      $background={params.background ?? theme.colors.foreground}
      $foreground={params.foreground || theme.colors.foreground}
      $primary={theme.colors.primary}
      $primary_foreground={theme.colors.primaryForeground}
      $icon_size={((Math.max(60, params.iconSize ?? 100)) / 100) * 47}>

      <div className="Tile-content" ref={content_ref}>
        {params.children}
        <div className="Tile-checked-rect">
          <Icon native="checked" size={13}/>
        </div>
      </div>
    </Tile_button>
  );
}

// style sheet
const Tile_button = styled.button<{
  $background: string,
  $foreground: string,
  $primary: string,
  $primary_foreground: string,
  $icon_size: number,
}> `
  && {
    border: none;
    border-radius: 0;
    background: none;
    outline: none;
    padding: 0;
    margin: 0;
    position: absolute;
  }

  &&:disabled {
    opacity: 0.5;
  }

  && > .Tile-content {
    border: none;
    color: ${$ => $.$foreground};
    transition: opacity 0.2s, transform 0.2s ease-out, scale 0.2s ease-out;
    background: linear-gradient(90deg, ${$ => $.$background} 0%, ${$ => Color($.$background).lighten(0.15).hex().toString()} 100%);
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  &&:hover > .Tile-content {
    background: linear-gradient(90deg, ${$ => Color($.$background).lighten(0.15).hex().toString()} 0%, ${$ => Color($.$background).lighten(0.23).hex().toString()} 100%);
    outline: 0.13rem solid ${$ => Color($.$foreground).alpha(0.2).hexa().toString()};
  }

  &&.transparent > .Tile-content {
    background: ${$ => Color($.$background).alpha(0.18).hexa().toString()};
  }

  &&.transparent:hover > .Tile-content {
    background: ${$ => Color($.$background).alpha(0.25).hexa().toString()};
  }

  &&.checking-mode > .Tile-content {
    opacity: 0.7;
  }

  &&.dnd-mode > .Tile-content {
    scale: 0.92;
  }

  && > .Tile-content > .TilePage {
    display: flex;
    flex-direction: column;
    position: absolute;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  && > .Tile-content > .TilePage .Label {
    overflow-wrap: anywhere;
  }

  /* checked rect */

    && > .Tile-content > .Tile-checked-rect {
      position: absolute;
      right: -7rem;
      top: -6rem;
      padding: 0.5rem;
      width: 9rem;
      height: 9rem;
      background: ${$ => $.$primary};
      color: ${$ => $.$primary_foreground};
      transform: rotate(45deg);
      visibility: hidden;
    }

    &&[data-checked="true"] > .Tile-content > .Tile-checked-rect {
      visibility: visible;
    }

    && > .Tile-content > .Tile-checked-rect > .Icon {
      transform: rotate(-45deg) translate(-5.5rem, 4.5rem);
    }

  /* icon-label page variant */

    && > .Tile-content > .TilePage[data-variant="iconLabel"] {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    &&.medium > .Tile-content > .TilePage[data-variant="iconLabel"] > .Group {
      position: relative;
      top: -0.4rem;
    }

    && > .Tile-content > .TilePage[data-variant="iconLabel"] > .Group {
      width: ${$ => REMConvert.pixels.rem($.$icon_size)}rem;
      height: ${$ => REMConvert.pixels.rem($.$icon_size)}rem;
    }

    &&.small > .Tile-content > .TilePage[data-variant="iconLabel"] > .Group {
      width: ${$ => REMConvert.pixels.rem($.$icon_size - 20)}rem;
      height: ${$ => REMConvert.pixels.rem($.$icon_size - 20)}rem;
    }

    && > .Tile-content > .TilePage[data-variant="iconLabel"] > .Label {
      position: absolute;
      left: 0.6rem;
      right: 0.6rem;
      bottom: 0.3rem;
      overflow-wrap: anywhere;
      overflow: hidden;
      max-height: 2.5rem;
      font-size: 0.78rem;
    }

    &&.medium > .Tile-content > .TilePage[data-variant="iconLabel"] > .Label {
      max-height: 2.4rem;
    }

    &&.small > .Tile-content > .TilePage[data-variant="iconLabel"] > .Label {
      visibility: hidden;
    }

  /* label-icon page variant */

    &&.small > .Tile-content > .TilePage[data-variant="labelIcon"] {
      justify-content: center;
      align-items: center;
    }

    && > .Tile-content > .TilePage[data-variant="labelIcon"] > .Label {
      position: absolute;
      font-weight: lighter;
      opacity: 0.8;
      font-size: 1.13rem;
      left: 0.4rem;
      right: 0.4rem;
      top: 0.6rem;
      overflow-wrap: anywhere;
      max-height: 4.5rem;
      overflow: hidden;
    }

    &&.small > .Tile-content > .TilePage[data-variant="labelIcon"] > .Label {
      visibility: hidden;
    }

    && > .Tile-content > .TilePage[data-variant="labelIcon"] > .Group {
      width: ${$ => REMConvert.pixels.rem($.$icon_size - 20)}rem;
      height: ${$ => REMConvert.pixels.rem($.$icon_size - 20)}rem;
    }

    &&:not(.small) > .Tile-content > .TilePage[data-variant="labelIcon"] > .Group {
      position: absolute;
      bottom: 0.2rem;
    }
`;

// size prevalence
const size_prevalence: Record<TileSize, number> = {
  small: 0,
  medium: 1,
  wide: 2,
  large: 3,
};

// page roll animation
const PAGE_DURATION = 5_000;
class PageRoll {
  private mutation_observer: MutationObserver;
  private tween_1: null | gsap.core.Tween = null;
  private tween_2: null | gsap.core.Tween = null;
  private pages: HTMLElement[] = [];
  private pageIndex: number = 0;
  private timeout: number = -1;

  //
  public constructor(private button: HTMLButtonElement) {
    // set mutation observer up
    this.mutation_observer = new MutationObserver(records => {
      for (const r of records) {
        if (r.addedNodes.length != 0 || r.removedNodes.length != 0) {
          this.reset();
        }
      }
    });
    this.mutation_observer.observe(button, { childList: true });

    // initial reset
    this.reset();
  }

  //
  public destroy(): void {
    if (this.timeout != -1) {
      window.clearTimeout(this.timeout);
    }
    if (this.tween_1) {
      this.tween_1.kill();
    }
    if (this.tween_2) {
      this.tween_2.kill();
    }
    this.pages.length = 0;
    this.mutation_observer.disconnect();
  }

  //
  public reset(): void {
    // tile size
    const size = ((size_prevalence as any)[this.button.getAttribute("data-size") ?? "small"]!) as number;

    // matching pages
    const all_pages = Array.from(this.button.getElementsByClassName("TilePage")) as HTMLElement[];
    const pages = all_pages
      .filter(page => {
        if (!page.hasAttribute("data-size")) {
          return true;
        }
        const test = page.getAttribute("data-size")!.replace(/\s/g, "");
        if (test.startsWith("<")) {
          if (test.charCodeAt(1) == 0x3D) {
            const val = ((size_prevalence as any)[test.slice(2)] as number);
            return size <= val;
          }
          const val = ((size_prevalence as any)[test.slice(1)] as number);
          return size < val;
        }
        if (test.startsWith(">")) {
          if (test.charCodeAt(1) == 0x3D) {
            const val = ((size_prevalence as any)[test.slice(2)] as number);
            return size >= val;
          }
          const val = ((size_prevalence as any)[test.slice(1)] as number);
          return size > val;
        }
        if (test.startsWith("=")) {
          const val = ((size_prevalence as any)[test.slice(1)] as number);
          return size == val;
        }
        const val = ((size_prevalence as any)[test] as number);
        return size == val;
      });
    
    // kill previous tween
    if (this.tween_1) {
      this.tween_1!.kill();
      this.tween_1 = null;
    }
    if (this.tween_2) {
      this.tween_2!.kill();
      this.tween_2 = null;
    }

    if (this.timeout != -1) {
      window.clearTimeout(this.timeout);
      this.timeout = -1;
    }

    // visibility changes
    for (const page of all_pages) {
      if (pages.includes(page)) {
        page.style.visibility = "visible";
        page.style.top = "100%";
      } else {
        page.style.visibility = "hidden";
      }
    }

    // no page? do nothing.
    if (pages.length == 0) {
      return;
    }

    // position initial page
    pages[0].style.top = "0";

    // one page? no animation then.
    if (pages.length == 1) {
      return;
    }

    //
    this.pages = pages;
    this.pageIndex = 0;

    //
    this.timeout = window.setTimeout(() => {
      this.next_page();
    }, PAGE_DURATION);
  }

  //
  private next_page(): void {
    const current_page = this.pages[this.pageIndex];
    const next_page = this.pages[(this.pageIndex + 1) % this.pages.length]!;
    this.pageIndex++;
    this.pageIndex %= this.pages.length;
    this.tween_1 = gsap.to(
      current_page,
      { top: "-100%", duration: 0.7, ease: "power1.out" },
    );
    this.tween_2 = gsap.fromTo(
      next_page,
      { top: "100%" },
      { top: "0", duration: 0.7, ease: "power1.out" },
    );
    this.tween_2.then(() => {
      //
      this.timeout = window.setTimeout(() => {
        this.next_page();
      }, PAGE_DURATION);
    });
  }
}