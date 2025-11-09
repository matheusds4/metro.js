// third-party
import * as React from "react";
import { styled } from "styled-components";
import { Color } from "@hydroperx/color";
import Draggable from "@hydroperx/draggable";

// local
import { RTLContext } from "../layout/RTL";
import { ThemeContext, PrimaryContext, Theme } from "../theme/Theme";
import { REMObserver } from "../utils/REMObserver";
import * as REMConvert from "../utils/REMConvert";
import * as ColorUtils from "../utils/ColorUtils";
import * as MathUtils from "../utils/MathUtils";

/**
 * Checkbox component.
 */
export function CheckBox(params: CheckBoxParams) {
  // ?theme
  const theme = React.useContext(ThemeContext);

  // ?primary
  const primary = React.useContext(PrimaryContext);

  // ?rtl
  const rtl = React.useContext(RTLContext);
  const rtl_ref = React.useRef<boolean>(rtl);

  // misc.
  const button_ref = React.useRef<HTMLButtonElement | null>(null);
  const unchecked_div_ref = React.useRef<HTMLDivElement | null>(null);
  const checked_div_ref = React.useRef<HTMLDivElement | null>(null);
  const carret_ref = React.useRef<HTMLDivElement | null>(null);
  const carret_touched = React.useRef<boolean>(false);

  const changed = React.useRef<boolean>(false);
  const value_ref = React.useRef<boolean>(!!params.default);
  let [checked_horizontal_pos, set_checked_horizontal_pos] = React.useState<number>(
    rtl ? (value_ref.current ? 100 : 0) : (value_ref.current ? 0 : 100),
  ); // percent
  const rem = React.useRef<number>(16);

  // misc.
  const border_width = 0.15;
  const padding = 0.15;
  const w = REMConvert.pixels.rem(42);
  const h = REMConvert.pixels.rem(18.3);
  const carret_w = REMConvert.pixels.rem(12);
  let checked_color = ColorUtils.enhance({
    background: theme.colors.background,
    color: theme.colors.primary,
  });
  const checked_hover_color = ColorUtils.lighten(checked_color, 0.3);
  const border_color = primary
    ? checked_color
    : ColorUtils.contrast(theme.colors.background, 0.4);
  let unchecked_color = primary ? checked_color : border_color;
  const unchecked_hover_color = ColorUtils.lighten(unchecked_color, 0.3);
  if (primary || Color(theme.colors.background).isDark()) {
    checked_color = ColorUtils.lighten(checked_color, 0.3);
    unchecked_color = ColorUtils.darken(unchecked_color, 0.1);
  }

  // carret misc.
  const leftmost_carret_pos = -border_width;
  const rightmost_carret_pos = w + border_width - carret_w;
  const center_carret_pos = w/2 - carret_w/2 - border_width;

  // carret drag-n-drop
  const draggable = React.useRef<Draggable | null>(null);
  const dragging = React.useRef<boolean>(false);

  // observe the "rem" size
  React.useEffect(() => {
    const rem_observer = new REMObserver(value => {
      rem.current = value;
    });

    // cleanup
    return () => {
      rem_observer.cleanup();
    };
  }, []);

  // sync ?rtl and positions
  React.useEffect(() => {
    rtl_ref.current = rtl;
    update_positions();
  }, [rtl]);

  // sync default value
  React.useEffect(() => {
    if (!changed.current) {
      value_ref.current = !!params.default;
      button_ref.current!.setAttribute("data-value", value_ref.current.toString());
      update_positions();
    }
  }, [params.default]);

  // carret drag-n-drop
  React.useEffect(() => {
    if (params.disabled) {
      return;
    }
    draggable.current = new Draggable(carret_ref.current!, {
      cascadingUnit: "rem",
      threshold: "0.9rem",
      setPosition: false,
      limit(x, y, x0, y0) {
        return {
          x: Math.min(Math.max(x, leftmost_carret_pos*rem.current), rightmost_carret_pos*rem.current),
          y: y0,
        };
      },
      onDragStart() {
        dragging.current = true;
      },
      onDrag(_, x) {
        x /= rem.current;

        // position checked rectangle
        set_checked_horizontal_pos(MathUtils.clamp(Math.round(100 - (x / (rightmost_carret_pos-leftmost_carret_pos))*100), 0, 100));

        // reset top property set by Draggable
        carret_ref.current!.style.top = "";
      },
      onDragEnd(_, x) {
        x /= rem.current;

        // set new value
        value_ref.current = x >= center_carret_pos;
        if (rtl_ref.current) {
          value_ref.current = !value_ref.current;
        }
        changed.current = true;
        button_ref.current!.setAttribute("data-value", value_ref.current.toString());
        update_positions();

        // reset top property set by Draggable
        carret_ref.current!.style.top = "";

        // trigger event
        params.change?.(value_ref.current);

        // undo flags
        window.setTimeout(() => {
          dragging.current = false;
          carret_touched.current = false;
        }, 75);
      },
    });

    // cleanup
    return () => {
      draggable.current?.destroy();
      draggable.current = null;
    };
  }, [params.disabled]);

  // handle click
  function button_click() {
    window.setTimeout(() => {
      // do not duplicate carret handler
      if (carret_touched.current) {
        return;
      }

      // do nothing if dragging
      if (dragging.current) {
        dragging.current = false;
        return;
      }

      // set new value
      value_ref.current = !value_ref.current;
      button_ref.current!.setAttribute("data-value", value_ref.current.toString());
      changed.current = true;
      update_positions();

      // trigger event
      params.change?.(value_ref.current);
    }, 7);
  }

  // handle touch end
  function button_touchEnd() {
    carret_touched.current = true;

    // do nothing if dragging
    if (dragging.current) {
      dragging.current = false;
      return;
    }

    // set new value
    value_ref.current = !value_ref.current;
    button_ref.current!.setAttribute("data-value", value_ref.current.toString());
    changed.current = true;
    update_positions();

    // trigger event
    params.change?.(value_ref.current);

    // clear flag
    window.setTimeout(() => {
      carret_touched.current = false;
    }, 17);
  }

  function update_positions() {
    const value = value_ref.current;
    const carret_left = !rtl_ref.current ? (value ? 100 : 0) : value ? 0 : 100;
    carret_ref.current!.style.left = (carret_left/100 * (rightmost_carret_pos - leftmost_carret_pos)) + "rem";
    // position checked rectangle
    set_checked_horizontal_pos(rtl_ref.current ? (value ? 100 : 0) : (value ? 0 : 100));
  }

  return (
    <Button
      ref={val => {
        button_ref.current = val;
        if (typeof params.ref == "function") {
          params.ref(val);
        } else if (params.ref) {
          params.ref.current = val;
        }
      }}
      id={params.id}
      data-value={value_ref.current.toString()}
      disabled={params.disabled}
      style={params.style}
      className={["CheckBox", ...(params.className ?? "").split(" ").filter(c => c != "")].join(" ")}
      onClick={e => {
        button_click();
      }}
      $border_width={border_width}
      $border_color={border_color}
      $padding={padding}
      $w={w}
      $h={h}
      $theme={theme}
      $unchecked_color={unchecked_color}
      $unchecked_hover_color={unchecked_hover_color}
      $checked_color={checked_color}
      $checked_hover_color={checked_hover_color}
      $rtl={rtl}
      $carret_w={carret_w}
      $checked_horizontal_pos={checked_horizontal_pos}
    >
      <div ref={unchecked_div_ref} className="CheckBox-unchecked-rect"></div>
      <div ref={checked_div_ref} className="CheckBox-checked-rect"></div>
      <div
        ref={carret_ref}
        className="CheckBox-carret"
        onTouchStart={e => {
          dragging.current = false;
          carret_touched.current = false;
        }}
        onTouchEnd={button_touchEnd as any}>
      </div>
    </Button>
  );
}

