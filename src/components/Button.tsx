// third-party
import extend from "extend";
import { styled } from "styled-components";
import { computePosition, offset, flip, shift } from "@floating-ui/dom";
import React from "react";
import { Color } from "@hydroperx/color";

// local
import * as REMConvert from "../utils/REMConvert";
import { MAXIMUM_Z_INDEX } from "../utils/Constants";
import * as ColorUtils from "../utils/ColorUtils";
import { Icon, NativeIcon } from "./Icon";
import { RTLContext } from "../layout/RTL";
import { PrimaryContext, Theme, ThemeContext } from "../theme/Theme";
import {
  SimplePlacementType,
  getTooltipPlacement,
  skipTooltipPlacement
} from "../utils/PlacementUtils";

/**
 * Button component.
 */
export function Button(params: ButtonParams): React.ReactNode {
  // bindings
  const button = React.useRef<null | HTMLButtonElement>(null);

  // ?theme
  const theme = React.useContext(ThemeContext);

  // ?rtl
  const rtl = React.useContext(RTLContext);

  // linked popover menu (next-sibling) if any
  const linked_popover_menu = React.useRef<null | HTMLElement>(null);

  // inline styles
  const newStyle: React.CSSProperties = {};

  if (params.minWidth !== undefined)
    newStyle.minWidth = REMConvert.pixels.remPlusUnit(params.minWidth);
  if (params.maxWidth !== undefined)
    newStyle.maxWidth = REMConvert.pixels.remPlusUnit(params.maxWidth);
  if (params.minHeight !== undefined)
    newStyle.minHeight = REMConvert.pixels.remPlusUnit(params.minHeight);
  if (params.maxHeight !== undefined)
    newStyle.maxHeight = REMConvert.pixels.remPlusUnit(params.maxHeight);
  if (params.disabled) {
    newStyle.opacity = "0.67";
  }

  if (params.style) {
    extend(newStyle, params.style);
  }

  // styled-components tag
  let Button_comp = null;

  let color: Color | string = "",
    bg = "",
    hover_bg = "",
    hover_color = "",
    pressed_color = "";

  switch (params.variant ?? "secondary") {
    case "none": {
      const dark = Color(theme.colors.background).isDark();
      color = dark ? "#fff" : "#000";
      hover_bg = dark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)";

      Button_comp = NoneButton;
      break;
    }
    case "big": {
      const dark = Color(theme.colors.background).isDark();
      color = dark ? "#fff" : "#000";
      hover_bg = dark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)";

      Button_comp = BigButton;
      break;
    }
    case "anchor": {
      color = theme.colors.anchor ?? "#000";
      hover_color = ColorUtils.lighten(color, 0.3).toString();

      Button_comp = AnchorButton;
      break;
    }
    case "secondary": {
      if (params.outline) {
        const dark = Color(theme.colors.background).isDark();
        color = dark ? "#fff" : "#000";
        hover_bg = dark
          ? ColorUtils.lighten(theme.colors.background, 0.4).toString()
          : ColorUtils.darken(theme.colors.background, 0.3).toString();
        pressed_color = dark ? "#000" : "#fff";

        Button_comp = OutlineButton;
      } else {
        hover_bg = ColorUtils.lighten(theme.colors.secondary, 0.5);
        Button_comp = SecondaryButton;
      }
      break;
    }
    case "primary": {
      if (params.outline) {
        const dark = Color(theme.colors.background).isDark();
        color = dark ? "#fff" : "#000";
        bg = dark
          ? ColorUtils.lighten(theme.colors.background, 0.5).toString()
          : ColorUtils.darken(theme.colors.background, 0.3).toString();
        hover_bg = dark
          ? ColorUtils.lighten(theme.colors.background, 0.7).toString()
          : ColorUtils.darken(theme.colors.background, 0.5).toString();
        pressed_color = dark ? "#000" : "#fff";

        Button_comp = OutlinePrimaryButton;
      } else {
        hover_bg = ColorUtils.lighten(theme.colors.primary, 0.5);
        Button_comp = PrimaryButton;
      }
      break;
    }
    case "danger": {
      hover_bg = ColorUtils.lighten(theme.colors.danger, 0.5);
      Button_comp = DangerButton;
      break;
    }
    case "transparent": {
      Button_comp = TransparentButton;
      break;
    }
  }

  const tooltip = params.tooltip;
  const tooltip_place_ref = React.useRef<SimplePlacementType>("bottom");
  const [tooltip_visible, set_tooltip_visible] = React.useState<boolean>(false);
  const [tooltip_x, set_tooltip_x] = React.useState<number>(0);
  const [tooltip_y, set_tooltip_y] = React.useState<number>(0);
  const tooltip_el: React.RefObject<HTMLDivElement | null> = React.useRef(null);
  let tooltip_timeout = -1;
  const hovering = React.useRef<boolean>(false);

  // display tooltip
  const userPointerEnter = React.useRef<undefined | React.PointerEventHandler<HTMLButtonElement>>(undefined);
  const pointerEnter = (e: PointerEvent) => {
    hovering.current = true;
    if (tooltip_el.current) {
      const button = e.currentTarget as HTMLButtonElement;
      tooltip_timeout = window.setTimeout(() => {
        // do not open tooltip if linked PopoverMenu is open.
        if (linked_popover_menu.current?.getAttribute("data-open") == "true") {
          return;
        }

        if (hovering.current) {
          set_tooltip_visible(true);
        }
      }, 700);

      // adjust tooltip position
      window.setTimeout(() => {
        // do not open tooltip if linked PopoverMenu is open.
        if (linked_popover_menu.current?.getAttribute("data-open") == "true") {
          return;
        }

        (async() => {
          let prev_display = tooltip_el.current!.style.display;
          if (prev_display === "none") tooltip_el.current!.style.display = "inline-block";
          const r = await computePosition(button, tooltip_el.current!, {
            placement: (tooltip_place_ref.current + "-start") as any,
            middleware: [ offset(7), flip(), shift() ],
          });
          tooltip_el.current!.style.display = prev_display;
          set_tooltip_x(r.x);
          set_tooltip_y(r.y);
        })();
      }, 10);
    }

    return userPointerEnter.current?.(e as any);
  };

  // hide tooltip
  const userPointerLeave = React.useRef<undefined | React.PointerEventHandler<HTMLButtonElement>>(undefined);
  const pointerLeave = (e: PointerEvent): any => {
    hovering.current = false;
    if (tooltip_timeout !== -1) {
      window.clearTimeout(tooltip_timeout);
      tooltip_timeout = -1;
    }
    set_tooltip_visible(false);
    return userPointerLeave.current?.(e as any);
  };

  // detect linked PopoverMenu
  function detect_linked_menu(): void {
    // basics
    const button_el = button.current!;
    let menu_sibling = (button_el.nextElementSibling ?? null) as null | HTMLElement;

    if (!!menu_sibling && !!tooltip_el.current) {
      menu_sibling = (menu_sibling.nextElementSibling ?? null) as null | HTMLElement;
    }

    // delayed detection
    window.setTimeout(() => {
      if (menu_sibling?.classList.contains("PopoverMenu")) {
        linked_popover_menu.current = menu_sibling;
      } else {
        linked_popover_menu.current = null;
      }
    }, 10);
  }

  // initialization
  React.useEffect(() => {
    // basics
    const button_el = button.current!;

    // handle external request to close tooltip
    function external_tooltip_close(): void {
      set_tooltip_visible(false);
    }
    button_el.addEventListener("_Tooltip_close", external_tooltip_close);

    // cleanup
    return () => {
      button_el.removeEventListener("_Tooltip_close", external_tooltip_close);
    };
  }, []);

  // sync tooltip and detect linked menu
  React.useEffect(() => {
    tooltip_place_ref.current = getTooltipPlacement(params.tooltip ?? "");
    // detect linked menu
    detect_linked_menu();
  }, [params.tooltip ?? ""]);

  // sync pointer over handler
  React.useEffect(() => {
    userPointerEnter.current = params.pointerEnter;
  }, [params.pointerEnter]);

  // sync pointer out handler
  React.useEffect(() => {
    userPointerLeave.current = params.pointerLeave;
  }, [params.pointerLeave]);

  const Button = Button_comp!;

  return (
    <>
      <Button
        ref={obj => {
          button.current = obj;
          if (typeof params.ref == "function") {
            params.ref(obj);
          } else if (params.ref) {
            params.ref!.current = obj;
          }
        }}
        id={params.id}
        className={["Button", ...(params.className ?? "").split(" ").filter(c => c != "")].join(" ")}
        style={newStyle}
        type={params.type ?? "button"}
        disabled={params.disabled ?? false}
        autoFocus={params.autoFocus ?? false}
        data-chosen={!!params.chosen}
        $color={color}
        $bg={bg}
        $hover_bg={hover_bg}
        $hover_color={hover_color}
        $pressed_color={pressed_color}
        $theme={theme}
        $rtl={rtl}
        onFocus={params.focus}
        onClick={params.click}
        onMouseOver={params.mouseOver}
        onMouseOut={params.mouseOut}
        onMouseUp={params.mouseUp}
        onContextMenu={params.contextMenu}
        onGotPointerCapture={params.gotPointerCapture}
        onLostPointerCapture={params.lostPointerCapture}
        onPointerCancel={params.pointerCancel}
        onPointerDown={params.pointerDown}
        onPointerEnter={pointerEnter as any}
        onPointerLeave={pointerLeave as any}
        onPointerMove={params.pointerMove}
        onPointerOut={params.pointerOut}
        onPointerOver={params.pointerOver}
        onPointerUp={params.pointerUp}
        onTouchStart={params.touchStart}
        onTouchEnd={params.touchEnd}
        onTouchMove={params.touchMove}
        onTouchCancel={params.touchCancel}
      >
        {params.children}
      </Button>
      {tooltip === undefined ? undefined : (
        <TooltipDiv
          ref={tooltip_el}
          $theme={theme}
          $tooltip_visible={tooltip_visible}
          $tooltip_x={tooltip_x}
          $tooltip_y={tooltip_y}
          $rtl={rtl}>
          {skipTooltipPlacement(tooltip)}
        </TooltipDiv>
      )}
    </>
  );
}

