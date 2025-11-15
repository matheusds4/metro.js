// third-party
import assert from "assert";
import $ from "jquery";
import React from "react";
import { styled } from "styled-components";
import { Color } from "@hydroperx/color";
import { input } from "@hydroperx/inputaction";

// local
import * as ComboBoxPlacement from "./combobox/ComboBoxPlacement";
import { ComboBoxStatic } from "./combobox/ComboBoxStatic";
import { ComboBoxEffect } from "./combobox/ComboBoxEffect";
import { RTLContext } from "../layout/RTL";
import { Icon } from "./Icon";
import { Theme, ThemeContext, PrimaryContext } from "../theme/Theme";
import * as ColorUtils from "../utils/ColorUtils";
import { focusPrevSibling, focusNextSibling } from "../utils/FocusUtils";
import * as StringUtils from "../utils/StringUtils";
import { MAXIMUM_Z_INDEX  } from "../utils/Constants";
import * as REMConvert from "../utils/REMConvert";
import { REMObserver } from "../utils/REMObserver";

/**
 * Represents an user input that opens a dropdown for
 * selecting one of multiple options.
 */
export function ComboBox(params: {
  id?: string,
  className?: string,
  children?: React.ReactNode,
  style?: React.CSSProperties,
  ref?: React.Ref<HTMLButtonElement>,

  /**
   * Default internal value matching one of the `Option`s inside.
   */
  default?: string,

  /**
   * Whether the input is disabled.
   */
  disabled?: boolean,

  /**
   * Whether the input button is light big.
   */
  big?: boolean,

  /**
   * Whether the input button is light medium.
   */
  medium?: boolean,

  /**
   * Event triggered on value change.
   */
  change?: (value: string) => void,

}): React.ReactNode {
  // bindings
  const combobox = React.useRef<null | HTMLButtonElement>(null);
  const dropdown = React.useRef<null | HTMLDivElement>(null);

  // global handlers
  const global_handlers = React.useRef<ComboBoxGlobalHandlers>({
    pointerDown: null,
    inputPressed: null,
    keyDown: null,
    wheel: null,
  });

  // handlers
  const change_handler = React.useRef<undefined | ((value: string) => void)>(undefined);

  // is open?
  const is_open = React.useRef(false);

  // scroll-indicator arrows visible?
  const [arrows_visible, set_arrows_visible] = React.useState(false);

  // value vars
  const [value_html, set_value_html] = React.useState("");
  const value_sync = React.useRef(params.default ?? "");
  const changed = React.useRef(false);

  // disabled sync
  const disabled_sync = React.useRef(params.disabled ?? false);

  // handler sync
  const change_handler_sync = React.useRef<null | ((value: string) => void)>(params.change);

  // rem
  const rem = React.useRef(16);

  // ?rtl
  const rtl = React.useContext(RTLContext);
  const rtl_sync = React.useRef(rtl);

  // ?theme
  const theme = React.useContext(ThemeContext);

  // ?primary
  const primary = React.useContext(PrimaryContext);

  // selected foreground color
  const selected_foreground_color = primary ?
    ColorUtils.enhance({ color: theme.colors.primary, background: theme.colors.inputBackground }) :
    theme.colors.foreground;

  // used for aborting the opening/closing effect
  const effect_aborter = React.useRef<AbortController | null>(null); 
  
  // typing cache
  const key_sequence_reference = React.useRef<string>("");
  const key_sequence_last_timestamp = React.useRef<number>(0);

  // initialization
  React.useEffect(() => {
    const combobox_el = combobox.current!;

    // reflection cache
    let reflect_timeout = -1;

    // handle external "_ComboBox_reflect" event
    function external_reflect(): void {
      // here, update the DOM to reflect the
      // actually selected Option.

      // the following timeout is used since there may be
      // many Options triggering reflection,
      // so this reflection will only actually
      // happen after the last Option, for performance.

      if (reflect_timeout != -1) {
        window.clearTimeout(reflect_timeout);
      }
      reflect_timeout = window.setTimeout(() => {
        reflect_timeout = -1;

        // item list div
        const item_list_div = get_item_list_div();
        const children = Array.from(item_list_div.children) as HTMLElement[];

        // set the item[data-selected] attribute
        for (const option of children) {
          option.removeAttribute("data-selected");
        }
        let selected_option =
          (children.find(e => e.getAttribute("data-value") == value_sync.current) ?? null) as null | HTMLElement;
        if (!selected_option) {
          selected_option = children.find(e => e.classList.contains("Option")) ?? null;
          if (selected_option) {
            value_sync.current = selected_option.getAttribute("data-value") ?? "";
          }
        }
        if (selected_option) {
          selected_option.setAttribute("data-selected", "true");
          set_value_html(extract_compact_html(selected_option));
        } else {
          set_value_html("");
        }
      }, 0);
    }
    combobox_el.addEventListener("_ComboBox_reflect", external_reflect);

    // observe the cascading rem
    const rem_observer = new REMObserver(value => {
      rem.current = value;
    });

    // cleanup
    return () => {
      combobox_el.removeEventListener("_ComboBox_reflect", external_reflect);

      // dispose of global handlers
      dispose_global_handlers();

      // dispose of REMObserver
      rem_observer.cleanup();
    };
  }, []);

  // sync `change` handler
  React.useEffect(() => {
    change_handler.current = params.change;
  }, [params.change]);

  // sync ?rtl
  React.useEffect(() => {
    rtl_sync.current = rtl;
  }, [rtl]);

  // check if default value has changed
  React.useEffect(() => {
    if (!changed.current) {
      value_sync.current = params.default ?? "";
      combobox.current!.dispatchEvent(new Event("_ComboBox_reflect"));
      params.change?.(value_sync.current);
    }
  }, [params.default]);
  
  // sync `change` handler
  React.useEffect(() => {
    change_handler_sync.current = params.change;
  }, [params.change]);

  // sync `disabled` parameter
  React.useEffect(() => {
    disabled_sync.current = params.disabled ?? false;
  }, [params.disabled]);

  // opens the ComboBox
  function open(): void {
    if (is_open.current || disabled_sync.current) {
      return;
    }

    // for now, don't allow aborting active effect.
    if (effect_aborter.current) {
      return;
    }

    // list div
    const item_list_div = get_item_list_div();
    const children = Array.from(item_list_div.children) as HTMLElement[];

    // find the selected entry
    let selected_option = (children.find(e => e.getAttribute("data-value") == value_sync.current) ?? null) as null | HTMLElement;

    if (!selected_option) {
      if (children.length == 0) {
        return;
      }
      selected_option = children.find(e => e.classList.contains("Option")) ?? null;
      if (selected_option) {
        value_sync.current = selected_option.getAttribute("data-value") ?? "";
      } else {
        return;
      }
    }

    // set the item[data-selected] attribute
    for (const option of children) {
      option.removeAttribute("data-selected");
    }
    selected_option.setAttribute("data-selected", "true");

    // update cooldown
    ComboBoxStatic.cooldown = Date.now();

    // register global handlers (like typing and click-outside)
    register_global_handlers();

    // mutate internal change handler
    ComboBoxStatic.change = trigger_change;

    // mutate internal close handler
    ComboBoxStatic.close = close;

    // turn visible
    is_open.current = true;
    dropdown.current!.style.visibility = "visible";

    // temporary display change
    let prev_display = dropdown.current!.style.display;
    if (prev_display == "none") {
      dropdown.current!.style.display = "inline-block";
    }

    // set up dropdown width
    dropdown.current!.style.width = combobox.current!.getBoundingClientRect().width + "px";

    // place dropdown (1)
    ComboBoxPlacement.position(combobox.current!, dropdown.current!);

    // turn scroll-indicator arrows visible or hidden
    set_arrows_visible(item_list_div.scrollHeight > item_list_div.clientHeight);

    // place dropdown (2) (after setting up the arrows)
    ComboBoxPlacement.position(combobox.current!, dropdown.current!);

    // restore display
    dropdown.current!.style.display = prev_display;

    // scroll
    ComboBoxPlacement.scrollDropdownAlignSelected(combobox.current!, item_list_div);

    // run effect
    effect_aborter.current = new ComboBoxEffect(combobox.current!, item_list_div)
      .open(() => {
        effect_aborter.current = null;

        // focus selected option
        selected_option?.focus();
      });
  }

  // trigger value change.
  function trigger_change(new_value: string): void {
    // set value
    value_sync.current = new_value;
    changed.current = true;

    // reflect selected option
    combobox.current!.dispatchEvent(new Event("_ComboBox_reflect"));

    // emit `change`
    change_handler_sync.current?.(new_value);
  }

  // closes the ComboBox
  function close(): void {
    if (!is_open.current || disabled_sync.current) {
      return;
    }

    // for now, don't allow aborting active effect.
    if (effect_aborter.current) {
      return;
    }

    // dispose of global handlers (like typing and click-outside)
    dispose_global_handlers();

    // unassign internal change handler
    ComboBoxStatic.change = null;

    // unassign internal close handler
    ComboBoxStatic.close = null;

    // run effect
    effect_aborter.current = new ComboBoxEffect(combobox.current!, get_item_list_div())
      .close(() => {
        // remember as closed
        is_open.current = false;

        // forget AbortController
        effect_aborter.current = null;

        // focus ComboBox
        combobox.current!.focus();
      });
  }

  // returns the HTML of an element stripping Icons off.
  function extract_compact_html(element: HTMLElement): string {
    const n = element.cloneNode(true) as HTMLElement;
    for (const icon of n.getElementsByClassName("Icon")) {
      icon.remove();
    }
    return n.innerHTML.trim();
  }

  // register global event handlers used by the ComboBox.
  function register_global_handlers(): void {
    dispose_global_handlers();

    // handle pointer down anywhere the viewport
    global_handlers.current.pointerDown = global_pointer_down;
    window.addEventListener("pointerdown", global_handlers.current.pointerDown as any);

    // handle input pressed
    global_handlers.current.inputPressed = input_pressed;
    input.on("inputPressed", global_handlers.current.inputPressed as any);

    // handle key down
    global_handlers.current.keyDown = key_down;
    window.addEventListener("keydown", global_handlers.current.keyDown as any);

    // handle wheel
    global_handlers.current.wheel = global_wheel;
    window.addEventListener("wheel", global_handlers.current.wheel as any, { passive: false });
  }

  // handle pointer down on the viewport
  function global_pointer_down(e: PointerEvent): void {
    // detect click outside, closing the ComboBox.

    if (!is_open.current) {
      return;
    }

    const rect = dropdown.current!.getBoundingClientRect();
    if (e.clientX >= rect.x && e.clientY >= rect.y && e.clientX < rect.x + rect.width && e.clientY < rect.y + rect.height) {
      return;
    }

    close();
  }

  // handle arrows and escape
  function input_pressed(e: Event): void {
    // basics
    const item_list_div = get_item_list_div();

    // handle escape
    if (input.justPressed("escape")) {
      close();
      return;
    }

    for (let i = 0; i < item_list_div.children.length; i++) {
      // child Option
      const item = item_list_div.children[i] as HTMLElement;

      // if focused
      if (document.activeElement === item) {
        // track timestamp of last button pressed
        combobox.current!.setAttribute("data-last-button", Date.now().toString(35));

        // navigate up
        if (input.justPressed("navigateUp")) {
          e.preventDefault();
          focusPrevSibling(item);
        // navigate down
        } else if (input.justPressed("navigateDown")) {
          e.preventDefault();
          focusNextSibling(item);
        }

        return;
      }
    }

    // if there is no Option focused, handle arrows
    // just a little bit differently.

    // track timestamp of last button pressed
    combobox.current!.setAttribute("data-last-button", Date.now().toString(35));

    // focus last
    if (input.justPressed("navigateUp")) {
      const first = item_list_div.firstElementChild;
      if (first) {
        e.preventDefault();
        focusPrevSibling(first as HTMLElement);
      }
    // focus first
    } else if (input.justPressed("navigateDown")) {
      const last = item_list_div.lastElementChild;
      if (last) {
        e.preventDefault();
        focusNextSibling(last as HTMLElement);
      }
    }
  }

  // handle typing
  function key_down(e: KeyboardEvent): void {
    if (e.key == " ") {
      e.preventDefault();
    }
    if (String.fromCodePoint(e.key.toLowerCase().codePointAt(0) ?? 0) != e.key.toLowerCase()) {
      key_sequence_last_timestamp.current = 0;
      return;
    }

    // track timestamp of last button pressed
    combobox.current!.setAttribute("data-last-button", Date.now().toString(35));

    if (Date.now() < key_sequence_last_timestamp.current + 700) {
      // continue key sequence
      key_sequence_reference.current += e.key.toLowerCase();
    } else {
      // start new key sequence
      key_sequence_reference.current = e.key.toLowerCase();
    }
    let key_seq = key_sequence_reference.current;
    const rtl = rtl_sync.current;
    if (rtl) {
      key_seq = StringUtils.reverse(key_seq);
    }
    for (const item of Array.from(get_item_list_div().children) as HTMLElement[]) {
      if (!item.classList.contains("Option")) {
        continue;
      }
      const item_text = item.innerText.trim().toLowerCase();
      if (rtl ? item_text.endsWith(key_seq) : item_text.startsWith(key_seq)) {
        item.focus();
        break;
      }
    }
    key_sequence_last_timestamp.current = Date.now();
  }

  // prevent scrolling outside while ComboBox is open,
  // but still allow scrolling inside the ComboBox.
  function global_wheel(e: WheelEvent): void {
    if (!is_open.current) {
      return;
    }

    const rect = dropdown.current!.getBoundingClientRect();
    if (e.clientX >= rect.x && e.clientY >= rect.y && e.clientX < rect.x + rect.width && e.clientY < rect.y + rect.height) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
  }

  // unregister global event handlers used by the ComboBox.
  function dispose_global_handlers(): void {
    if (global_handlers.current.pointerDown) {
      window.removeEventListener("pointerdown", global_handlers.current.pointerDown as any);
    }
    if (global_handlers.current.inputPressed) {
      input.off("inputPressed", global_handlers.current.inputPressed as any);
    }
    if (global_handlers.current.keyDown) {
      window.removeEventListener("keydown", global_handlers.current.keyDown as any);
    }
    if (global_handlers.current.wheel) {
      window.removeEventListener("wheel", global_handlers.current.wheel as any);
    }
  }

  // returns the div directly containing the Options.
  function get_item_list_div(): HTMLDivElement {
    return dropdown.current!.children[1] as HTMLDivElement;
  }

  return (
    <>
      <ComboBoxButton
        id={params.id}
        className={[
          "ComboBox",
          ...(rtl ? ["rtl"] : []),
          ...(params.big ? ["ComboBox-big"] : []),
          ...(params.medium ? ["ComboBox-medium"] : []),
          ...(params.className ?? "").split(" ").filter(c => c != "")
        ].join(" ")}
        style={params.style}
        ref={val => {
          combobox.current = val;
          if (typeof params.ref == "function") {
            params.ref(val);
          } else if (params.ref) {
            params.ref.current = val;
          }
        }}
        disabled={params.disabled}
        onClick={open}
        $background={theme.colors.inputBackground}
        $background_behind={theme.colors.background}
        $border={theme.colors.inputBorder}
        $foreground={selected_foreground_color}>

        <div
          className="ComboBox-button-inner"
          dangerouslySetInnerHTML={{ __html: value_html }}>
        </div>

        <div className="ComboBox-button-arrow">
          <Icon native="arrowDown" size={params.big ? 20 : params.medium ? 18 : 16}/>
        </div>
      </ComboBoxButton>
      <ComboBoxDropdown
        ref={dropdown}
        className={[
          ...(params.big ? ["ComboBox-big"] : []),
          ...(params.medium ? ["ComboBox-medium"] : []),
          ...[arrows_visible ? ["arrows-visible"] : []],
          ...[rtl ? ["rtl"] : []],
        ].join(" ")}
        $option_background={theme.colors.inputBackground}
        $option_foreground={theme.colors.foreground}
        $option_border={theme.colors.inputBorder}
        $selected_foreground_color={selected_foreground_color}>

        <div className="ComboBox-up-arrow">
          <Icon native="arrowUp" size={7.5}/>
        </div>
        <div className="ComboBox-list">{params.children}</div>
        <div className="ComboBox-down-arrow">
          <Icon native="arrowDown" size={7.5}/>
        </div>
      </ComboBoxDropdown>
    </>
  );
}

