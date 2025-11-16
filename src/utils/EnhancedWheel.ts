// third-party
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/dist/ScrollToPlugin";

// local
import * as MathUtils from "./MathUtils";

/**
 * Enhanced wheel scroll implementation.
 */
export class EnhancedWheel {
  private last_wheel_timestamp: number = -1;
  private wheel_multiplier: number = 2;
  private gsap_wheel_tween: null | gsap.core.Tween = null;
  private handler: (e: WheelEvent) => void;

  //
  public constructor(private element: HTMLElement, direction: RollDirection) {
    this.handler = direction == "horizontal" ?
      this.wheel_horizontal.bind(this) :
      this.wheel_vertical.bind(this);
    this.element.addEventListener("wheel", this.handler, { passive: false });
  }

  //
  public destroy(): void {
    this.element.removeEventListener("wheel", this.handler);
  }

  // horizontal wheel roll
  wheel_horizontal(e: WheelEvent): void {
    const div = e.currentTarget as HTMLDivElement;
    // deltaMode == DOM_DELTA_PIXEL
    if (e.deltaMode == 0) {
      if (e.deltaX || e.deltaY == 0) return;

      e.preventDefault();
      e.stopPropagation();
      // increase scroll depending on wheel-roll duration
      if (this.last_wheel_timestamp != -1) {
        const last_roll_recent = this.last_wheel_timestamp > Date.now() - 250;
        if (last_roll_recent) {
          this.wheel_multiplier *= 1.2;
          this.wheel_multiplier = MathUtils.clamp(this.wheel_multiplier, 1, 16);
        } else {
          this.wheel_multiplier = 2;
        }
      } else {
        this.wheel_multiplier = 2;
      }
      const delta = e.deltaY * this.wheel_multiplier;
      let target_scroll = div.scrollLeft + delta;
      target_scroll = MathUtils.clamp(target_scroll, 0, div.scrollWidth);
      if (this.gsap_wheel_tween) {
        this.gsap_wheel_tween!.kill();
        this.gsap_wheel_tween = null;
      }
      gsap.registerPlugin(ScrollToPlugin);
      this.gsap_wheel_tween = gsap.to(div, {
        scrollLeft: target_scroll,
        duration: 0.3,
        ease: "power1.out",
      });
      this.gsap_wheel_tween!.then(() => {
        this.gsap_wheel_tween = null;
      });
      this.last_wheel_timestamp = Date.now();
    }
  }

  // vertical wheel roll
  wheel_vertical(e: WheelEvent): void {
    const div = e.currentTarget as HTMLDivElement;
    // deltaMode == DOM_DELTA_PIXEL
    if (e.deltaMode == 0) {
      if (e.deltaX || e.deltaY == 0) return;

      e.preventDefault();
      e.stopPropagation();
      // increase scroll depending on wheel-roll duration
      if (this.last_wheel_timestamp != -1) {
        const last_roll_recent = this.last_wheel_timestamp > Date.now() - 250;
        if (last_roll_recent) {
          this.wheel_multiplier *= 1.2;
          this.wheel_multiplier = MathUtils.clamp(this.wheel_multiplier, 1, 16);
        } else {
          this.wheel_multiplier = 2;
        }
      } else {
        this.wheel_multiplier = 2;
      }
      const delta = e.deltaY * this.wheel_multiplier;
      let target_scroll = div.scrollTop + delta;
      target_scroll = MathUtils.clamp(target_scroll, 0, div.scrollHeight);
      if (this.gsap_wheel_tween) {
        this.gsap_wheel_tween!.kill();
        this.gsap_wheel_tween = null;
      }
      gsap.registerPlugin(ScrollToPlugin);
      this.gsap_wheel_tween = gsap.to(div, {
        scrollTop: target_scroll,
        duration: 0.3,
        ease: "power1.out",
      });
      this.gsap_wheel_tween!.then(() => {
        this.gsap_wheel_tween = null;
      });
      this.last_wheel_timestamp = Date.now();
    }
  };
}

type RollDirection = "horizontal" | "vertical";