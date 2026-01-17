// third-party
import { Color, ColorObserver } from "com.sweaxizone.color";
import React from "react";
import { styled, keyframes } from "styled-components";
import extend from "extend";
import gsap from "gsap";

// local
import { RTLContext } from "../layout/RTL";
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
   * @default 5
   */
  size?: number;

  style?: React.CSSProperties;
  className?: string;
  id?: string;
}) {
  // variant
  const variant = React.useRef(params.variant ?? "solid");

  // dot size decrease for progress dots
  const [dot_decrease, set_dot_decrease] = React.useState<number>(0);

  // theme
  const theme = React.useContext(ThemeContext);

  // primary
  const primary = React.useContext(PrimaryContext);

  // div reference
  const div_ref = React.useRef<null | HTMLDivElement>(null);

  // rem measurement
  const rem = React.useRef<number>(16);

  // gsap tweens
  const gsap_tweens = React.useRef<gsap.core.Tween[]>([]);

  // initialization
  React.useEffect(() => {
    // resize observer
    const resize_observer = new ResizeObserver(() => {
      reset_animation();
    });
    resize_observer.observe(div_ref.current!);

    // rem observer
    const rem_observer = new REMObserver(new_rem => {
      rem.current = new_rem;
      reset_animation();
    });

    return () => {
      resize_observer.disconnect();
      rem_observer.cleanup();
    };
  }, []);

  // reflect variant
  React.useEffect(() => {

    variant.current = params.variant ?? "solid";
    reset_animation();

  }, [params.variant ?? "solid"]);

  // setup animation
  function reset_animation(): void {
    // destroy previous animation
    for (const tween of gsap_tweens.current) {
      tween.kill();
    }
    gsap_tweens.current.length = 0;

    // setup moving dots animation
    if (variant.current == "dots") {
      const dots = Array.from(div_ref.current!.getElementsByClassName("progress-bar__wrap")) as HTMLElement[];
      const div_width = div_ref.current!.offsetWidth;
      let center_start_x = 40;
      let center_end_x = 50;
      let delay_multiplier = 0.3;
      const portrait_width = 500;
      if (div_width <= portrait_width) {
        center_start_x = 25;
        center_end_x = 69;
        set_dot_decrease(2.5);
      } else {
        set_dot_decrease(0);
      }
      for (let i = 0; i < 5; i++) {
        animateDot(dots[i], i);
      }
      function animateDot(dot: HTMLElement, index: number): void {
        let tween = gsap.fromTo(dot,
          // from
          {
            left: "0%",
            opacity: 0,
          },
          // to
          {
            left: center_start_x + "%",
            opacity: 1,
            duration: 0.5,
            ease: "power1.out",
            delay: index * delay_multiplier,
          }
        );
        gsap_tweens.current!.push(tween);
        tween.then(() => {
          gsap_tweens.current.splice(gsap_tweens.current!.indexOf(tween), 1);
          tween = gsap.to(dot, {
            left: center_end_x + "%",
            duration: 2,
            ease: "none",
          });
          gsap_tweens.current!.push(tween);
          tween.then(() => {
            gsap_tweens.current.splice(gsap_tweens.current!.indexOf(tween), 1);
            tween = gsap.to(dot, {
              left: "100%",
              opacity: 0,
              duration: 0.5,
              ease: "power1.in",
            });
            gsap_tweens.current!.push(tween);
            tween.then(() => {
              gsap_tweens.current.splice(gsap_tweens.current!.indexOf(tween), 1);

              // restart
              window.setTimeout(() => {
                if (gsap_tweens.current.length == 0) {
                  reset_animation();
                }
              }, 1_000);
            });
          });
        });
      }
    }
  }

  switch (variant.current) {
    case "dots": {
      // ProgressBar_dots_div
      //   .progress-bar__wrap
      //     .progress-bar__dot
      const color = primary ? theme.colors.primary : theme.colors.foreground;

      return (
        <ProgressBar_dots_div
          ref={div_ref}
          $size={REMConvert.pixels.remPlusUnit((params.size ?? 5) - dot_decrease)}
          $color={color}
          className={["ProgressBar", "dots", ...(params.className ?? "").split(" ").filter(c => c != "")].join(" ")}
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
          ref={div_ref}
          $bg={unloaded_bg}
          className={["ProgressBar", "solid", ...(params.className ?? "").split(" ").filter(c => c != "")].join(" ")}
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

const ProgressBar_dots_div = styled.div<{
  $size: string;
  $color: string;
}>`
  && {
    position: relative;
    overflow: hidden;
    height: ${$ => $.$size};
  }

  && .progress-bar__wrap {
    position: absolute;
    width: ${$ => $.$size};
    height: ${$ => $.$size};
  }

  && .progress-bar__dot {
    width: ${$ => $.$size};
    height: ${$ => $.$size};
    border-radius: 50%;
    background: ${$ => $.$color};
    left: calc(0rem - ${$ => $.$size});
  }
`;