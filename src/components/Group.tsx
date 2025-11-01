// third-party
import * as React from "react";
import { styled } from "styled-components";

// local
import { Theme, ThemeContext } from "../theme/Theme";
import { AnchorSkin } from "../skins/AnchorSkin";
import { ScrollbarSkin } from "../skins/ScrollbarSkin";
import { SelectionSkin } from "../skins/SelectionSkin";
import { TableSkin } from "../skins/TableSkin";
import * as REMConvert from "../utils/REMConvert";
import { EasingFunction } from "../enum";
import { COMMON_DELAY } from "../utils/Constants";

/**
 * Generic container.
 */
export function Group(params: {
  full?: boolean,
  /**
   * Indicates whether the container should display a solid background
   * according to the provided theme. Defaults to `false`.
   */
  solid?: boolean,
  /**
   * Indicates whether the container should display an input border
   * and input background (similiar to text inputs, tooltips and popover menus).
   */
  input?: boolean,
  /**
   * If `false`, excludes the container from the layout, making it
   * hidden.
   */
  visible?: boolean,
  className?: string,
  id?: string,
  style?: React.CSSProperties,
  children?: React.ReactNode,
  ref?: React.Ref<null | HTMLDivElement>,

  /**
   * Indicates whether or not character selection is enabled for this container.
   */
  selection?: boolean,

  margin?: number,
  marginLeft?: number,
  marginRight?: number,
  marginTop?: number,
  marginBottom?: number,

  padding?: number,
  paddingLeft?: number,
  paddingRight?: number,
  paddingTop?: number,
  paddingBottom?: number,

  minWidth?: number,
  minHeight?: number,
  maxWidth?: number,
  maxHeight?: number,

  /**
   * Ease cascading position properties with a `COMMON_DELAY` duration.
   */
  easePosition?: EasingFunction,
  /**
   * Ease cascading transform with a `COMMON_DELAY` duration.
   */
  easeTransform?: EasingFunction,
  /**
   * Ease opacity with a `COMMON_DELAY` duration.
   */
  easeOpacity?: EasingFunction,

  /**
   * Enables horizontal scrolling through the mouse wheel.
   */
  wheelHorizontal?: boolean,

  contextMenu?: React.MouseEventHandler<HTMLDivElement>,
  click?: React.MouseEventHandler<HTMLDivElement>,
  mouseOver?: React.MouseEventHandler<HTMLDivElement>,
  mouseOut?: React.MouseEventHandler<HTMLDivElement>,
  mouseUp?: React.MouseEventHandler<HTMLDivElement>,

  gotPointerCapture?: React.PointerEventHandler<HTMLDivElement>,
  lostPointerCapture?: React.PointerEventHandler<HTMLDivElement>,
  pointerCancel?: React.PointerEventHandler<HTMLDivElement>,
  pointerDown?: React.PointerEventHandler<HTMLDivElement>,
  pointerEnter?: React.PointerEventHandler<HTMLDivElement>,
  pointerLeave?: React.PointerEventHandler<HTMLDivElement>,
  pointerMove?: React.PointerEventHandler<HTMLDivElement>,
  pointerOut?: React.PointerEventHandler<HTMLDivElement>,
  pointerOver?: React.PointerEventHandler<HTMLDivElement>,
  pointerUp?: React.PointerEventHandler<HTMLDivElement>,

  touchStart?: React.TouchEventHandler<HTMLDivElement>,
  touchEnd?: React.TouchEventHandler<HTMLDivElement>,
  touchMove?: React.TouchEventHandler<HTMLDivElement>,
  touchCancel?: React.TouchEventHandler<HTMLDivElement>,

  wheel?: React.WheelEventHandler<HTMLDivElement>,
}) {
  // Contexts
  const theme = React.useContext(ThemeContext);

  // Enable or disable selection
  const userSelect = typeof params.selection == "undefined" ? "inherit" : params.selection ? "auto" : "none";

  // References
  const div: React.Ref<null | HTMLDivElement> = React.useRef(null);

  // Overflow
  const overflowX = params.wheelHorizontal ? "auto" : "";
  const overflowY = params.wheelHorizontal ? "hidden" : "";

  // Transition
  let transition = "";
  if (params.easePosition) {
    transition =
      "left " + COMMON_DELAY + "ms " + params.easePosition + ", " +
      "top " + COMMON_DELAY + "ms " + params.easePosition + ", " +
      "right " + COMMON_DELAY + "ms " + params.easePosition + ", " +
      "bottom " + COMMON_DELAY + "ms " + params.easePosition;
  }
  if (params.easeTransform) {
    transition =
      (transition ? transition + ", " : "") +
      "transform " + COMMON_DELAY + "ms " + params.easePosition
  }
  if (params.easeOpacity) {
    transition =
      (transition ? transition + ", " : "") +
      "opacity " + COMMON_DELAY + "ms " + params.easePosition
  }

  // Handle mouse wheel
  React.useEffect(() => {
    const div_el = div.current!;
    let added_handler = false;
    if (params.wheelHorizontal) {
      div_el.addEventListener("wheel", wheel, { passive: false });
      added_handler = true;
    }
    return () => {
      if (added_handler) {
        div_el.removeEventListener("wheel", wheel);
      }
    };
  }, [params.wheelHorizontal]);
  const last_wheel_timestamp = React.useRef<number>(-1);
  const last_fast_wheel_timestamp = React.useRef<number>(-1);
  const wheel = (e: WheelEvent): void => {
    const div = e.currentTarget as HTMLDivElement;
    // deltaMode == DOM_DELTA_PIXEL
    if (e.deltaMode == 0) {
      if (e.deltaX) return;

      e.preventDefault();
      let multiplier = 2;
      if (
        last_wheel_timestamp.current != -1 &&
        ((last_wheel_timestamp.current > Date.now() - 600 &&
          last_wheel_timestamp.current < Date.now() - 20) ||
          (last_fast_wheel_timestamp.current !== -1 &&
            last_fast_wheel_timestamp.current > Date.now() - 100))
      )
        (multiplier *= 3), (last_fast_wheel_timestamp.current = Date.now());
      else last_fast_wheel_timestamp.current = -1;
      const delta = e.deltaY * multiplier;
      let target_scroll = div.scrollLeft + delta;
      target_scroll = Math.min(target_scroll, div.scrollWidth);
      div.scrollTo({ left: target_scroll, behavior: "smooth" });
      last_wheel_timestamp.current = Date.now();
    }
  };

  // Layout
  return (
    <_Div
      id={params.id}
      className={
        [
          ...[params.full ? ["full"] : []],
          ...[params.solid ? ["solid"] : []],
          ...[params.input ? ["input"] : []],
          ...[params.visible === false ? ["invisible"] : []],
          ...[params.className ? [params.className] : []]
        ].join(" ")
      }
      ref={(node) => {
        div.current = node;
        if (typeof params.ref == "function") params.ref(node);
        else if (params.ref) params.ref.current = node;
      }}
      style={params.style}
      $theme={theme}
      $margin={params.margin}
      $marginLeft={params.marginLeft}
      $marginRight={params.marginRight}
      $marginTop={params.marginTop}
      $marginBottom={params.marginBottom}
      $padding={params.padding}
      $paddingLeft={params.paddingLeft}
      $paddingRight={params.paddingRight}
      $paddingTop={params.paddingTop}
      $paddingBottom={params.paddingBottom}
      $minWidth={params.minWidth}
      $minHeight={params.minHeight}
      $maxWidth={params.maxWidth}
      $maxHeight={params.maxHeight}
      $overflowX={overflowX}
      $overflowY={overflowY}
      $userSelect={userSelect}
      $transition={transition}

      onClick={params.click}
      onMouseOver={params.mouseOver}
      onMouseOut={params.mouseOut}
      onMouseUp={params.mouseUp}
      onContextMenu={params.contextMenu}
      onGotPointerCapture={params.gotPointerCapture}
      onLostPointerCapture={params.lostPointerCapture}
      onPointerCancel={params.pointerCancel}
      onPointerDown={params.pointerDown}
      onPointerEnter={params.pointerEnter}
      onPointerLeave={params.pointerLeave}
      onPointerMove={params.pointerMove}
      onPointerOut={params.pointerOut}
      onPointerOver={params.pointerOver}
      onPointerUp={params.pointerUp}
      onTouchStart={params.touchStart}
      onTouchEnd={params.touchEnd}
      onTouchMove={params.touchMove}
      onTouchCancel={params.touchCancel}
      onWheel={params.wheel}>
      {params.children}
    </_Div>
  );
}

