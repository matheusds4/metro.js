// third-party
import assert from "assert";
import * as React from "react";
import { styled } from "styled-components";
import { Color } from "@hydroperx/color";
import { TypedEventTarget } from "@hydroperx/event";
import { input } from "@hydroperx/inputaction";
import gsap from "gsap";
import * as FloatingUI from "@floating-ui/dom";
import $ from "jquery";

// local
import { RTLContext } from "../layout/RTL";
import { Theme, ThemeContext } from "../theme/Theme";
import * as ColorUtils from "../utils/ColorUtils";
import { focusPrevSibling, focusNextSibling } from "../utils/FocusUtils";
import * as MathUtils from "../utils/MathUtils";
import { fitViewport, SimplePlacementType } from "../utils/PlacementUtils";
import * as StringUtils from "../utils/StringUtils";
import * as REMConvert from "../utils/REMConvert";
import { COMMON_DELAY, MAXIMUM_Z_INDEX } from "../utils/Constants";

/**
 * Either a popover menu or a context menu.
 */
export function PopoverMenu(params: {
  /**
   * Passing a controller allows explicitly opening or closing
   * a popover menu.
   */
  controller?: PopoverMenuController,

  children?: React.ReactNode,
  className?: string,
  style?: React.CSSProperties,
  id?: string,
}): React.ReactNode {
  // divs
  const div = React.useRef<null | HTMLDivElement>(null);
  const arrow_up = React.useRef<null | HTMLDivElement>(null);
  const arrow_down = React.useRef<null | HTMLDivElement>(null);

  // global handlers
  const global_handlers = React.useRef<PopoverMenuGlobalHandlers>({
    pointerDown: null,
    inputPressed: null,
    keyDown: null,
    wheel: null,
  });

  // typing cache
  const key_sequence_reference = React.useRef<string>("");
  const key_sequence_last_timestamp = React.useRef<number>(0);

  // tweens
  const tweens = React.useRef<gsap.core.Tween[]>([]);

  // ?rtl
  const rtl = React.useContext(RTLContext);
  const rtl_reference = React.useRef(rtl);

  // ?theme
  const theme = React.useContext(ThemeContext);

  // initialization
  React.useEffect(() => {
    const div_el = div.current!;

    // handle external request to open
    function external_open_request(e: CustomEvent<PopoverMenuOpenParams>): void {
      open(e.detail);
    }
    div_el.addEventListener("_PopoverMenu_open", external_open_request as any);

    // handle external request to close
    function external_close_request(e: Event): void {
      close();
    }
    div_el.addEventListener("_PopoverMenu_close", external_close_request as any);

    // handle pointer enter
    function pointer_enter(): void {
      div_el.setAttribute("data-hover", "true");
    }
    div_el.addEventListener("pointerenter", pointer_enter);

    // handle pointer leave
    function pointer_leave(): void {
      div_el.removeAttribute("data-hover");
    }
    div_el.addEventListener("pointerleave", pointer_leave);

    // cleanup
    return () => {
      // dispose of external request handlers
      div_el.removeEventListener("_PopoverMenu_open", external_open_request as any);
      div_el.removeEventListener("_PopoverMenu_close", external_close_request as any);

      // dispose of pointer handlers
      div_el.removeEventListener("pointerenter", pointer_enter);
      div_el.removeEventListener("pointerleave", pointer_leave);

      // dispose of global handlers if any
      dispose_global_handlers();

      // kill tweens
      for (const tween of tweens.current) {
        tween.kill();
      }
      tweens.current.length = 0;
    };
  }, []);

  // use the given controller
  React.useEffect(() => {
    if (!params.controller) {
      return;
    }
    const controller = params.controller!;
    // open signal
    function controller_open(e: CustomEvent<PopoverMenuOpenParams>): void {
      open(e.detail);
    }
    controller.addEventListener("openSignal", controller_open);
    // close signal
    function controller_close(e: Event): void {
      close();
    }
    controller.addEventListener("closeSignal", controller_close);

    // cleanup
    return () => {
      controller.removeEventListener("openSignal", controller_open);
      controller.removeEventListener("closeSignal", controller_close);
    };
  }, [params.controller]);

  // sync ?rtl
  React.useEffect(() => {
    rtl_reference.current = rtl;
  }, [rtl]);

  // open logic
  function open(params: PopoverMenuOpenParams): void {
    const div_el = div.current!;
    if (div_el.getAttribute("data-open") == "true") {
      return;
    }

    // enumerate parent PopoverMenus (ascending order)
    const parents: HTMLDivElement[] = [];
    let possibly_unrelated_parent = div_el.parentElement?.parentElement?.parentElement;
    for (; possibly_unrelated_parent;) {
      if (possibly_unrelated_parent.classList.contains("PopoverMenu")) {
        parents.splice(0, 0, possibly_unrelated_parent as HTMLDivElement);
      } else {
        break;
      }
      possibly_unrelated_parent = possibly_unrelated_parent.parentElement?.parentElement?.parentElement;
    }

    // for this menu to open, parents must be previously opened too.
    assert(parents.every(p => p.getAttribute("data-open") == "true"),
      "Cannot open a nested PopoverMenu with a closed parent.");

    // close other menus
    for (const menu of document.body.querySelectorAll(".PopoverMenu[data-open='true']")) {
      // do not close parent menus or this menu itself
      if (parents.includes(menu as HTMLDivElement) || menu === div_el) {
        continue;
      }
      menu.dispatchEvent(new Event("_PopoverMenu_close"));
    }

    // remember as open
    div_el.setAttribute("data-open", "true");

    // make it visible
    div_el.style.visibility = "visible";

    // if this is a root PopoverMenu,
    // register global event handlers.
    if (parents.length == 0) {
      register_global_handlers();
    }

    // kill previous tweens
    for (const tween of tweens.current) {
      tween.kill();
    }
    tweens.current.length = 0;

    // content div
    const content_div = get_content_div();

    // turn scroll-indicator arrows visible or hidden
    const k_scroll = content_div.scrollTop;
    content_div.scrollTop = 10;
    const arrows_visible = content_div.scrollTop != 0;
    arrow_up.current!.style.display =
      arrow_down.current!.style.display = arrows_visible ? "flex" : "";
    content_div.scrollTop = k_scroll;

    // finally, place the PopoverMenu.
    place_smooth(params);
  }

  // placement logic
  async function place_smooth(params: PopoverMenuOpenParams): Promise<void> {
    const div_el = div.current!;

    // placement resolution
    let placement: SimplePlacementType = "bottom";

    // resulting positions
    let x = 0, y = 0;

    if (params.reference) {
      // position PopoverMenu after a reference element.
      let prev_display = div_el.style.display;
      if (prev_display == "none") div_el.style.display = "inline-flex";
      const r = await FloatingUI.computePosition(params.reference!, div_el, {
        placement: params.prefer,
        middleware: [
          FloatingUI.flip(), FloatingUI.shift(), FloatingUI.offset(10),
          FloatingUI.size({
            apply({ availableWidth, availableHeight, elements }) {
              Object.assign(elements.floating.style, {
                maxWidth: availableWidth + "px",
                maxHeight: availableHeight + "px",
              });
            },
          }),
        ],
      });
      div_el.style.display = prev_display;
      x = r.x;
      y = r.y;
      placement = r.placement.replace(/\-.*/, "") as SimplePlacementType;
    } else {
      // position PopoverMenu at a given point.
      assert(
        params.event !== undefined || params.position !== undefined,
        "At least a position must be specified when opening a PopoverMenu.",
      );
      let x1 = 0, y1 = 0;
      if (params.event) {
        x1 = params.event!.clientX;
        y1 = params.event!.clientY;
      } else {
        [x1, y1] = params.position!;
      }
      [x, y] = fitViewport(div_el, [x1, y1]);
    }

    // (x, y, alpha) tween
    const duration = 0.18;
    let tween: null | gsap.core.Tween = null;
    switch (placement) {
      case "top": {
        tween = gsap.fromTo(
          div_el,
          { left: x + "px", top: (y + 15) + "px", opacity: 0 },
          { top: y + "px", opacity: 1, duration, ease: "power1.out" },
        );
        break;
      }
      case "bottom": {
        tween = gsap.fromTo(
          div_el,
          { left: x + "px", top: (y - 15) + "px", opacity: 0 },
          { top: y + "px", opacity: 1, duration, ease: "power1.out" },
        );
        break;
      }
      case "left": {
        tween = gsap.fromTo(
          div_el,
          { left: (x + 15) + "px", top: y + "px", opacity: 0 },
          { left: x + "px", opacity: 1, duration, ease: "power1.out" },
        );
        break;
      }
      case "right": {
        tween = gsap.fromTo(
          div_el,
          { left: (x - 15) + "px", top: y + "px", opacity: 0 },
          { left: x + "px", opacity: 1, duration, ease: "power1.out" },
        );
        break;
      }
    }
    tween!.then(() => {
      tweens.current.length = 0;
    });
    tweens.current.push(tween!);
  }

  // close logic
  function close(): void {
    const div_el = div.current!;
    if (div_el.getAttribute("data-open") !== "true") {
      return;
    }
    // cancel highlighting open submenu items
    for (const item of div_el.querySelectorAll(".Item[data-open='true']")) {
      item.removeAttribute("data-open");
    }

    // close submenus
    for (const menu of div_el.querySelectorAll(".PopoverMenu[data-open='true']")) {
      menu.dispatchEvent(new Event("_PopoverMenu_close"));
    }

    // remember as closed
    div_el.removeAttribute("data-open");

    // forget hover
    div_el.removeAttribute("data-hover");

    // dispose of global handlers
    dispose_global_handlers();

    // kill previous tweens
    for (const tween of tweens.current) {
      tween.kill();
    }
    tweens.current.length = 0;

    // clear visibility
    div_el.style.visibility = "";
  }

  // returns content div
  function get_content_div(): HTMLDivElement {
    return div.current!.children[1] as HTMLDivElement;
  }

  // register global event handlers used by the root
  // PopoverMenu.
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
    window.addEventListener("wheel", global_handlers.current.wheel as any, { passive: true });
  }

  // handle pointer down on the viewport
  function global_pointer_down(): void {
    const div_el = div.current!;
    if (div_el.getAttribute("data-open") !== "true") {
      return;
    }

    // if clicking outside opened PopoverMenus, close them.

    // test hover
    let out = true;
    if ($(div_el).is(":visible")) {
      if (div_el.getAttribute("data-hover") == "true") {
        out = false;
      }

      if (out) {
        for (const div1 of Array.from(
          get_content_div().querySelectorAll(".PopoverMenu")
        ) as HTMLDivElement[]) {
          if ($(div1).is(":hidden")) {
            continue;
          }
          // Test hover
          if (div1.getAttribute("data-hover") == "true") {
            out = false;
            break;
          }
        }
      }
    }

    if (out) {
      close();
    }
  }

  // handle arrows and escape
  function input_pressed(e: Event): void {
    // basics
    const div_el = div.current!;
    if (div_el.getAttribute("data-open") !== "true") {
      return;
    }
    const content_div = get_content_div();

    // menu list
    let menus = Array.from(content_div.querySelectorAll(".PopoverMenu[data-open='true']")) as HTMLDivElement[];
    menus.splice(0, 0, div_el);
    const innermost = menus[menus.length - 1];
    const innermost_content_div = innermost.children[1] as HTMLDivElement;

    // handle escape
    if (input.justPressed("escape")) {
      // close innermost menu
      // just root open?
      if (menus.length == 1) {
        close();
      // otherwise close the innermost submenu and
      // focus back representing item.
      } else {
        innermost.dispatchEvent(new Event("_PopoverMenu_close"));
        const item = innermost.parentElement!;
        item.focus();
        // forget about submenu being open on item.
        item.removeAttribute("data-open");
      }
      return;
    }

    for (let i = 0; i < innermost_content_div.children.length; i++) {
      // child Item
      const item = innermost_content_div.children[i] as HTMLElement;

      // if focused
      if (document.activeElement === item) {
        // navigate up
        if (input.justPressed("navigateUp")) {
          e.preventDefault();
          focusPrevSibling(item);
        // navigate down
        } else if (input.justPressed("navigateDown")) {
          e.preventDefault();
          focusNextSibling(item);
        // open submenu
        } else if (input.justPressed(rtl_reference.current ? "navigateLeft" : "navigateRight")) {
          const submenu = item.children.length >= 4 ? item.children[3] as HTMLElement : null;
          if (submenu?.classList.contains("PopoverMenu")) {
            (item as HTMLButtonElement).click();
            if (submenu.children[1].lastElementChild) {
              e.preventDefault();
              focusNextSibling(submenu.children[1].lastElementChild! as HTMLElement);
            }
          }
        // close submenu
        } else if (input.justPressed(rtl_reference.current ? "navigateRight" : "navigateLeft")) {
          if (innermost.parentElement?.parentElement?.parentElement?.classList.contains("PopoverMenu")) {
            const parent_item = innermost.parentElement! as HTMLDivElement;
            innermost!.dispatchEvent(new Event("_PopoverMenu_close"));

            // forget submenu is open in the representing item.
            parent_item.removeAttribute("data-open");

            // focus back submenu representing item.
            parent_item.focus();
          }
        }

        return;
      }
    }

    // if there is no item focused, handle arrows
    // a little differently.

    // focus last
    if (input.justPressed("navigateUp")) {
      const first = innermost_content_div.firstElementChild;
      if (first) {
        e.preventDefault();
        focusPrevSibling(first as HTMLElement);
      }
    // focus first
    } else if (input.justPressed("navigateDown")) {
      const last = innermost_content_div.lastElementChild;
      if (last) {
        e.preventDefault();
        focusNextSibling(last as HTMLElement);
      }
    // close current submenu
    } else if (input.justPressed(rtl_reference.current ? "navigateRight" : "navigateLeft")) {
      if (innermost.parentElement?.parentElement?.parentElement?.classList.contains("PopoverMenu")) {
        const parent_item = innermost.parentElement! as HTMLDivElement;
        innermost!.dispatchEvent(new Event("_PopoverMenu_close"));

        // forget submenu is open in the representing item.
        parent_item.removeAttribute("data-open");

        // focus back submenu representing item.
        parent_item.focus();
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

    // menu list
    let menus = Array.from(get_content_div().querySelectorAll(".PopoverMenu[data-open='true']")) as HTMLDivElement[];
    menus.splice(0, 0, div.current!);
    const innermost = menus[menus.length - 1];
    const innermost_content_div = innermost.children[1] as HTMLDivElement;

    if (Date.now() < key_sequence_last_timestamp.current + 700) {
      // continue key sequence
      key_sequence_reference.current += e.key.toLowerCase();
    } else {
      // start new key sequence
      key_sequence_reference.current = e.key.toLowerCase();
    }
    let key_seq = key_sequence_reference.current;
    const rtl = rtl_reference.current;
    if (rtl) {
      key_seq = StringUtils.reverse(key_seq);
    }
    for (const item of Array.from(innermost_content_div.children) as HTMLElement[]) {
      if (item.children.length < 2 || !item.classList.contains("Item")) {
        continue;
      }
      const label = item.children[1]! as HTMLElement;
      const label_text = label.innerText.trim().toLowerCase();
      if (rtl ? label_text.endsWith(key_seq) : label_text.startsWith(key_seq)) {
        item.focus();
        break;
      }
    }
    key_sequence_last_timestamp.current = Date.now();
  }

  // prevent scrolling outside while PopoverMenu is open,
  // but still allow scrolling inside the PopoverMenus.
  function global_wheel(e: WheelEvent): void {
    const div_el = div.current!;
    if (div_el.getAttribute("data-open") !== "true") {
      return;
    }

    // test hover
    let out = true;
    if ($(div_el).is(":visible")) {
      if (div_el.getAttribute("data-hover") == "true") {
        out = false;
      }

      if (out) {
        for (const div1 of Array.from(
          get_content_div().querySelectorAll(".PopoverMenu")
        ) as HTMLDivElement[]) {
          if ($(div1).is(":hidden")) {
            continue;
          }
          // Test hover
          if (div1.getAttribute("data-hover") == "true") {
            out = false;
            break;
          }
        }
      }
    }

    if (out) {
      e.preventDefault();
    }
  }

  // unregister global event handlers used by the root
  // PopoverMenu.
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

  return (
    <Div
      className={
        [
          "PopoverMenu",
          ...(rtl ? ["rtl"] : []),
          ...(params.className ?? "").split(" ").filter(p => p != ""),
        ].join(" ")
      }
      id={params.id}
      style={params.style}
      ref={div}
      $backgroundColor={theme.colors.inputBackground}
      $borderColor={theme.colors.inputBorder}
      $foreground={theme.colors.foreground}>

      <div className="PopoverMenu-up-arrow" ref={arrow_up}></div>
      <div className="PopoverMenu-content">
        {params.children}
      </div>
      <div className="PopoverMenu-down-arrow" ref={arrow_down}></div>
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
    z-index: ${MAXIMUM_Z_INDEX};
    visibility: hidden;
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

  /* Item */
  && > .PopoverMenu-content > .Item {
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    gap: 0.9rem;
    padding: 0.5rem 0.7rem;
    background: none;
    border: none;
    outline: none;
    color: ${$ => $.$foreground};
  }
  &&.rtl > .PopoverMenu-content > .Item {
    flex-direction: row-reverse;
  }
  && > .PopoverMenu-content > .Item:focus:not(:disabled),
  && > .PopoverMenu-content > .Item:active:not(:disabled),
  && > .PopoverMenu-content > .Item[data-open="true"] {
    background: ${$ => ColorUtils.contrast($.$backgroundColor, 0.4)};
    color: ${$ => $.$foreground};
  }
  && > .PopoverMenu-content > .Item:disabled {
    opacity: 0.5;
  }

  /* icon reserved space for an Item */
  && > .PopoverMenu-content > .Item > span:nth-child(1) {
    width: ${REMConvert.pixels.remPlusUnit(21)};
    height: ${REMConvert.pixels.remPlusUnit(21)};
  }

  /* label reserved space for an Item */
  &&.rtl > .PopoverMenu-content > .Item > .Label:nth-child(2) {
    text-align: right;
  }

  /* ending reserved space for an Item */
  && > .PopoverMenu-content > .Item > span:nth-child(3) {
    flex-grow: 4;
    font-size: 0.8rem;
    opacity: 0.6;
    min-width: ${REMConvert.pixels.remPlusUnit(20)};
    min-height: ${REMConvert.pixels.remPlusUnit(20)};
  }
  &&:not(.rtl) > .PopoverMenu-content > .Item > span:nth-child(3) {
    display: flex;
    flex-direction: row;
    justify-content: end;
    margin-left: 2rem;
  }
  &&.rtl > .PopoverMenu-content > .Item > span:nth-child(3) {
    justify-content: start;
    margin-right: 2rem;
  }

  /* Indicator */
  && > .PopoverMenu-content > .Item > span:nth-child(3) > .Indicator {
    width: ${REMConvert.pixels.remPlusUnit(20)};
    height: ${REMConvert.pixels.remPlusUnit(20)};
  }

  /* Separator */
  && > .PopoverMenu-content > .Separator {
    padding: 0.45rem;
  }
`;

/**
 * Allows opening and closing a `PopoverMenu`.
 */
export class PopoverMenuController extends (EventTarget as TypedEventTarget<{
  /** @hidden */
  openSignal: CustomEvent<PopoverMenuOpenParams>,
  /** @hidden */
  closeSignal: Event,
}>) {
  /**
   * Opens the popover menu.
   */
  public open(params: PopoverMenuOpenParams): void {
    this.dispatchEvent(new CustomEvent("openSignal", {
      detail: params,
    }));
  }

  /**
   * Closes the popover menu, including any nested popover menus.
   */
  public close(): void {
    this.dispatchEvent(new Event("closeSignal"));
  }
}

/**
 * Parameters passed to `PopoverMenuController.open()`.
 */
export type PopoverMenuOpenParams = {
  /**
   * Preferred placement type.
   */
  prefer?: SimplePlacementType,
  /**
   * Original causing mouse event, if any.
   */
  event?: MouseEvent,
  /**
   * Position (x, y), if any.
   */
  position?: [number, number],
  /**
   * Reference element to where placement of the popover menu occurs.
   */
  reference?: HTMLElement,
};

type PopoverMenuGlobalHandlers = {
  pointerDown: null | Function,
  inputPressed: null | Function,
  keyDown: null | Function,
  wheel: null | Function,
};