// third-party
import assert from "assert";
import * as React from "react";
import { styled } from "styled-components";

// local
import { Theme, ThemeContext } from "../theme/Theme";
import { AnchorSkin } from "../skins/AnchorSkin";
import { ScrollbarSkin } from "../skins/ScrollbarSkin";
import { SelectionSkin } from "../skins/SelectionSkin";
import { TableSkin } from "../skins/TableSkin";
import * as REMConvert from "../utils/REMConvert";
import { EnhancedWheel } from "../utils/EnhancedWheel";
import * as ColorUtils from "../utils/ColorUtils";
import * as MathUtils from "../utils/MathUtils";
import { EasingFunction, Alignment } from "../enum";
import { COMMON_DELAY } from "../utils/Constants";

/**
 * Vertical group.
 */
export function VGroup(params: {
  full?: boolean,
  /**
   * Indicates whether the container should display a solid background
   * according to the provided theme. Defaults to `false`.
   */
  solid?: boolean,
  /**
   * Indicates whether the container should display an input border
   * and input background (similiar to text inputs, tooltips and context menus).
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

  /**
   * Whether the group displays inline with other elements.
   */
  inline?: boolean,

  gap?: number,
  /**
   * Horizontal alignment.
   */
  horizontalAlign?: Alignment,
  /**
   * Vertical alignment.
   */
  verticalAlign?: Alignment,

  /**
   * Indicates whether the group wraps into multiple lines on possible overflow.
   * If `"wrap-reverse"`, then lines are stacked in reverse order.
   */
  wrap?: "wrap" | "wrap-reverse",

  /**
   * Whether to clip in case content overflows.
   */
  clip?: boolean,

  /**
   * Whether to clip horizontally in case content overflows.
   */
  clipHorizontal?: boolean,

  /**
   * Whether to clip vertically in case content overflows.
   */
  clipVertical?: boolean,

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
   * For vertically-scrollable groups, makes vertical scrolling through
   * the mouse wheel more faster and smoother.
   */
  wheelVertical?: boolean,

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
  // refs
  const div_ref = React.useRef<null| HTMLDivElement>(null);

  // Contexts
  const theme = React.useContext(ThemeContext);

  // Enable or disable selection
  const userSelect = typeof params.selection == "undefined" ? "inherit" : params.selection ? "auto" : "none";

  // Overflow
  let overflow = "";
  if (params.clip) {
    overflow = "hidden";
  }
  let overflowX = "";
  if (params.clipHorizontal) {
    overflowX = "hidden";
  }
  let overflowY = "";
  if (params.clipVertical) {
    overflowY = "hidden";
  }
  let justifyContent = "";
  if (params.verticalAlign) {
    const m = verticalAlignMaps[params.verticalAlign];
    assert(!!m, `Unsupported vertical alignment: ${params.verticalAlign}`);
    justifyContent = m;
  }
  let alignItems = "";
  if (params.horizontalAlign) {
    const m = horizontalAlignMaps[params.horizontalAlign];
    assert(!!m, `Unsupported horizontal alignment: ${params.horizontalAlign}`);
    alignItems = m;
  }

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

  // Handle mouse wheel (vertical)
  React.useEffect(() => {
    const div_el = div_ref.current!;
    let enhanced_wheel = null;
    if (params.wheelVertical) {
      enhanced_wheel = new EnhancedWheel(div_el, "vertical");
    }
    return () => {
      if (enhanced_wheel) {
        enhanced_wheel.destroy();
      }
    };
  }, [params.wheelVertical]);

  // Layout
  return (
    <_Div
      id={params.id}
      className={
        [
          "VGroup",
          ...[params.full ? ["full"] : []],
          ...[params.solid ? ["solid"] : []],
          ...[params.input ? ["input"] : []],
          ...[params.visible === false ? ["invisible"] : []],
          ...[(params.className ?? "").split(" ").filter(c => c != "")],
        ].join(" ")
      }
      ref={obj => {
        div_ref.current = obj;
        if (typeof params.ref == "function") {
          params.ref(obj);
        } else if (params.ref) {
          params.ref!.current = obj;
        }
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
      $userSelect={userSelect}
      $transition={transition}
      $gap={params.gap}
      $inline={params.inline}
      $overflow={overflow}
      $overflowX={overflowX}
      $overflowY={overflowY}
      $justifyContent={justifyContent}
      $alignItems={alignItems}
      $wrap={params.wrap}

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
  $gap?: number,
  $justifyContent?: string,
  $alignItems?: string,
  $wrap?: string,
  $inline?: boolean,
  $overflow?: string,
  $overflowX?: string,
  $overflowY?: string,
  $theme: Theme,
  $userSelect: string,
  $transition: string,
}> `
  && {
    display: ${$ => $.$inline ? "inline-flex" : "flex"};
    flex-direction: column;
    color: ${$ => $.$theme.colors.foreground};
    ${($) => $.$transition ? "transition: " + $.$transition + ";" : ""}
    ${($) => ($.$gap !== undefined ? "gap: " + REMConvert.pixels.remPlusUnit($.$gap) + ";" : "")}

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

    ${($) => $.$justifyContent ? "justify-content: " + $.$justifyContent + ";" : ""}
    ${($) => ($.$alignItems ? "align-items: " + $.$alignItems + ";" : "")}
    ${($) => ($.$overflow ? "overflow: " + $.$overflow + ";" : "")}
    ${($) => ($.$overflowX ? "overflow-x: " + $.$overflowX + ";" : "")}
    ${($) => ($.$overflowY ? "overflow-y: " + $.$overflowY + ";" : "")}
    ${($) => ($.$wrap !== undefined ? "flex-wrap: " + $.$wrap + ";" : "")}
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
    border: 0.15rem solid  ${$ => ColorUtils.alphaZeroIfFar({ background: $.$theme.colors.background, color: $.$theme.colors.inputBorder })};
  }

  ${$ => AnchorSkin($.$theme)}

  ${$ => ScrollbarSkin($.$theme)}
  
  ${$ => SelectionSkin($.$theme)}

  ${$ => TableSkin($.$theme)}
`;

const verticalAlignMaps: any = {
  start: "start",
  top: "start",
  center: "center",
  end: "end",
  bottom: "end",
  spaceBetween: "space-between",
};

const horizontalAlignMaps: any = {
  start: "start",
  left: "start",
  center: "center",
  end: "end",
  right: "end",
  stretch: "stretch",
};