// Style sheet.
const _Div = styled.div<{
  $margin?: number,
  $marginLeft?: number,
  $marginRight?: number,
  $marginTop?: number,
  $marginBottom?: number,
  $padding?: number,
  $paddingLeft?: number,
  $paddingRight?: number,
  $paddingTop?: number,
  $paddingBottom?: number,
  $minWidth?: number,
  $minHeight?: number,
  $maxWidth?: number,
  $maxHeight?: number,
  $overflowX?: string,
  $overflowY?: string,
  $theme: Theme,
  $userSelect: string,
  $transition: string,
}> `
  && {
    color: ${$ => $.$theme.colors.foreground};
    ${($) => $.$transition ? "transition: " + $.$transition + ";" : ""}

    ${($) => $.$margin !== undefined ? "margin: " + REMConvert.pixels.remPlusUnit($.$margin) + ";" : ""}
    ${($) => $.$marginLeft !== undefined ? "margin-left: " + REMConvert.pixels.remPlusUnit($.$marginLeft) + ";" : ""}
    ${($) => $.$marginRight !== undefined ? "margin-right: " + REMConvert.pixels.remPlusUnit($.$marginRight) + ";" : ""}
    ${($) => $.$marginTop !== undefined ? "margin-top: " + REMConvert.pixels.remPlusUnit($.$marginTop) + ";" : ""}
    ${($) => $.$marginBottom !== undefined ? "margin-bottom: " + REMConvert.pixels.remPlusUnit($.$marginBottom) + ";" : ""}

    ${($) => $.$padding !== undefined ? "padding: " + REMConvert.pixels.remPlusUnit($.$padding) + ";" : ""}
    ${($) => $.$paddingLeft !== undefined ? "padding-left: " + REMConvert.pixels.remPlusUnit($.$paddingLeft) + ";" : ""}
    ${($) => $.$paddingRight !== undefined ? "padding-right: " + REMConvert.pixels.remPlusUnit($.$paddingRight) + ";" : ""}
    ${($) => $.$paddingTop !== undefined ? "padding-top: " + REMConvert.pixels.remPlusUnit($.$paddingTop) + ";" : ""}
    ${($) => $.$paddingBottom !== undefined ? "padding-bottom: " + REMConvert.pixels.remPlusUnit($.$paddingBottom) + ";" : ""}

    ${($) => $.$minWidth !== undefined ? "min-width: " + REMConvert.pixels.remPlusUnit($.$minWidth) + ";" : ""}
    ${($) => $.$minHeight !== undefined ? "min-height: " + REMConvert.pixels.remPlusUnit($.$minHeight) + ";" : ""}
    ${($) => $.$maxWidth !== undefined ? "max-width: " + REMConvert.pixels.remPlusUnit($.$maxWidth) + ";" : ""}
    ${($) => $.$maxHeight !== undefined ? "max-height: " + REMConvert.pixels.remPlusUnit($.$maxHeight) + ";" : ""}

    user-select: ${($) => $.$userSelect};
    -moz-user-select: ${($) => $.$userSelect};
    -webkit-user-select: ${($) => $.$userSelect};

    overflow: auto;
    ${($) => ($.$overflowX ? "overflow-x: " + $.$overflowX + ";" : "")}
    ${($) => ($.$overflowY ? "overflow-y: " + $.$overflowY + ";" : "")}
  }

  &&.full {
    width: 100%;
    height: 100%;
  }

  &&.invisible {
    display: none;
  }

  &&.solid {
    background: ${$ => $.$theme.colors.background};
  }

  &&.input {
    background: ${$ => $.$theme.colors.inputBackground};
    border: 0.15rem solid  ${$ => $.$theme.colors.inputBorder};
  }

  ${$ => AnchorSkin($.$theme)}

  ${$ => ScrollbarSkin($.$theme)}
  
  ${$ => SelectionSkin($.$theme)}

  ${$ => TableSkin($.$theme)}
`;