export type ButtonVariant =
  | "none"
  | "big"
  | "anchor"
  | "primary"
  | "secondary"
  | "danger"
  | "transparent";

export type ButtonType = "button" | "reset" | "submit";

export type ButtonParams = {
  variant?: ButtonVariant;
  
  outline?: boolean;

  chosen?: boolean;

  type?: ButtonType;

  disabled?: boolean;

  autoFocus?: boolean;

  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;

  /**
   * Tooltip text.
   *
   * To indicate placement side, add one of the following prefixes:
   * 
   * - `<?top?>`
   * - `<?bottom?>`
   * - `<?left?>`
   * - `<?right?>`
   */
  tooltip?: string;

  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
  id?: string;
  ref?: React.Ref<HTMLButtonElement | null>;

  focus?: React.FocusEventHandler<HTMLButtonElement>;
  click?: React.MouseEventHandler<HTMLButtonElement>;
  contextMenu?: React.MouseEventHandler<HTMLButtonElement>;
  mouseOver?: React.MouseEventHandler<HTMLButtonElement>;
  mouseOut?: React.MouseEventHandler<HTMLButtonElement>;
  mouseUp?: React.MouseEventHandler<HTMLButtonElement>;

  gotPointerCapture?: React.PointerEventHandler<HTMLButtonElement>;
  lostPointerCapture?: React.PointerEventHandler<HTMLButtonElement>;
  pointerCancel?: React.PointerEventHandler<HTMLButtonElement>;
  pointerDown?: React.PointerEventHandler<HTMLButtonElement>;
  pointerEnter?: React.PointerEventHandler<HTMLButtonElement>;
  pointerLeave?: React.PointerEventHandler<HTMLButtonElement>;
  pointerMove?: React.PointerEventHandler<HTMLButtonElement>;
  pointerOut?: React.PointerEventHandler<HTMLButtonElement>;
  pointerOver?: React.PointerEventHandler<HTMLButtonElement>;
  pointerUp?: React.PointerEventHandler<HTMLButtonElement>;

  touchStart?: React.TouchEventHandler<HTMLButtonElement>;
  touchEnd?: React.TouchEventHandler<HTMLButtonElement>;
  touchMove?: React.TouchEventHandler<HTMLButtonElement>;
  touchCancel?: React.TouchEventHandler<HTMLButtonElement>;
};

