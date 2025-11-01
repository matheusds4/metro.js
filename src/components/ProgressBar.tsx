// third-party
import { Color, ColorObserver } from "@hydroperx/color";
import React from "react";
import { styled, keyframes } from "styled-components";
import extend from "extend";

// local
import { ThemeContext, PrimaryContext } from "../theme/Theme";
import * as MathUtils from "../utils/MathUtils";
import { REMObserver } from "../utils/REMObserver";
import * as REMConvert from "../utils/REMConvert";

/**
 * Progress bar, either as dots or a solid minimalistic bar.
 */
export function ProgressBar(params: {
  /**
   * @default "solid"
   */
  variant?: ProgressBarVariant;
  /**
   * If a `solid` progress bar, indicates the percent (0-100) loaded.
   * @default 0
   */
  percent?: number;
  /**
   * If a `dots` progress bar, indicates the size of each dot.
   * @default 10
   */
  size?: number;

  style?: React.CSSProperties;
  className?: string;
  id?: string;
}) {
  // theme
  const theme = React.useContext(ThemeContext);

  // primary
  const primary = React.useContext(PrimaryContext);

  switch (params.variant ?? "solid") {
    case "dots": {
      // ProgressBar_dots_div
      //   .progress-bar__wrap
      //     .progress-bar__dot
      const size = REMConvert.pixels.remPlusUnit(params.size ?? 10);
      const color = primary ? theme.colors.primary : theme.colors.foreground;

      return (
        <ProgressBar_dots_div
          $size={size}
          $color={color}
          className={params.className}
          style={params.style}
          id={params.id}>

          <div className="progress-bar__wrap">
            <div className="progress-bar__dot"></div>
          </div>
          <div className="progress-bar__wrap">
            <div className="progress-bar__dot"></div>
          </div>
          <div className="progress-bar__wrap">
            <div className="progress-bar__dot"></div>
          </div>
          <div className="progress-bar__wrap">
            <div className="progress-bar__dot"></div>
          </div>
          <div className="progress-bar__wrap">
            <div className="progress-bar__dot"></div>
          </div>
        </ProgressBar_dots_div>
      );
    }
    case "solid": {
      // ProgressBar_solid_div
      //   ProgressBar_solid_loaded_div
      const unloaded_bg = theme.colors.progressBarBackground;
      const loaded_bg = primary ? theme.colors.primary : theme.colors.progressBarForeground;
      const w = MathUtils.clamp(params.percent ?? 0, 0, 100) + "%";
      return (
        <ProgressBar_solid_div
          $bg={unloaded_bg}
          className={params.className}
          style={params.style}
          id={params.id}>
          <ProgressBar_solid_loaded_div $bg={loaded_bg} $width={w}/>
        </ProgressBar_solid_div>
      );
    }
    default: {
      throw new Error();
    }
  }
}

export type ProgressBarVariant =
  | "dots"
  | "solid";

const ProgressBar_solid_div = styled.div<{
  $bg: string;
}> `
  && {
    height: 0.5rem;
    background: ${$ => $.$bg};
  }
`;

const ProgressBar_solid_loaded_div = styled.div<{
  $bg: string;
  $width: string;
}> `
  && {
    width: ${$ => $.$width};
    height: 100%;
    background: ${$ => $.$bg};
  }
`;

// dot animation
const dot_animation = keyframes `
  0% {
    left: 0%;
    opacity: 0;
    animation-timing-function: ease-out;
  }
  20% {
    left: 30%;
    opacity: 1;
    animation-timing-function: linear;
  }
  40% {
    left: 60%;
    animation-timing-function: ease-out;
  }
  60% {
    left: 90%;
    opacity: 0;
  }
`;

const ProgressBar_dots_div = styled.div<{
  $size: string;
  $color: string;
}> `
  && {
    position: relative;
    overflow: hidden;
    height: ${$ => $.$size};
  }

  && .progress-bar__wrap {
    position: absolute;
    animation-iteration-count: infinite;
    animation-name: ${dot_animation};
    animation-duration: 4000ms;
  }

  && .progress-bar__wrap:nth-of-type(2) {
    animation-delay: 500ms;
  }

  && .progress-bar__wrap:nth-of-type(3) {
    animation-delay: 1000ms;
  }

  && .progress-bar__wrap:nth-of-type(4) {
    animation-delay: 1500ms;
  }

  && .progress-bar__wrap:nth-of-type(5) {
    animation-delay: 2000ms;
  }

  && .progress-bar__dot {
    position: absolute;
    background: ${$ => $.$color};
    border-radius: 100%;
    left: calc(0rem - ${$ => $.$size});
    width: ${$ => $.$size};
    height: ${$ => $.$size};
  }
`;