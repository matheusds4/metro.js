// third-party
import assert from "assert";
import * as React from "react";
import { styled } from "styled-components";
import { Color } from "@hydroperx/color";
import { input } from "@hydroperx/inputaction";
import gsap from "gsap";
import * as FloatingUI from "@floating-ui/dom";

// local
import { RTLContext } from "../layout/RTL";
import { Theme, ThemeContext } from "../theme/Theme";
import * as ColorUtils from "../utils/ColorUtils";
import * as MathUtils from "../utils/MathUtils";
import { SimplePlacementType } from "../utils/PlacementUtils";
import * as REMConvert from "../utils/REMConvert";
import { COMMON_DELAY, MAXIMUM_Z_INDEX } from "../utils/Constants";
import { TypedEventTarget } from "@hydroperx/event";

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
  // div
  const div = React.useRef<null | HTMLDivElement>(null);

  // global handlers
  const global_handlers = React.useRef<PopoverMenuGlobalHandlers>({
    pointerDown: null,
    inputPressed: null,
    keyDown: null,
    wheel: null,
  });

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
    function external_close_request(e: CustomEvent<{ immediate: boolean }>): void {
      close(e.detail.immediate);
    }
    div_el.addEventListener("_PopoverMenu_close", external_close_request as any);

    // cleanup
    return () => {
      // dispose of external request handlers
      div_el.removeEventListener("_PopoverMenu_open", external_open_request as any);
      div_el.removeEventListener("_PopoverMenu_close", external_close_request as any);

      // dispose of global handlers if any
      dispose_global_handlers();
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
      menu.dispatchEvent(new CustomEvent("_PopoverMenu_close", {
        detail: { immediate: true },
      }));
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

    fixme();
  }

  // close logic
  function close(immediate: boolean = false): void {
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
      menu.dispatchEvent(new CustomEvent("_PopoverMenu_close", {
        detail: { immediate },
      }));
    }

    // remember as closed
    div_el.removeAttribute("data-open");

    // visibility immediately cleared or play a position-alpha tween before?
    fixme();

    // dispose of global handlers
    dispose_global_handlers();
  }

  // register global event handlers used by the root
  // PopoverMenu.
  function register_global_handlers(): void {
    dispose_global_handlers();

    // handle pointer down anywhere the viewport
    global_handlers.current.pointerDown = function(): void {
      fixme();
    };
    window.addEventListener("pointerdown", global_handlers.current.pointerDown as any);

    // handle input pressed
    global_handlers.current.inputPressed = function(e: Event): void {
      fixme();
    };
    input.on("inputPressed", global_handlers.current.inputPressed as any);

    // handle key down
    global_handlers.current.keyDown = function(e: KeyboardEvent): void {
      fixme();
    };
    window.addEventListener("keydown", global_handlers.current.keyDown as any);

    // handle wheel
    global_handlers.current.wheel = function(e: WheelEvent): void {
      fixme();
    };
    window.addEventListener("wheel", global_handlers.current.wheel as any);
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

      <div className="PopoverMenu-up-arrow"></div>
      <div className="PopoverMenu-content">
        {params.children}
      </div>
      <div className="PopoverMenu-down-arrow"></div>
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
  && > .PopoverMenu-content > .Item:active:not(:disabled) {
    background: ${$ => ColorUtils.contrast($.$backgroundColor, 0.4)};
    color: ${$ => $.$foreground};
  }
  && > .PopoverMenu-content > .Item:disabled {
    opacity: 0.5;
  }

  /* icon reserved space for an Item */
  && > .PopoverMenu-content > .Item > span:nth-child(1) {
    width: ${REMConvert.pixels.remPlusUnit(9)};
    height: ${REMConvert.pixels.remPlusUnit(9)};
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
    min-width: ${REMConvert.pixels.remPlusUnit(9)};
    min-height: ${REMConvert.pixels.remPlusUnit(9)};
  }
  &&:not(.rtl) > .PopoverMenu-content > .Item > span:nth-child(3) {
    text-align: right;
    margin-left: 2rem;
  }
  &&.rtl > .PopoverMenu-content > .Item > span:nth-child(3) {
    text-align: left;
    margin-right: 2rem;
  }

  /* Indicator */
  && > .PopoverMenu-content > .Item > span:nth-child(3) > .Indicator {
    width: ${REMConvert.pixels.remPlusUnit(9)};
    height: ${REMConvert.pixels.remPlusUnit(9)};
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