type ButtonCSSProps = {
  $color: Color | string;
  $bg: string;
  $hover_bg: string;
  $hover_color: string;
  $pressed_color: string;
  $theme: Theme;
  $rtl: boolean;
};

// none

const NoneButton = styled.button<ButtonCSSProps>`
  && {
    background: none;
    color: ${($) => $.$color as string};
    padding: 0.6rem 1rem;
    border: none;
    border-radius: 0;
  }

  &&:hover:not(:disabled) {
    background: ${($) => $.$hover_bg};
  }

  &&:active:not(:disabled) {
    scale: 0.97;
  }

  &&[data-chosen="true"]:not(:disabled) {
    background: ${($) => $.$theme.colors.primary};
    color: ${($) => $.$theme.colors.primaryForeground};
  }

  &&:focus:not(:disabled) {
    outline: 0.05rem dotted ${($) => $.$color as string};
    outline-offset: -0.4rem;
  }

  &&:disabled {
    opacity: 0.6;
  }
`;

// big

const BigButton = styled.button<ButtonCSSProps>`
  && {
    background: none;
    color: ${($) => $.$color as string};
    padding: 0.3rem 0.6rem;
    border: none;
    border-radius: 0;
    font-size: 1.8rem;
    font-weight: lighter;
  }

  &&:hover:not(:disabled) {
    background: ${($) => $.$hover_bg};
  }

  &&:active:not(:disabled) {
    transform: scale(0.97);
  }

  &&[data-chosen="true"]:not(:disabled) {
    background: ${($) => $.$theme.colors.primary};
    color: ${($) => $.$theme.colors.primaryForeground};
  }

  &&:focus:not(:disabled) {
    outline: 0.05rem dotted ${($) => $.$color as string};
    outline-offset: -0.4rem;
  }

  &&:disabled {
    opacity: 0.6;
  }
`;

