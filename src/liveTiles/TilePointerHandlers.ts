// local
import type { Core, BulkChange } from "./Core";
import { CoreGroup, CoreTile } from "./CoreGroup";
import { SimpleGroup } from "./SimpleGroup";
import * as MathUtils from "../utils/MathUtils";

//
export class TilePointerHandlers {
  //
  private dragging: boolean = false;
  private mouse_started: boolean = false;
  private toggle_timeout: number = -1;
  private toggle_timestamp: number = 0;
  private just_held_long: boolean = false;

  //
  private bound_window_mouse_move_handler: null | Function = null;
  private bound_window_mouse_up_handler: null | Function = null;
  private bound_window_click_handler: null | Function = null;

  //
  public constructor(
    private readonly $: Core,
    private readonly node: HTMLButtonElement
  ) {
    //
  }

  //
  public attach(): void {
    const { node } = this;

    // mouse handlers
    node.addEventListener("mousedown", this.mouse_down.bind(this));
    node.addEventListener("mouseup", this.mouse_up.bind(this));
    node.addEventListener("mouseout", this.mouse_out.bind(this));
    node.addEventListener("click", this.click.bind(this));

    // touch handlers
    // 
    // - [ ] prevent default to avoid `click`
    fixme();

    // context menu handlers
    node.addEventListener("contextmenu", this.context_menu.bind(this));
  }

  //
  private mouse_down(e: MouseEvent): void {
    if (this.dragging) {
      return;
    }
    this.mouse_started = true;
    this.toggle_timeout = window.setTimeout(() => {
      // holding long on a tile will check it
      if (this.dragging) return;
      this.toggle_check();
      this.just_held_long = true;
      this.toggle_timestamp = Date.now();
    }, 600);

    // window#mousemove
    this.bound_window_mouse_move_handler = this.window_mouse_move.bind(this);
    window.addEventListener("mousemove", this.bound_window_mouse_move_handler as any);
    this.$._window_handlers.push(["mousemove", this.bound_window_mouse_move_handler]);

    // window#mouseup
    this.bound_window_mouse_up_handler = this.window_mouse_up.bind(this);
    window.addEventListener("mouseup", this.bound_window_mouse_up_handler as any);
    this.$._window_handlers.push(["mouseup", this.bound_window_mouse_up_handler]);

    // window#click
    this.bound_window_click_handler = this.window_mouse_up.bind(this);
    window.addEventListener("click", this.bound_window_click_handler as any);
    this.$._window_handlers.push(["click", this.bound_window_click_handler]);
  }

  //
  private discard_window_handlers(): void {
    // window#mousemove
    let h = this.bound_window_mouse_move_handler;
    if (h) {
      window.removeEventListener("mousemove", h as any);
      const i = this.$._window_handlers.findIndex(hB => h === hB[1]);
      if (i != -1) this.$._window_handlers.splice(i, 1);
    }

    // window#mouseup
    h = this.bound_window_mouse_up_handler;
    if (h) {
      window.removeEventListener("mouseup", h as any);
      const i = this.$._window_handlers.findIndex(hB => h === hB[1]);
      if (i != -1) this.$._window_handlers.splice(i, 1);
    }

    // window#mouseup
    h = this.bound_window_click_handler;
    if (h) {
      window.removeEventListener("click", h as any);
      const i = this.$._window_handlers.findIndex(hB => h === hB[1]);
      if (i != -1) this.$._window_handlers.splice(i, 1);
    }
  }

  //
  private window_mouse_move(e: MouseEvent): void {
    fixme();
  }

  //
  private window_mouse_up(e: MouseEvent): void {
    // let the other handler run if directly for the tile.
    if (e.target instanceof HTMLElement && this.node.contains(e.target)) {
      return;
    }

    fixme();

    this.discard_window_handlers()
  }

  //
  private window_click(e: MouseEvent): void {
    // let the other handler run if directly for the tile.
    if (e.target instanceof HTMLElement && this.node.contains(e.target)) {
      return;
    }

    fixme();

    this.discard_window_handlers()
  }

  //
  private mouse_up(e: MouseEvent): void {
    fixme();

    this.discard_window_handlers()
  }

  //
  private mouse_out(e: MouseEvent): void {
    fixme();
  }

  //
  private click(e: MouseEvent): void {
    fixme();

    // at some point... this.discard_window_handlers()
  }

  //
  private context_menu(e: PointerEvent): void {
    e.preventDefault();
    this.$.dispatchEvent(new CustomEvent("contextMenu", {
      detail: {
        tile: this.id,
        clientX: e.clientX,
        clientY: e.clientY,
      },
    }));
  }

  //
  private toggle_check(): void {
    const new_val = this.node.getAttribute("data-checked") != "true";
    if (new_val) {
      this.node.setAttribute("data-checked", "true");
    } else {
      this.node.removeAttribute("data-checked");
    }
    const current: string[] = [];
    for (const [,g] of this.$._groups) {
      for (const [id, t] of g.tiles) {
        if (t.dom?.getAttribute("data-checked") === "true") {
          current.push(id);
        }
      }
    }
    this.$.dispatchEvent(new CustomEvent("checkedChange", {
      detail: { tiles: current },
    }));
  }

  //
  private get id(): string {
    return this.node.getAttribute("data-id") ?? "";
  }
}