// style sheet
const ComboBoxButton = styled.button<{
  $background: string,
  $background_behind: string,
  $border: string,
  $foreground: string,
}> `
  && {
    background: ${$ => $.$background};
    border: 0.15rem solid ${$ => ColorUtils.alphaZeroIfFar({ background: $.$background_behind, color: $.$border })};
    color: ${$ => $.$foreground};
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: ${REMConvert.pixels.rem(6) + 0.15}rem 0.7rem;
    min-width: 7rem;
    outline: none;
  }
  &&.rtl {
    flex-direction: row-reverse;
  }
  &&:hover:not(:disabled),
  &&:focus:not(:disabled) {
    background: ${$ => ColorUtils.contrast($.$background, 0.4)};
  }
  &&:active:not(:disabled) {
    background: ${$ => ColorUtils.contrast($.$background, 0.6)};
  }
  &&:disabled {
    opacity: 0.5;
  }

  &&.ComboBox-big,
  &&.ComboBox-medium {
    background: none;
    border: none;
    font-weight: lighter;
    padding: ${REMConvert.pixels.rem(6)}rem 0.7rem;
    opacity: 0.7;
  }

  &&.ComboBox-big {
    font-size: 4.5rem;
  }
  &&.ComboBox-medium {
    font-size: 3.2rem;
  }

  &&.ComboBox-big:hover:not(:disabled),
  &&.ComboBox-big:focus:not(:disabled),
  &&.ComboBox-big:active:not(:disabled),
  &&.ComboBox-medium:hover:not(:disabled),
  &&.ComboBox-medium:focus:not(:disabled),
  &&.ComboBox-medium:active:not(:disabled) {
    background: none;
    opacity: 1;
  }
  &&.ComboBox-big:disabled,
  &&.ComboBox-medium:disabled {
    opacity: 0.4;
  }

  && .ComboBox-button-inner {
    display: inline-flex;
    flex-direction: row;
    flex-grow: 2;
    gap: 0.9rem;
  }
  &&.ComboBox-big .ComboBox-button-inner,
  &&.ComboBox-medium .ComboBox-button-inner {
    flex-grow: unset;
  }
  &&.rtl .ComboBox-button-inner {
    flex-direction: row-reverse;
  }

  && .ComboBox-button-arrow {
    display: inline-flex;
    flex-direction: row;
    opacity: 0.7;
  }
  &&.rtl .ComboBox-button-arrow {
    flex-direction: row-reverse;
  }
`;