// anchor

const AnchorButton = styled.button<ButtonCSSProps>`
  && {
    background: none;
    color: ${($) => $.$color as string};
    padding: 0.6rem 1rem;
    border: none;
    border-radius: 0;
  }

  &&:hover:not(:disabled) {
    color: ${($) => $.$hover_color};
  }

  &&:active:not(:disabled) {
    color: ${($) => $.$hover_color};
  }

  &&:focus:not(:disabled) {
    outline: 0.05rem dotted ${($) => $.$theme.colors.focusDashes};
    outline-offset: -0.4rem;
  }

  &&:disabled {
    opacity: 0.6;
  }
`;

// secondary

const SecondaryButton = styled.button<ButtonCSSProps>`
  && {
    background: ${($) => $.$theme.colors.secondary};
    color: ${($) => $.$theme.colors.foreground};
    padding: 0.6rem 1rem;
    border: none;
    border-radius: 0;
  }

  &&:hover:not(:disabled) {
    background: ${($) => $.$hover_bg};
  }

  &&:active:not(:disabled) {
    background: ${($) => $.$theme.colors.pressed};
    color: ${($) => $.$theme.colors.pressedForeground};
  }

  &&:focus:not(:disabled) {
    outline: 0.05rem dotted ${($) => $.$theme.colors.focusDashes};
    outline-offset: -0.4rem;
  }

  &&:disabled {
    opacity: 0.6;
  }
`;

// primary

const PrimaryButton = styled.button<ButtonCSSProps>`
  && {
    background: ${($) => $.$theme.colors.primary};
    color: ${($) => $.$theme.colors.primaryForeground};
    padding: 0.6rem 1rem;
    border: none;
    border-radius: 0;
  }

  &&:hover:not(:disabled) {
    background: ${($) => $.$hover_bg};
  }

  &&:active:not(:disabled) {
    background: ${($) => $.$theme.colors.pressed};
    color: ${($) => $.$theme.colors.pressedForeground};
  }

  &&:focus:not(:disabled) {
    outline: 0.05rem dotted ${($) => $.$theme.colors.focusDashes};
    outline-offset: -0.4rem;
  }

  &&:disabled {
    opacity: 0.6;
  }
`;

// danger

const DangerButton = styled.button<ButtonCSSProps>`
  && {
    background: ${($) => $.$theme.colors.danger};
    color: ${($) => $.$theme.colors.dangerForeground};
    padding: 0.6rem 1rem;
    border: none;
    border-radius: 0;
  }

  &&:hover:not(:disabled) {
    background: ${($) => $.$hover_bg};
  }

  &&:active:not(:disabled) {
    background: ${($) => $.$theme.colors.pressed};
    color: ${($) => $.$theme.colors.pressedForeground};
  }

  &&:focus:not(:disabled) {
    outline: 0.05rem dotted ${($) => $.$theme.colors.focusDashes};
    outline-offset: -0.4rem;
  }

  &&:disabled {
    opacity: 0.6;
  }
`;

