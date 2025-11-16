// third-party
import React from "react";
import { styled } from "styled-components";

// local
import { EnhancedWheel } from "../utils/EnhancedWheel";
import * as MathUtils from "../utils/MathUtils";

/**
 * `MobileGroup` is used for displaying UI
 * only when the screen orientation is portrait.
 */
export function MobileGroup(params: {
  /**
   * Whether the group is displayed inline.
   */
  inline?: boolean,

  /**
   * Enables horizontal scrolling through the mouse wheel.
   */
  wheelHorizontal?: boolean,

  /**
   * For vertically-scrollable groups, makes vertical scrolling through
   * the mouse wheel more faster and smoother.
   */
  wheelVertical?: boolean,

  id?: string,
  className?: string,
  style?: React.CSSProperties,
  children?: React.ReactNode,
  ref?: React.Ref<null | HTMLDivElement>,
}): React.ReactNode {

  // basics
  const div_ref = React.useRef<null | HTMLDivElement>(null);

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

  return (
    <_Div
      className={[
        "MobileGroup",
        ...(params.inline ? ["inline"] : []),
        ...(params.className ?? "").split(" ").filter(c => c != ""),
      ].join(" ")}
      id={params.id}
      style={params.style}
      ref={node => {
        div_ref.current = node;
        if (typeof params.ref == "function") params.ref(node);
        else if (params.ref) params.ref.current = node;
      }}>

      {params.children}
    </_Div>
  );
}

// css
const _Div = styled.div `
  && {
    display: none;
  }
  @media (orientation: portrait) {
    && {
      display: block;
    }
    &&.inline {
      display: inline-block;
    }
  }
`;