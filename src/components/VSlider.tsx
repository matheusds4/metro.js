// third-party
import assert from "assert";
import React from "react";
import { input } from "com.sweaxizone.inputaction";
import { styled } from "styled-components";
import * as FloatingUI from "@floating-ui/dom";

// local
import { SliderStop } from "./SliderStop";
import { RTLContext } from "../layout/RTL";
import { ThemeContext, PrimaryContext } from "../theme/Theme";
import { MAXIMUM_Z_INDEX } from "../utils/Constants";
import { REMObserver } from "../utils/REMObserver";
import * as ColorUtils from "../utils/ColorUtils";
import * as MathUtils from "../utils/MathUtils";
import * as ScaleUtils from "../utils/ScaleUtils";

/**
 * Vertical slider.
 * 
 * For the slider to work, specify either:
 * 
 * - `start` and `end`, or
 * - `stops`
 * 
 * @throws If both `start+end` and `stops` were specified.
 * @throws If `stops` is specified and empty.
 * @throws If `stops` is specified and is not succeeding in ascending order.
 * @throws If `start > end`.
 */
export function VSlider(params: {
  default: number,
  /**
   * Start (inclusive).
   */
  start?: number,
  /**
   * End (inclusive).
   */
  end?: number,
  /**
   * Whether the slider goes top-down. If top-down, then the 100%
   * point is at the bottom.
   * @default false
   */
  topdown?: boolean,
  /**
   * When `start..end` are specified, indicates whether
   * to use integer values when the user changes
   * the value.
   *
   * @default true
   */
  integer?: boolean,
  /**
   * Increment used for arrow control when `start..end` are specified.
   *
   * @default 1
   */
  increment?: number,
  /**
   * When `start..end` are specified, indicates the maximum number
   * of digits after the decimal point.
   */
  fixed?: number,
  stops?: SliderStop[],

  disabled?: boolean,

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
  assert(typeof params.start !== "undefined" ? params.start! <= params.end! : true, "Slider start must be <= end.");
  assert(!!params.stops ? params.stops.length != 0 : true, "Slider stops must be non-empty.");

  // if stops are specified, then make sure they are sequential
  // in ascending order.
  if (params.stops) {
    const s = params.stops!;
    for (let i = 1; i < s.length; i++) {
      assert(s[i].value > s[i - 1].value, "Slider stops must be succeeding in ascending order.");
    }
  }

  // basics
  const button = React.useRef<null | HTMLButtonElement>(null);
  const past_div = React.useRef<null | HTMLDivElement>(null);
  const thumb_div = React.useRef<null | HTMLDivElement>(null);
  const val_display_div = React.useRef<null | HTMLDivElement>(null);
  const start_ref = React.useRef<undefined | number>(params.start);
  const end_ref = React.useRef<undefined | number>(params.end);
  const stops_ref = React.useRef<undefined | SliderStop[]>(params.stops);
  const disabled_ref = React.useRef<boolean>(!!params.disabled);
  const change_handler = React.useRef<undefined | ((value: any) => void)>(params.change);
  const value = React.useRef<number>(params.default);
  const changed = React.useRef<boolean>(false);
  const theme = React.useContext(ThemeContext);
  const primary = React.useContext(PrimaryContext);
  const rtl = React.useContext(RTLContext);
  const rtl_ref = React.useRef(rtl);
  const bottomup_ref = React.useRef(!params.topdown);
  const rem = React.useRef<number>(16);
  const input_pressed_handler = React.useRef<null | (() => void)>(null);
  const integer = React.useRef<boolean>(params.integer ?? true);
  const increment = React.useRef<number>(params.increment ?? 1);
  const fixed = React.useRef<undefined | number>(params.fixed);
  const dnd = React.useRef<null | DND>(null);

  // colors
  const non_past_bg = theme.colors.sliderBackground;
  const past_bg = primary ? theme.colors.primary : theme.colors.sliderPastBackground;

  // initialization
  React.useEffect(() => {

    // resize observer
    const resize_observer = new ResizeObserver(() => {
      // when resizing, slider positions may get slightly wrong.
      // fix them.
      if (!dnd.current!.dragging) {
        put_slider_position();
      }
    });
    resize_observer.observe(button.current!);

    // drag-n-drop
    dnd.current = new DND(
      button.current!,
      thumb_div.current!,
      val_display_div.current!,
      put_slider_position,
      put_past_position,
      put_thumb_position,
      set_cast_value,
      get_display_label,
      show_value_display,
      hide_value_display,
      changed,
      change_handler,
      value,
      bottomup_ref,
      start_ref,
      end_ref,
      stops_ref
    );

    // REMObserver
    const rem_observer = new REMObserver(val => {
      rem.current = val;
      // initial rem may have been wrong, so
      // fix it in any case.
      put_slider_position();
    });

    // cleanup
    return () => {
      resize_observer.disconnect();
      rem_observer.cleanup();

      // dispose of global input handler
      if (input_pressed_handler.current) {
        input.off("inputPressed", input_pressed_handler.current);
        input_pressed_handler.current = null;
      }
    };

  }, []);

  // sync `integer` option
  React.useEffect(() => {

    integer.current = params.integer ?? true;

  }, [params.integer ?? true]);

  // sync `increment` option
  React.useEffect(() => {

    increment.current = params.increment ?? 1;

  }, [params.increment ?? 1]);

  // sync `fixed` option
  React.useEffect(() => {

    fixed.current = params.fixed;

  }, [params.fixed]);

  // sync default
  React.useEffect(() => {

    if (!changed.current) {
      value.current = params.default ?? 0;

      // make sure value is in range and exact
      fix_value_range();

      put_slider_position();

      // trigger change
      change_handler.current?.(value.current);
    }

  }, [params.default]);

  // sync start/end
  React.useEffect(() => {

    start_ref.current = params.start;
    end_ref.current = params.end;

    // make sure value is in range and exact
    fix_value_range();

    // update label
    val_display_div.current!.innerText = get_display_label();

  }, [params.start, params.end]);

  // sync stops
  React.useEffect(() => {

    stops_ref.current = params.stops;

    // make sure value is in range and exact
    fix_value_range();

    // update label
    val_display_div.current!.innerText = get_display_label();

  }, [params.stops]);

  // sync disabled
  React.useEffect(() => {

    disabled_ref.current = !!params.disabled;
    if (disabled_ref.current) {
      dnd.current!.disable();
    } else {
      dnd.current!.enable();
    }

    // cleanup
    return () => {
      dnd.current!.destroy();
    };

  }, [params.disabled]);

  // sync `change` handler
  React.useEffect(() => {

    change_handler.current = params.change;

  }, [params.change]);

  // sync ?rtl
  React.useEffect(() => {

    rtl_ref.current = rtl;

  }, [rtl]);

  // sync `topdown` option
  React.useEffect(() => {

    bottomup_ref.current = !params.topdown;

    // update slider positions
    put_slider_position();

  }, [!params.topdown]);

  // sets value and rounds it to an integer
  // if the option is chosen.
  function set_cast_value(v: number): void {
    value.current = integer.current ? Math.round(v) : v;
    if (typeof fixed.current !== "undefined") {
      value.current = parseFloat(value.current.toFixed(fixed.current!));
    }
  }

  // position everything right.
  function put_slider_position(): void {
    const v = value.current!;
    let percent = 0;

    // determine percent based on stops
    if (stops_ref.current) {
      const stops = stops_ref.current!;
      const min = stops[0].value;
      const max = stops[stops.length - 1].value;
      percent = ((v - min) / (max - min)) * 100;
    // determine percent based on start..end (inclusive) range
    } else {
      const start = start_ref.current!;
      const end = end_ref.current!;
      percent = ((v - start) / (end - start)) * 100;
    }

    put_past_position(percent);
    put_thumb_position(percent);
  }

  // position only the past
  function put_past_position(percent: number): void {
    past_div.current!.style.top = "";
    past_div.current!.style.height = "";
    past_div.current!.style.bottom = "";

    if (bottomup_ref.current) {
      past_div.current!.style.bottom = "0";
      past_div.current!.style.height = percent + "%";
    } else {
      past_div.current!.style.top = "0";
      past_div.current!.style.height = percent + "%";
    }
  }

  // position only the thumb
  function put_thumb_position(percent: number): void {
    thumb_div.current!.style.top = "";
    thumb_div.current!.style.bottom = "";

    const thumb_height = thumb_div.current!.offsetHeight;
    const track_height = button.current!.clientHeight;

    // usable visual percentage of track
    const usable = 100 - (thumb_height / track_height) * 100;

    // percent mapped to the usable range
    const mapped = (percent / 100) * usable;

    if (bottomup_ref.current) {
      thumb_div.current!.style.bottom = mapped + "%";
    } else {
      thumb_div.current!.style.top = mapped + "%";
    }
  }

  // make sure value is in range and exact
  function fix_value_range(): void {
    if (typeof start_ref !== "undefined") {
      if (value.current < start_ref.current!) {
        value.current = params.start!;
        change_handler.current?.(value.current);
      } else if (value.current > end_ref.current!) {
        value.current = params.end!;
        change_handler.current?.(value.current);
      }
    } else if (!stops_ref.current!.some(v => v.value == value.current)) {
      value.current = stops_ref.current![0].value;
      change_handler.current?.(value.current);
    }
    put_slider_position();
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

  // show the value display
  function show_value_display(): void {
    val_display_div.current!.style.visibility = "visible";
    val_display_div.current!.innerText = get_display_label();
    FloatingUI.computePosition(thumb_div.current!, val_display_div.current!, {
      placement: "left",
      middleware: [
        FloatingUI.offset(16),
        FloatingUI.flip(),
        FloatingUI.shift(),
      ],
    }).then(r => {
      val_display_div.current!.style.left = r.x + "px";
      val_display_div.current!.style.top = r.y + "px";
    });
  }

  // hide the value display
  function hide_value_display(): void {
    val_display_div.current!.style.visibility = "";
  }

  // handle global input pressed
  function global_input_pressed(): void {
    let up = input.justPressed("navigateUp");
    let down = input.justPressed("navigateDown");
    if (!(up || down)) {
      return;
    }

    if (bottomup_ref.current) {
      up = !up;
      down = !down;
    }

    // handle arrows moving across stops
    if (stops_ref.current) {
      const stops = stops_ref.current!;
      const i = stops.findIndex(s => s.value == value.current);
      if (i !== -1) {
        if (up) {
          if (i > 0) {
            value.current = stops[i - 1].value;
            put_slider_position();
            change_handler.current?.(value.current);
            changed.current = true;
          }
        } else if (i < stops.length - 1) {
          value.current = stops[i + 1].value;
          put_slider_position();
          change_handler.current?.(value.current);
          changed.current = true;
        }
      }
    // handle arrows moving between start..end range
    } else {
      const start = start_ref.current!;
      const end = end_ref.current!;
      const new_val = MathUtils.clamp(up ? value.current - increment.current : value.current + increment.current, start, end);
      if (new_val != value.current) {
        set_cast_value(new_val);
        value.current = MathUtils.clamp(value.current, start, end);
        put_slider_position();
        change_handler.current?.(value.current);
        changed.current = true;
      }
    }
  }

  // handle focus
  function button_focus(): void {
    if (input_pressed_handler.current) {
      return;
    }
    input_pressed_handler.current = global_input_pressed;
    input.on("inputPressed", input_pressed_handler.current);
  }

  // handle blur
  function button_blur(): void {
    if (!input_pressed_handler.current) {
      return;
    }
    input.off("inputPressed", input_pressed_handler.current);
    input_pressed_handler.current = null;
  }

  return (
    <>
      <VSliderButton
        id={params.id}
        className={[
          "VSlider",
          ...(bottomup_ref.current ? ["bottomup"] : []),
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
        disabled={params.disabled}
        onFocus={button_focus}
        onBlur={button_blur}
        onMouseOver={e => {
          // show the value display
          show_value_display();
        }}
        onMouseOut={e => {
          // hide the value display if not dragging
          if (!dnd.current!.dragging) {
            hide_value_display();
          }
        }}
        $bg={non_past_bg}
        $focus_dashes={theme.colors.focusDashes}>
        <VSlider_past_div className="VSlider-past" ref={past_div} $bg={past_bg}/>
        <VSlider_thumb_div className="VSlider-thumb" ref={thumb_div} $bg={theme.colors.foreground}/>
      </VSliderButton>
      <ValueDisplayDiv
        ref={val_display_div}
        className={[
          "VSlider-value-display",
          ...(rtl_ref.current ? ["rtl"] : []),
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

const VSliderButton = styled.button<{
  $bg: string,
  $focus_dashes: string,
}> `
  && {
    position: relative;
    width: 1rem;
    background: ${$ => $.$bg};
    border: none;
    outline: none;
    padding: 0;
    margin: 0;
    overflow: hidden;
    min-height: 5rem;
  }

  &&:focus:not(:disabled) {
    outline: 0.05rem dotted ${$ => $.$focus_dashes};
    outline-offset: 0.3rem;
  }

  &&:disabled {
    opacity: 0.5;
  }
`;

const VSlider_past_div = styled.div<{
  $bg: string;
}> `
  && {
    position: absolute;
    left: 0;
    right: 0;
    background: ${$ => $.$bg};
  }
`;

const VSlider_thumb_div = styled.div<{
  $bg: string;
}> `
  && {
    position: absolute;
    height: 1.3rem;
    left: 0;
    right: 0;
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
    border: 0.15rem solid ${$ => ColorUtils.hide({ background: $.$bg_behind, color: $.$border })};
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

// drag-n-drop
class DND {
  private m_mouseDown: null | ((e: MouseEvent) => void) = null;
  private m_touchStart: null | ((e: TouchEvent) => void) = null;
  private m_global_mouseMove: null | ((e: MouseEvent) => void) = null;
  private m_global_touchMove: null | ((e: TouchEvent) => void) = null;
  private m_global_mouseUp: null | ((e: MouseEvent) => void) = null;
  private m_global_click: null | ((e: MouseEvent) => void) = null;
  private m_global_touchEnd: null | ((e: TouchEvent) => void) = null;
  private m_global_touchCancel: null | ((e: TouchEvent) => void) = null;
  private m_global_wheel: null | ((e: WheelEvent) => void) = null;
  private m_activeTouchId: number = -1;

  // new DND()
  public constructor(
    private button: HTMLButtonElement,
    private thumb_div: HTMLDivElement,
    private val_display_div: HTMLDivElement,
    private put_slider_position: () => void,
    private put_past_position: (percent: number) => void,
    private put_thumb_position: (percent: number) => void,
    private set_cast_value: (value: number) => void,
    private get_display_label: () => string,
    private show_value_display: () => void,
    private hide_value_display: () => void,
    private changed: React.RefObject<boolean>,
    private change_handler: React.RefObject<undefined | ((value: any) => void)>,
    private value: React.RefObject<number>,
    private rtl: React.RefObject<boolean>,
    private start: React.RefObject<undefined | number>,
    private end: React.RefObject<undefined | number>,
    private stops: React.RefObject<undefined | SliderStop[]>
  ) {
    //
  }

  // enable drag-n-drop
  public enable(): void {
    if (!this.m_mouseDown) {
      this.m_mouseDown = this.handle_pointer_down.bind(this);
      this.button.addEventListener("mousedown", this.m_mouseDown);
    }
    if (!this.m_touchStart) {
      this.m_touchStart = this.handle_pointer_down.bind(this);
      this.button.addEventListener("touchstart", this.m_touchStart);
    }
  }

  // diasble drag-n-drop
  public disable(): void {
    // forget pointer ID
    this.m_activeTouchId = -1;

    // hide value display div
    this.val_display_div.style.visibility = "";

    if (this.m_mouseDown) {
      this.button.removeEventListener("mousedown", this.m_mouseDown);
      this.m_mouseDown = null;
    }
    if (this.m_touchStart) {
      this.button.removeEventListener("touchstart", this.m_touchStart);
      this.m_touchStart = null;
    }
    if (this.m_global_mouseMove) {
      window.removeEventListener("mousemove", this.m_global_mouseMove);
      this.m_global_mouseMove = null;
    }
    if (this.m_global_touchMove) {
      window.removeEventListener("touchmove", this.m_global_touchMove);
      this.m_global_touchMove = null;
    }
    if (this.m_global_mouseUp) {
      window.removeEventListener("mouseup", this.m_global_mouseUp);
      this.m_global_mouseUp = null;
    }
    if (this.m_global_click) {
      window.removeEventListener("click", this.m_global_click);
      this.m_global_click = null;
    }
    if (this.m_global_touchEnd) {
      window.removeEventListener("touchend", this.m_global_touchEnd);
      this.m_global_touchEnd = null;
    }
    if (this.m_global_touchCancel) {
      window.removeEventListener("touchcancel", this.m_global_touchCancel);
      this.m_global_touchCancel = null;
    }
    if (this.m_global_wheel) {
      window.removeEventListener("wheel", this.m_global_wheel);
      this.m_global_wheel = null;
    }
  }

  // destroy drag-n-drop
  public destroy(): void {
    this.disable();
  }

  // whether dragging or not.
  public get dragging(): boolean {
    return !!this.m_global_mouseMove || !!this.m_global_touchMove;
  }

  // pointer down on the button
  private handle_pointer_down(e: Event): void {
    if (this.m_activeTouchId != -1 || !!this.m_global_mouseMove) {
      return;
    }

    // register global pointer move event
    this.m_global_mouseMove = this.drag_move.bind(this);
    window.addEventListener("mousemove", this.m_global_mouseMove);

    // register global pointer move event
    this.m_global_touchMove = this.drag_move.bind(this);
    window.addEventListener("touchmove", this.m_global_touchMove);

    // register global pointer up event
    this.m_global_mouseUp = this.drag_stop.bind(this);
    window.addEventListener("mouseup", this.m_global_mouseUp);

    // register global pointer up event
    this.m_global_click = this.drag_stop.bind(this);
    window.addEventListener("click", this.m_global_click);

    // register global pointer up event
    this.m_global_touchEnd = this.drag_stop.bind(this);
    window.addEventListener("touchend", this.m_global_touchEnd);

    // register global pointer cancel event
    this.m_global_touchCancel = this.drag_stop.bind(this);
    window.addEventListener("touchcancel", this.m_global_touchCancel);

    // register global wheel event
    this.m_global_wheel = (e: WheelEvent): void => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("wheel", this.m_global_wheel, { passive: false });

    // handle drag start
    this.drag_start(e);
  }

  // drag start
  private drag_start(e: Event): void {
    // remember pointer ID
    this.m_activeTouchId = -1;
    if (e instanceof TouchEvent) {
      this.m_activeTouchId = (e as TouchEvent).touches[0].identifier;
    }

    // update position
    this.update_position(e);
  }

  // drag move
  private drag_move(e: Event): void {
    // update position
    this.update_position(e);
  }

  // drag move
  private drag_stop(e: Event): void {
    if (e instanceof TouchEvent) {
      const found = !!Array.from((e as TouchEvent).changedTouches).find(t => t.identifier == this.m_activeTouchId);
      if (!found) {
        return;
      }
    }

    // forget pointer ID
    this.m_activeTouchId = -1;

    // hide value display div
    this.val_display_div.style.visibility = "";

    // forget global handlers
    if (this.m_global_mouseMove) {
      window.removeEventListener("mousemove", this.m_global_mouseMove);
      this.m_global_mouseMove = null;
    }
    if (this.m_global_touchMove) {
      window.removeEventListener("touchmove", this.m_global_touchMove);
      this.m_global_touchMove = null;
    }
    if (this.m_global_mouseUp) {
      window.removeEventListener("mouseup", this.m_global_mouseUp);
      this.m_global_mouseUp = null;
    }
    if (this.m_global_click) {
      window.removeEventListener("click", this.m_global_click);
      this.m_global_click = null;
    }
    if (this.m_global_touchEnd) {
      window.removeEventListener("touchend", this.m_global_touchEnd);
      this.m_global_touchEnd = null;
    }
    if (this.m_global_touchCancel) {
      window.removeEventListener("touchcancel", this.m_global_touchCancel);
      this.m_global_touchCancel = null;
    }
    if (this.m_global_wheel) {
      window.removeEventListener("wheel", this.m_global_wheel);
      this.m_global_wheel = null;
    }

    // update slider position
    this.put_slider_position();
  }

  // updates position based on where the pointer is moving
  // and where it originally started pressing at.
  private update_position(e: Event): void {
    // x
    let e_clientY = 0;
    if (e instanceof TouchEvent) {
      const touch = Array.from((e as TouchEvent).changedTouches).find(t => t.identifier == this.m_activeTouchId);
      if (!touch) {
        return;
      }
      e_clientY = touch!.clientY;
    } else {
      e_clientY = (e as MouseEvent).clientY;
    }

    // not at initial state anymore
    this.changed.current = true;

    // remember old value
    const old_value = this.value.current;

    // calculate the position percent
    const x = MathUtils.clamp(
      e_clientY,
      this.button.getBoundingClientRect().top,
      this.button.getBoundingClientRect().bottom
    ) - this.button.getBoundingClientRect().top;
    let percent = MathUtils.clamp((x / this.button.getBoundingClientRect().height) * 100, 0, 100);
    if (this.rtl.current) {
      percent = Math.abs(percent - 100);
    }

    // position thumb in %
    this.put_past_position(percent);
    this.put_thumb_position(percent);

    // update value
    //
    // snap to a stop
    if (this.stops.current) {
      const stops = this.stops.current!;
      const ratio = percent / 100;
      const i = MathUtils.clamp(Math.round(ratio * (stops.length - 1)), 0, stops.length - 1);
      this.value.current = stops[i].value;
    // cast to start..end range
    } else {
      const start = this.start.current!;
      const end = this.end.current!;
      this.set_cast_value(((end - start) * (percent / 100)) + start);
      this.value.current = MathUtils.clamp(this.value.current, start, end);
    }

    // show value display div
    this.show_value_display();

    // trigger `change` event
    if (this.value.current != old_value) {
      this.change_handler.current?.(this.value.current);
    }
  }
}