// outline

const OutlineButton = styled.button<ButtonCSSProps>`
  && {
    background: none;
    color: ${($) => $.$color as string};
    padding: 0.6rem 1rem;
    border: 0.15rem solid ${($) => $.$color as string};
    border-radius: 0;
  }

  &&:hover:not(:disabled) {
    background: ${($) => $.$hover_bg};
  }

  &&:active:not(:disabled) {
    background: ${($) => $.$color as string};
    color: ${($) => $.$pressed_color};
  }

  &&:focus:not(:disabled) {
    outline: 0.05rem dotted ${($) => $.$color as string};
    outline-offset: -0.4rem;
  }

  &&:disabled {
    opacity: 0.6;
  }
`;

// outline primary

const OutlinePrimaryButton = styled.button<ButtonCSSProps>`
  && {
    background: ${($) => $.$bg};
    color: ${($) => $.$color as string};
    padding: 0.6rem 1rem;
    border: 0.15rem solid ${($) => $.$color as string};
    border-radius: 0;
  }

  &&:hover:not(:disabled) {
    background: ${($) => $.$hover_bg};
  }

  &&:active:not(:disabled) {
    background: ${($) => $.$color as string};
    color: ${($) => $.$pressed_color};
  }

  &&:focus:not(:disabled) {
    outline: 0.05rem dotted ${($) => $.$color as string};
    outline-offset: -0.4rem;
  }

  &&:disabled {
    opacity: 0.6;
  }
`;

// transparent

const TransparentButton = styled.button<ButtonCSSProps>`
  && {
    background: ${($) => Color($.$theme.colors.foreground).alpha(0.4).toString()};
    color: ${($) => $.$theme.colors.foreground};
    padding: 0.6rem 1rem;
    border: none;
    border-radius: 0;
  }

  &&:hover:not(:disabled) {
    background: ${($) => Color($.$theme.colors.foreground).alpha(0.59).toString()};
  }

  &&:active:not(:disabled) {
    background: ${($) => Color($.$theme.colors.foreground).alpha(0.69).toString()};
    color: ${($) => $.$theme.colors.foreground};
    scale: 0.97;
  }

  &&:focus:not(:disabled) {
    outline: 0.05rem dotted ${($) => $.$theme.colors.foreground};
    outline-offset: -0.4rem;
  }

  &&:disabled {
    opacity: 0.6;
  }
`;

const TooltipDiv = styled.div<{
  $theme: Theme;
  $tooltip_visible: boolean;
  $tooltip_x: number;
  $tooltip_y: number;
  $rtl: boolean;
}>`
  && {
    background: ${($) => $.$theme.colors.inputBackground};
    border: 0.15rem solid ${($) => $.$theme.colors.inputBorder};
    color: ${$ => $.$theme.colors.foreground};
    display: inline-block;
    visibility: ${($) => ($.$tooltip_visible ? "visible" : "hidden")};
    overflow-wrap: anywhere;
    position: fixed;
    left: ${($) => $.$tooltip_x}px;
    top: ${($) => $.$tooltip_y}px;
    padding: 0.4rem;
    font-size: 0.77rem;
    z-index: ${MAXIMUM_Z_INDEX};
    ${$ => $.$rtl ? "text-align: right;" : ""}
  }
`;

/**
 * Represents a circle button containing an icon.
 */
