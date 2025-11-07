// third-party
import * as React from "react";
import { styled } from "styled-components";
import gsap from "gsap";
import * as FloatingUI from "@floating-ui/dom";

// local
import { RTLContext } from "../layout/RTL";
import { Theme, ThemeContext } from "../theme/Theme";
import * as MathUtils from "../utils/MathUtils";
import * as REMConvert from "../utils/REMConvert";
import { COMMON_DELAY, MAXIMUM_Z_INDEX } from "../utils/Constants";

/**
 * Either a popover menu or a context menu.
 */
export function PopoverMenu(params: {
  children?: React.ReactNode,
  className?: string,
  style?: React.CSSProperties,
  id?: string,
}): React.ReactNode {
  // div
  const div = React.useRef<null | HTMLDivElement>(null);

  // ?rtl
  const rtl = React.useContext(RTLContext);

  // ?theme
  const theme = React.useContext(ThemeContext);

  return (
    <Div
      className={
        ["PopoverMenu", (params.className ?? "").split(" ").filter(p => p != "")].join(" ")
      }
      id={params.id}
      style={params.style}
      ref={div}
      $backgroundColor={theme.colors.inputBackground}
      $borderColor={theme.colors.inputBorder}
      $foreground={theme.colors.foreground}>

      <div className="PopoverMenu-up-arrow"></div>
      <div className="PopoverMenu-content">
        {params.children}
      </div>
      <div className="PopoverMenu-down-arrow"></div>
    </Div>
  );
}

const Div = styled.div<{
  $backgroundColor: string,
  $borderColor: string,
  $foreground: string,
}> `
  && {
    display: inline-flex;
    flex-direction: column;
    position: fixed;
    background: ${$ => $.$backgroundColor};
    border: 0.15rem solid ${$ => $.$borderColor};
    padding: ${REMConvert.pixels.remPlusUnit(6)} 0;
    min-width: 12rem;
    max-height: 30rem;
    left: 0;
    top: 0;
    z-index: ${MAXIMUM_Z_INDEX};
    visibility: hidden;
    opacity: 0;
  }

  && > .PopoverMenu-up-arrow,
  && > .PopoverMenu-down-arrow {
    display: none;
    color: ${$ => $.$foreground};
    flex-direction: row;
    justify-content: center;
    height: ${REMConvert.pixels.remPlusUnit(10)};
  }

  && > .PopoverMenu-content {
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
    scrollbar-width: none;
    flex-grow: 3;
  }

  /* Item*/
  && > .PopoverMenu-content > .Item {
  }

  /* Indicator */
  && > .PopoverMenu-content > .Item > span:nth-child(3) > .Indicator {
  }

  /* Separator */
  && > .PopoverMenu-content > .Separator {
  }
`;