export type CheckBoxParams = {
  id?: string;
  style?: React.CSSProperties;
  className?: string;
  ref?: React.Ref<HTMLButtonElement | null>;

  /**
   * Default value.
   */
  default?: boolean;

  /**
   * Whether input is disabled.
   */
  disabled?: boolean;

  /**
   * Event triggered on value change.
   */
  change?: (value: boolean) => void;
};

// css
const Button = styled.button<{
  $border_width: number;
  $border_color: string;
  $padding: number;
  $w: number;
  $h: number;
  $theme: Theme;
  $unchecked_color: string;
  $unchecked_hover_color: string;
  $checked_color: string;
  $checked_hover_color: string;
  $rtl: boolean;
  $carret_w: number;
  $checked_horizontal_pos: number;
}>`
  && {
    background: none;
    border: ${$ => $.$border_width}rem solid ${$ => $.$border_color};
    display: flex;
    flex-direction: row;
    padding: ${$ => $.$padding}rem;
    width: ${$ => $.$w}rem;
    height: ${$ => $.$h}rem;
    outline: none;
    position: relative;
  }

  &&:hover:not(:disabled),
  &&:focus:not(:disabled) {
    outline: 0.05rem dotted ${$ => $.$theme.colors.focusDashes};
    outline-offset: 0.3rem;
  }

  &&:disabled {
    opacity: 0.5;
  }

  && .CheckBox-unchecked-rect {
    background: ${$ => $.$unchecked_color};
    width: 100%;
    height: 100%;
  }

  &&:hover:not(:disabled) .CheckBox-unchecked-rect {
    background: ${$ => $.$unchecked_hover_color};
  }

  && .CheckBox-checked-rect {
    position: absolute;
    ${$ => (!$.$rtl ? "left" : "right")}: 0;
    ${$ => (!$.$rtl ? "right" : "width")}: ${$ => $.$checked_horizontal_pos}%;
    top: 0;
    bottom: 0;
    transition: left 110ms ease-out, right 110ms ease-out;
    background: ${$ => $.$checked_color};
  }

  &&:hover:not(:disabled) .CheckBox-checked-rect {
    background: ${$ => $.$checked_hover_color};
  }

  && .CheckBox-carret {
    position: absolute;
    transition: left 110ms ease-out, top 110ms ease-out;
    width: ${$ => $.$carret_w}rem;
    top: -0.4rem;
    bottom: -0.4rem;
    background: ${$ => $.$theme.colors.foreground};
  }
`;