export function CircleButton(params: CircleButtonParams) {
  // bindings
  const button = React.useRef<null | HTMLButtonElement>(null);

  // ?theme
  const theme = React.useContext(ThemeContext);

  // ?rtl
  const rtl = React.useContext(RTLContext);

  // linked popover menu (next-sibling) if any
  const linked_popover_menu = React.useRef<null | HTMLElement>(null);

  // inline styles
  const iconStyle: React.CSSProperties = {};

  // misc
  const fg = Color(theme.colors.foreground).isDark() ? "#000" : "#fff";
  const normal_color = params.filled
    ? Color(fg).isDark()
      ? "#fff"
      : "#000"
    : fg;
  const hover_color = fg;
  const active_color = params.filled
    ? fg
    : Color(fg).isDark()
      ? "#fff"
      : "#000";
  const size = params.size ?? 45;
  const size_rf = REMConvert.pixels.remPlusUnit(size);

  const tooltip = params.tooltip;
  const tooltip_place_ref = React.useRef<SimplePlacementType>("bottom");
  const [tooltip_visible, set_tooltip_visible] = React.useState<boolean>(false);
  const [tooltip_x, set_tooltip_x] = React.useState<number>(0);
  const [tooltip_y, set_tooltip_y] = React.useState<number>(0);
  const tooltip_el: React.RefObject<HTMLDivElement | null> = React.useRef(null);
  let tooltip_timeout = -1;
  const hovering = React.useRef<boolean>(false);

  // display tooltip
  const userPointerEnter = React.useRef<undefined | React.PointerEventHandler<HTMLButtonElement>>(undefined);
  const pointerEnter = async (e: PointerEvent) => {
    hovering.current = true;
    if (tooltip_el.current) {
      const button = e.currentTarget as HTMLButtonElement;
      tooltip_timeout = window.setTimeout(() => {
        // do not open tooltip if linked PopoverMenu is open.
        if (linked_popover_menu.current?.getAttribute("data-open") == "true") {
          return;
        }

        if (hovering.current) {
          set_tooltip_visible(true);
        }
      }, 700);

      // Adjust tooltip position
      window.setTimeout(() => {
        // do not open tooltip if linked PopoverMenu is open.
        if (linked_popover_menu.current?.getAttribute("data-open") == "true") {
          return;
        }

        (async() => {
          let prev_display = tooltip_el.current!.style.display;
          if (prev_display === "none") tooltip_el.current!.style.display = "inline-block";
          const r = await computePosition(button, tooltip_el.current!, {
            placement: (tooltip_place_ref.current + "-start") as any,
            middleware: [ offset(7), flip(), shift() ],
          });
          tooltip_el.current!.style.display = prev_display;
          set_tooltip_x(r.x);
          set_tooltip_y(r.y);
        })();
      }, 10);
    }

    return userPointerEnter.current?.(e as any);
  };

  // hide tooltip
  const userPointerLeave = React.useRef<undefined | React.PointerEventHandler<HTMLButtonElement>>(undefined);
  const pointerLeave = (e: PointerEvent): any => {
    hovering.current = false;
    if (tooltip_timeout !== -1) {
      window.clearTimeout(tooltip_timeout);
      tooltip_timeout = -1;
    }
    set_tooltip_visible(false);
    return userPointerLeave.current?.(e as any);
  };

  // detect linked PopoverMenu
  function detect_linked_menu(): void {
    // basics
    const button_el = button.current!;
    let menu_sibling = (button_el.nextElementSibling ?? null) as null | HTMLElement;

    if (!!menu_sibling && !!tooltip_el.current) {
      menu_sibling = (menu_sibling.nextElementSibling ?? null) as null | HTMLElement;
    }

    // delayed detection
    window.setTimeout(() => {
      if (menu_sibling?.classList.contains("PopoverMenu")) {
        linked_popover_menu.current = menu_sibling;
      } else {
        linked_popover_menu.current = null;
      }
    }, 10);
  }

  // initialization
  React.useEffect(() => {
    // basics
    const button_el = button.current!;

    // handle external request to close tooltip
    function external_tooltip_close(): void {
      set_tooltip_visible(false);
    }
    button_el.addEventListener("_Tooltip_close", external_tooltip_close);

    // cleanup
    return () => {
      button_el.removeEventListener("_Tooltip_close", external_tooltip_close);
    };
  }, []);

  // sync tooltip and detect linked menu
  React.useEffect(() => {
    tooltip_place_ref.current = getTooltipPlacement(params.tooltip ?? "");
    // detect linked menu
    detect_linked_menu();
  }, [params.tooltip ?? ""]);

  // sync pointer over handler
  React.useEffect(() => {
    userPointerEnter.current = params.pointerEnter;
  }, [params.pointerEnter]);

  // sync pointer out handler
  React.useEffect(() => {
    userPointerLeave.current = params.pointerLeave;
  }, [params.pointerLeave]);

  return (
    <>
      <CircleButtonButton
        ref={obj => {
          button.current = obj;
          if (typeof params.ref == "function") {
            params.ref(obj);
          } else if (params.ref) {
            params.ref!.current = obj;
          }
        }}
        id={params.id}
        className={["Button", ...(params.className ?? "").split(" ").filter(c => c != "")].join(" ")}
        type={params.type ?? "button"}
        disabled={params.disabled}
        autoFocus={params.autoFocus}
        style={params.style}
        $normal_color={normal_color}
        $hover_color={hover_color}
        $active_color={active_color}
        $fg={fg}
        $theme={theme}
        $filled={!!params.filled}
        $size_rf={size_rf}
        onFocus={params.focus}
        onClick={params.click}
        onMouseOver={params.mouseOver}
        onMouseOut={params.mouseOut}
        onMouseUp={params.mouseUp}
        onContextMenu={params.contextMenu}
        onGotPointerCapture={params.gotPointerCapture}
        onLostPointerCapture={params.lostPointerCapture}
        onPointerCancel={params.pointerCancel}
        onPointerDown={params.pointerDown}
        onPointerEnter={pointerEnter as any}
        onPointerLeave={pointerLeave as any}
        onPointerMove={params.pointerMove}
        onPointerOut={params.pointerOut}
        onPointerOver={params.pointerOver}
        onPointerUp={params.pointerUp}
        onTouchStart={params.touchStart}
        onTouchEnd={params.touchEnd}
        onTouchMove={params.touchMove}
        onTouchCancel={params.touchCancel}
      >
        <Icon
          type={params.icon ?? params.native}
          size={size - (size <= 16 ? 0 : 16)}
          style={iconStyle}
        />
      </CircleButtonButton>

      {tooltip === undefined ? undefined : (
        <TooltipDiv
          ref={tooltip_el}
          $theme={theme}
          $tooltip_visible={tooltip_visible}
          $tooltip_x={tooltip_x}
          $tooltip_y={tooltip_y}
          $rtl={rtl}>
          {skipTooltipPlacement(tooltip)}
        </TooltipDiv>
      )}
    </>
  );
}

