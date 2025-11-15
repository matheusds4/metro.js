// third-party
import * as assert from "assert";
import React from "react";
import Draggable from "@hydroperx/draggable";
import { styled } from "styled-components";

// local
import { SliderStop } from "./SliderStop";
import { RTLContext } from "../layout/RTL";
import { ThemeContext, PrimaryContext } from "../theme/Theme";
import { MAXIMUM_Z_INDEX } from "../utils/Constants";
import * as MathUtils from "../utils/MathUtils";
import * as ColorUtils from "../utils/ColorUtils";

/**
 * Horizontal slider.
 * 
 * For the slider to work, specify either:
 * 
 * - `start` and `end`, or
 * - `stops`
 * 
 * @throws If `stops` is empty.
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
  assert(typeof params.start !== "undefined" ? typeof params.end !== "undefined" : true, "If slider start is specified, end must also be specified.");
  assert(typeof params.end !== "undefined" ? typeof params.start !== "undefined" : true, "If slider end is specified, start must also be specified.");
  assert(typeof params.start !== "undefined" ? !params.stops : !!params.stops, "One of slider start+end or stops must be specified.");
  assert(!!params.stops ? params.stops.length != 0 : true, "Slider stops must be non-empty.");

  // basics
  const button = React.useRef<null | HTMLButtonElement>(null);
  const past_div = React.useRef<null | HTMLDivElement>(null);
  const thumb_div = React.useRef<null | HTMLDivElement>(null);
  const thumb_significant_div = React.useRef<null | HTMLDivElement>(null);
  const val_display_div = React.useRef<null | HTMLDivElement>(null);
  const stops_ref = React.useRef<undefined | SliderStop[]>(params.stops);
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

  // sync stops
  React.useEffect(() => {
    stops_ref.current = params.stops;
    val_display_div.current!.innerText = get_display_label();
  }, [params.stops]);

  // position everything right.
  function reflect(): void {
    fixme();
  }

  // returns the display label for the selected value.
  function get_display_label(): string {
    let label = "";
    if (stops_ref.current) {
      const stop = stops_ref.current!.find(v => v.value == value.current)!;
      label = stop.label ?? stop.value.toString();
    } else {
      label = value.current.toString();
    }
    return label;
  }

  return (
    <>
      <HSliderButton
        id={params.id}
        className={[
          "HSlider",
          ...(rtl ? ["rtl"] : []),
          ...(params.className ?? "").split(" ").filter(c => c != "")
        ].join(" ")}
        style={params.style}
        ref={obj => {
          button.current = obj;
          if (typeof params.ref == "function") {
            params.ref(obj);
          } else if (params.ref) {
            params.ref!.current = obj;
          }
        }}
        $bg={non_past_bg}>
        <HSlider_past_div ref={past_div} $bg={past_bg}/>
        <HSlider_thumb_div ref={thumb_div} $bg={theme.colors.foreground}>
          <div ref={thumb_significant_div} className="significant"></div>
        </HSlider_thumb_div>
      </HSliderButton>
      <ValueDisplayDiv
        ref={val_display_div}
        className={[
          ...(rtl ? ["rtl"] : []),
        ].join(" ")}
        $bg_behind={theme.colors.background}
        $bg={theme.colors.inputBackground}
        $border={theme.colors.inputBorder}
        $foreground={theme.colors.foreground}>
        {get_display_label()}
      </ValueDisplayDiv>
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
}> `
  && {
    height: 100%;
    background: ${$ => $.$bg};
  }
`;

const HSlider_thumb_div = styled.div<{
  $bg: string;
}> `
  && {
    display: flex;
    flex-direction: row;
    justify-content: center;
    position: absolute;
    width: 2.5rem;
    height: 100%;
  }

  && > .significant {
    width: 1.5rem;
    height: 100%;
    background: ${$ => $.$bg};
  }
`;

const ValueDisplayDiv = styled.div<{
  $border: string,
  $bg: string,
  $bg_behind: string,
  $foreground: string,
}>`
  && {
    background: ${$ => $.$bg};
    border: 0.15rem solid ${$ => ColorUtils.alphaZeroIfFar({ background: $.$bg_behind, color: $.$border })};
    color: ${$ => $.$foreground};
    display: inline-block;
    visibility: hidden;
    position: fixed;
    padding: 0.4rem;
    font-size: 0.77rem;
    z-index: ${MAXIMUM_Z_INDEX};
    overflow-wrap: anywhere;
  }
  &&.rtl {
    text-align: right;
  }
`;