// style sheet for the dropdown (sibling of the ComboBox button)
const ComboBoxDropdown = styled.div<{
  $option_background: string,
  $option_foreground: string,
  $option_border: string,
  $selected_foreground_color: string,
}> `
  && {
    display: inline-flex;
    visibility: hidden;
    flex-direction: column;
    position: fixed;
    z-index: ${MAXIMUM_Z_INDEX};
  }

  &&:not(.running-effect) {
    background: ${$ => $.$option_background};
    border: 0.15rem solid ${$ => $.$option_border};
  }

  &&.ComboBox-big:not(.running-effect),
  &&.ComboBox-medium:not(.running-effect) {
    border: 0.3rem solid ${$ => $.$option_border};
  }

  && .ComboBox-list {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    scrollbar-width: none;
    flex-grow:3;
  }

  && .ComboBox-up-arrow,
  && .ComboBox-down-arrow {
    color: ${$ => $.$option_foreground};
    display: none;
  }

  &&.arrows-visible .ComboBox-up-arrow,
  &&.arrows-visible .ComboBox-down-arrow {
    display: flex;
    flex-direction: row;
    justify-content: center;
    height: ${REMConvert.pixels.remPlusUnit(7.5)};
  }

  && .ComboBox-list > .Option {
    display: inline-flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.9rem;
    padding: ${REMConvert.pixels.rem(6) + 0.15}rem 0.7rem;
    background: ${$ => $.$option_background};
    border: none;
    outline: none;
    color: ${$ => $.$option_foreground};
    font-size: inherit;
  }
  &&.rtl .ComboBox-list > .Option {
    flex-direction: row-reverse;
  }
  &&.ComboBox-big .ComboBox-list > .Option,
  &&.ComboBox-medium .ComboBox-list > .Option {
    font-size: 1.5rem;
    font-weight: lighter;
  }
  &&.running-effect .ComboBox-list > .Option {
    border-left: 0.15rem solid ${$ => $.$option_border};
    border-right: 0.15rem solid ${$ => $.$option_border};
  }
  &&.ComboBox-big.running-effect .ComboBox-list > .Option,
  &&.ComboBox-medium.running-effect .ComboBox-list > .Option {
    border-left: 0.3rem solid ${$ => $.$option_border};
    border-right: 0.3rem solid ${$ => $.$option_border};
  }
  && .ComboBox-list > .Option:focus {
    background: ${$ => ColorUtils.contrast($.$option_background, 0.3)};
  }
  && .ComboBox-list > .Option:active {
    background: ${$ => ColorUtils.contrast($.$option_background, 0.5)};
  }
  && .ComboBox-list > .Option[data-selected="true"] {
    color: ${$ => $.$selected_foreground_color};
  }
  &&:not(.running-effect) .ComboBox-list > .Option:disabled {
    opacity: 0.5;
  }
`;

type ComboBoxGlobalHandlers = {
  pointerDown: null | Function,
  inputPressed: null | Function,
  keyDown: null | Function,
  wheel: null | Function,
};