export type CircleButtonParams = {
  icon?: string;

  /**
   * Native icon.
   */
  native?: NativeIcon;

  /**
   * Button type.
   */
  type?: ButtonType;

  /**
   * Whether the icon is initially filled or not.
   */
  filled?: boolean;

  /**
   * Tooltip text.
   *
   * To indicate placement side, add one of the following prefixes:
   * 
   * - `<?top?>`
   * - `<?bottom?>`
   * - `<?left?>`
   * - `<?right?>`
   */
  tooltip?: string;

  size?: number;
  disabled?: boolean;
  autoFocus?: boolean;

  style?: React.CSSProperties;
  id?: string;
  className?: string;
  ref?: React.Ref<HTMLButtonElement | null>;

  contextMenu?: React.MouseEventHandler<HTMLButtonElement>;
  focus?: React.FocusEventHandler<HTMLButtonElement>;
  click?: React.MouseEventHandler<HTMLButtonElement>;
  mouseOver?: React.MouseEventHandler<HTMLButtonElement>;
  mouseOut?: React.MouseEventHandler<HTMLButtonElement>;
  mouseUp?: React.MouseEventHandler<HTMLButtonElement>;

  gotPointerCapture?: React.PointerEventHandler<HTMLButtonElement>;
  lostPointerCapture?: React.PointerEventHandler<HTMLButtonElement>;
  pointerCancel?: React.PointerEventHandler<HTMLButtonElement>;
  pointerDown?: React.PointerEventHandler<HTMLButtonElement>;
  pointerEnter?: React.PointerEventHandler<HTMLButtonElement>;
  pointerLeave?: React.PointerEventHandler<HTMLButtonElement>;
  pointerMove?: React.PointerEventHandler<HTMLButtonElement>;
  pointerOut?: React.PointerEventHandler<HTMLButtonElement>;
  pointerOver?: React.PointerEventHandler<HTMLButtonElement>;
  pointerUp?: React.PointerEventHandler<HTMLButtonElement>;

  touchStart?: React.TouchEventHandler<HTMLButtonElement>;
  touchEnd?: React.TouchEventHandler<HTMLButtonElement>;
  touchMove?: React.TouchEventHandler<HTMLButtonElement>;
  touchCancel?: React.TouchEventHandler<HTMLButtonElement>;
};

