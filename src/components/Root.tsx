// css
import "./Root.css";

// third-party
import * as React from "react";
import { styled } from "styled-components";

// local
import { Theme, ThemeContext } from "../theme/Theme";
import { AnchorSkin } from "../skins/AnchorSkin";
import { ScrollbarSkin } from "../skins/ScrollbarSkin";
import { SelectionSkin } from "../skins/SelectionSkin";
import { TableSkin } from "../skins/TableSkin";
import { EnhancedWheel } from "../utils/EnhancedWheel";
import * as MathUtils from "../utils/MathUtils";
import * as REMConvert from "../utils/REMConvert";

/**
 * Fundamental container used for integrating baseline styles
 * within children.
 */
export function Root(params: {
  full?: boolean,
  /**
   * Indicates whether the container should display a solid background
   * according to the provided theme. Defaults to `false`.
   */
  solid?: boolean,
  id?: string,
  className?: string,
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
   * Enables horizontal scrolling through the mouse wheel.
   */
  wheelHorizontal?: boolean,

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
  const div_ref = React.useRef<null | HTMLDivElement>(null);

  // contexts
  const theme = React.useContext(ThemeContext);

  // enable or disable selection
  const userSelect = typeof params.selection == "undefined" ? "inherit" : params.selection ? "auto" : "none";

  // Handle mouse wheel (horizontal)
  React.useEffect(() => {
    const div_el = div_ref.current!;
    let enhanced_wheel = null;
    if (params.wheelHorizontal) {
      enhanced_wheel = new EnhancedWheel(div_el, "horizontal");
    }
    return () => {
      if (enhanced_wheel) {
        enhanced_wheel.destroy();
      }
    };
  }, [params.wheelHorizontal]);

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

  // layout
  return (
    <_Div
      id={params.id}
      className={
        [
          "metro-root",
          ...[params.full ? ["full"] : []],
          ...[params.solid ? ["solid"] : []],
          ...[params.className ? [params.className] : []]
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
  $theme: Theme,
  $userSelect: string,
}> `
  color: ${$ => $.$theme.colors.foreground};

  && {
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
  }

  &&.full {
    width: 100%;
    height: 100%;
  }

  &&.solid {
    background: ${$ => $.$theme.colors.background};
  }

  ${$ => AnchorSkin($.$theme)}
  
  ${$ => ScrollbarSkin($.$theme)}

  ${$ => SelectionSkin($.$theme)}

  ${$ => TableSkin($.$theme)}
`;