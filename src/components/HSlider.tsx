// third-party
import React from "react";
import Draggable from "@hydroperx/draggable";
import { styled } from "styled-components";

// local
import { SliderStop } from "./SliderStop";
import { RTLContext } from "../layout/RTL";
import { ThemeContext, PrimaryContext } from "../theme/Theme";
import * as MathUtils from "../utils/MathUtils";
import * as ColorUtils from "../utils/ColorUtils";

/**
 * Horizontal slider.
 * 
 * For the slider to work, specify either:
 * 
 * - `start` and `end`, or
 * - `stops`
 */
export function HSlider(params: {
  default: number,
  start?: number,
  end?: number,
  stops?: SliderStop[],

  id?: string,
  className?: string,
  style?: React.CSSProperties,
  ref?: React.Ref<null | HTMLButtonElement>,

  /**
   * Change event.
   */
  change?: (value: any) => void,
}): React.ReactNode {

  // basics
  const button = React.useRef<null | HTMLButtonElement>(null);
  const value = React.useRef<number>(params.default);
  const changed = React.useRef<boolean>(false);
  const theme = React.useContext(ThemeContext);
  const primary = React.useContext(PrimaryContext);
  const rtl = React.useContext(RTLContext);

  // colors
  const non_past_bg = theme.colors.progressBarBackground;
  const past_bg = primary ? theme.colors.primary : theme.colors.progressBarForeground;

  // sync default
  React.useEffect(() => {
    if (!changed.current) {
      value.current = params.default ?? 0;
      reflect();
    }
  }, [params.default]);

  // position everything right.
  function reflect(): void {
    fixme();
  }

  return (
    <>
      <HSliderButton
        className={[
          "HSlider",
          ...(rtl ? ["rtl"] : []),
          ...(params.className ?? "").split(" ").filter(c => c != "")
        ].join(" ")}
        ref={obj => {
          button.current = obj;
          if (typeof params.ref == "function") {
            params.ref(obj);
          } else if (params.ref) {
            params.ref!.current = obj;
          }
        }}
        $bg={non_past_bg}>
        <HSlider_past_div $bg={past_bg} $width={w}/>
        <HSlider_caret_div $bg={theme.colors.foreground}/>
      </HSliderButton>
    </>
  );
}

const HSliderButton = styled.button<{
  $bg: string,
}> `
  && {
    position: relative;
    height: 0.5rem;
    background: ${$ => $.$bg};
    border: none;
    outline: none;
  }
`;

const HSlider_past_div = styled.div<{
  $bg: string;
  $width: string;
}> `
  && {
    width: ${$ => $.$width};
    height: 100%;
    background: ${$ => $.$bg};
  }
`;

const HSlider_caret_div = styled.div<{
  $bg: string;
}> `
  && {
    position: absolute;
    width: 1.5rem;
    height: 100%;
    background: ${$ => $.$bg};
  }
`;