const CircleButtonButton = styled.button<{
  $normal_color: string;
  $hover_color: string;
  $active_color: string;
  $fg: string;
  $theme: Theme;
  $filled: boolean;
  $size_rf: string;
}>`
  && {
    border: 0.2rem solid ${($) => $.$fg};
    border-radius: 100%;
    outline: none;
    color: ${($) => $.$normal_color};
    ${($) => ($.$filled ? `background: ${$.$fg};` : "background: none;")}
    width: ${($) => $.$size_rf};
    height: ${($) => $.$size_rf};
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }

  &&:hover:not(:disabled) {
    color: ${($) => $.$hover_color};
    background: ${($) => Color($.$fg).alpha(0.3).toString()};
  }

  &&:focus:not(:disabled) {
    outline: 0.05rem dotted ${($) => $.$theme.colors.focusDashes};
    outline-offset: -0.4rem;
  }

  &&:active:not(:disabled) {
    outline: none;
    color: ${($) => $.$active_color};
    ${($) =>
      $.$filled
        ? `background: ${Color($.$fg).alpha(0.5).toString()};`
        : `background: ${$.$fg};`}
  }

  &&:disabled {
    opacity: 0.6;
  }
`;

/**
 * Represents an arrow button.
 */
export function ArrowButton(params: ArrowButtonParams) {
  // Direction
  const d = params.direction;

  return (
    <CircleButton
      native={
        d == "left" ? "fullArrowLeft" :
        d == "right" ? "fullArrowRight" :
        d == "up" ? "fullArrowUp" : "fullArrowDown"
      }
      ref={params.ref}
      id={params.id}
      className={params.className}
      disabled={params.disabled ?? false}
      type={params.type}
      autoFocus={params.autoFocus ?? false}
      style={params.style}
      size={params.size}
      tooltip={params.tooltip}
      focus={params.focus}
      click={params.click}
      mouseOver={params.mouseOver}
      mouseOut={params.mouseOut}
      mouseUp={params.mouseUp}
      contextMenu={params.contextMenu}
      gotPointerCapture={params.gotPointerCapture}
      lostPointerCapture={params.lostPointerCapture}
      pointerCancel={params.pointerCancel}
      pointerDown={params.pointerDown}
      pointerEnter={params.pointerEnter}
      pointerLeave={params.pointerLeave}
      pointerMove={params.pointerMove}
      pointerOut={params.pointerOut}
      pointerOver={params.pointerOver}
      pointerUp={params.pointerUp}
      touchStart={params.touchStart}
      touchEnd={params.touchEnd}
      touchMove={params.touchMove}
      touchCancel={params.touchCancel}
    />
  );
}

export type ArrowButtonParams = {
  direction: ArrowButtonDirection;
  size?: number;
  type?: ButtonType;
  /**
   * Tooltip text.
   *
   * To indicate placement side, add one of the following prefixes:
   * 
   * - `<?top?>`
   * - `<?bottom?>`
   * - `<?left?>`
   * - `<?right?>`
   */
  tooltip?: string;
  disabled?: boolean;
  autoFocus?: boolean;

  style?: React.CSSProperties;
  id?: string;
  className?: string;
  ref?: React.Ref<HTMLButtonElement | null>;

  contextMenu?: React.MouseEventHandler<HTMLButtonElement>;
  focus?: React.FocusEventHandler<HTMLButtonElement>;
  click?: React.MouseEventHandler<HTMLButtonElement>;
  mouseOver?: React.MouseEventHandler<HTMLButtonElement>;
  mouseOut?: React.MouseEventHandler<HTMLButtonElement>;
  mouseUp?: React.MouseEventHandler<HTMLButtonElement>;

  gotPointerCapture?: React.PointerEventHandler<HTMLButtonElement>;
  lostPointerCapture?: React.PointerEventHandler<HTMLButtonElement>;
  pointerCancel?: React.PointerEventHandler<HTMLButtonElement>;
  pointerDown?: React.PointerEventHandler<HTMLButtonElement>;
  pointerEnter?: React.PointerEventHandler<HTMLButtonElement>;
  pointerLeave?: React.PointerEventHandler<HTMLButtonElement>;
  pointerMove?: React.PointerEventHandler<HTMLButtonElement>;
  pointerOut?: React.PointerEventHandler<HTMLButtonElement>;
  pointerOver?: React.PointerEventHandler<HTMLButtonElement>;
  pointerUp?: React.PointerEventHandler<HTMLButtonElement>;

  touchStart?: React.TouchEventHandler<HTMLButtonElement>;
  touchEnd?: React.TouchEventHandler<HTMLButtonElement>;
  touchMove?: React.TouchEventHandler<HTMLButtonElement>;
  touchCancel?: React.TouchEventHandler<HTMLButtonElement>;
};

export type ArrowButtonDirection = "left" | "right" | "up" | "down";