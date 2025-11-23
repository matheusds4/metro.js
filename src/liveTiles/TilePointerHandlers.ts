// third-party
import getOffset from "getoffset";

// local
import type { Core, BulkChange } from "./Core";
import { CoreGroup, CoreTile } from "./CoreGroup";
import { TileSize, TileSizeMapPair } from "./TileSize";
import { SimpleGroup } from "./SimpleGroup";
import * as MathUtils from "../utils/MathUtils";
import * as OffsetUtils from "../utils/OffsetUtils";

//
export class TilePointerHandlers {
  //
  private draggable_ready: boolean = false;
  private dragged: boolean = false;
  private mouse_started: boolean = false;
  private toggle_timeout: number = -1;
  private toggle_timestamp: number = 0;
  private just_held_long: boolean = false;

  // touch only
  private touch_start_id: number = -1;
  private allow_dnd_timeout: number = -1;
  private enable_touch_dnd: boolean = false;
  private touch_start_event: null | TouchEvent = null;

  //
  private bound_window_mouse_move_handler: null | Function = null;

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
    node.addEventListener("touchstart", this.touch_start.bind(this), { passive: false });
    node.addEventListener("touchmove", this.touch_move.bind(this), { passive: false });
    node.addEventListener("touchend", this.touch_end.bind(this), { passive: false });
    node.addEventListener("touchcancel", this.touch_cancel.bind(this), { passive: false });

    // context menu handlers
    node.addEventListener("contextmenu", this.context_menu.bind(this));
  }

  //
  private mouse_down(e: MouseEvent): void {
    if (this.$._dnd.dragging || e.button != 0 || this.touch_start_id != -1) {
      return;
    }
    this.draggable_ready = false;
    this.mouse_started = true;
    this.dragged = false;
    this.just_held_long = false;
    this.toggle_timeout = window.setTimeout(() => {
      this.toggle_timeout = -1;
      // holding long on a tile will check it
      if (this.dragged) return;
      this.$._dnd.cancel();
      this.toggle_check();
      this.just_held_long = true;
      this.toggle_timestamp = Date.now();
    }, 600);

    // window#mousemove
    this.bound_window_mouse_move_handler = this.window_mouse_move.bind(this);
    window.addEventListener("mousemove", this.bound_window_mouse_move_handler as any);
    this.$._window_handlers.push(["mousemove", this.bound_window_mouse_move_handler]);
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
  }

  //
  private window_mouse_move(e: MouseEvent): void {
    if (!this.draggable_ready && this.$._drag_enabled) {
      this.$._dnd.initTileDNDDraggable();
      this.$._dnd.tileId = this.id;
      this.$._dnd.tileButton = this.node;
      this.draggable_ready = true;
      this.position_dnd();
      // tileDND#mousedown
      this.$._dnd.tileDNDDOM?.dispatchEvent(new MouseEvent("mousedown", {
        button: e.button,
        buttons: e.buttons,
        clientX: e.clientX,
        clientY: e.clientY,
        movementX: e.movementX,
        movementY: e.movementY,
        screenX: e.screenX,
        screenY: e.screenY,
      }));
    }

    //
    if (this.$._dnd.dragging) {
      this.dragged = true;
    }
  }

  //
  private position_dnd(): void {
    // tileDND - absolute position
    this.$._dnd.tileDNDDOM!.style.position = "absolute";

    // put translate
    let offset = getOffset(this.node, this.$._container)!;
    OffsetUtils.divideOffsetBy(offset, this.$._rem);
    this.$._dnd.tileDNDDOM!.style.left = offset.x + "rem";
    this.$._dnd.tileDNDDOM!.style.top = offset.y + "rem";

    // resize tileDND
    const size = (this.node.getAttribute("data-size") ?? "small") as TileSize;
    const p = ((this.$._tile_in_rem as any)[size]) as TileSizeMapPair;
    // const tile_inside_dnd = this.$._dnd.tileDNDDOM!.getElementsByClassName("Tile")[0] as HTMLElement;
    this.$._dnd.tileDNDDOM!.style.width = p.width + "rem";
    this.$._dnd.tileDNDDOM!.style.height = p.height + "rem";
  }

  //
  private mouse_up(e: MouseEvent): void {
    if (this.toggle_timeout != -1) {
      window.clearTimeout(this.toggle_timeout);
      this.toggle_timeout = -1;
    }
    this.discard_window_handlers();
  }

  //
  private mouse_out(e: MouseEvent): void {
    if (this.toggle_timeout != -1) {
      window.clearTimeout(this.toggle_timeout);
      this.toggle_timeout = -1;
    }
    if (this.just_held_long) {
      this.$._dnd.cancel();
    }
    this.just_held_long = false;
    this.mouse_started = false;
  }

  //
  private click(e: MouseEvent): void {
    this.discard_window_handlers();

    if (!this.mouse_started || this.dragged) {
      if (!this.dragged) {
        this.$._dnd.cancel();
      }
      this.mouse_started = false;

      // cancel check-toggle timeout
      if (this.toggle_timeout != -1) {
        window.clearTimeout(this.toggle_timeout);
        this.toggle_timeout = -1;
      }
      return;
    }
    if (this.just_held_long) {
      this.just_held_long = false;
      return;
    }
    // cancel check-toggle timeout
    if (this.toggle_timeout != -1) {
      window.clearTimeout(this.toggle_timeout);
      this.toggle_timeout = -1;
    }

    //
    this.mouse_started = false;

    if (this.toggle_timestamp < Date.now() - 100) {
      this.short_click(e);
    }
  }

  //
  private touch_start(e: TouchEvent): void {
    if (this.$._dnd.dragging || this.mouse_started) {
      return;
    }
    // e.preventDefault();
    this.touch_start_id = e.touches[0].identifier;
    this.enable_touch_dnd = false;
    this.just_held_long = false;
    this.dragged = false;
    this.mouse_started = false;
    this.draggable_ready = false;
    this.touch_start_event = e;

    // timeout to enable drag-n-drop
    this.allow_dnd_timeout = window.setTimeout(() => {
      this.allow_dnd_timeout = -1;
      this.enable_touch_dnd = true;

      this.toggle_timeout = window.setTimeout(() => {
        this.toggle_timeout = -1;
        // holding long on a tile will check it
        if (this.dragged) return;
        this.toggle_check();
        this.just_held_long = true;
        this.toggle_timestamp = Date.now();
      }, 300);
    }, 500);
  }

  //
  private touch_move(e: TouchEvent): void {
    if (this.touch_start_id == -1) {
      return;
    }
    const touch = Array.from(e.changedTouches).find(t => t.identifier == this.touch_start_id);
    if (!touch) {
      return;
    }
    e.preventDefault();

    // if moving touch out of tile, prevent drag-n-drop.
    if (this.allow_dnd_timeout != -1) {
      const r = this.node.getBoundingClientRect();
      const hover = touch.clientX >= r.x && touch.clientX < r.right && touch.clientY >= r.y && touch.clientY < r.bottom;
      if (!hover) {
        window.clearTimeout(this.allow_dnd_timeout);
        this.allow_dnd_timeout = -1;
      }
    }

    // prevent check toggle
    if (this.toggle_timeout != -1) {
      const r = this.node.getBoundingClientRect();
      const hover = touch.clientX >= r.x && touch.clientX < r.right && touch.clientY >= r.y && touch.clientY < r.bottom;
      if (!hover) {
        window.clearTimeout(this.toggle_timeout);
        this.toggle_timeout = -1;
      }
    }

    //
    if (this.enable_touch_dnd && !this.draggable_ready && this.$._drag_enabled) {
      this.$._dnd.initTileDNDDraggable();
      this.$._dnd.tileId = this.id;
      this.$._dnd.tileButton = this.node;
      this.draggable_ready = true;
      this.position_dnd();
      window.setTimeout(() => {
        // tileDND#touchstart
        this.$._dnd.tileDNDDOM?.dispatchEvent(this.touch_start_event!);
      }, 0);
    }

    //
    if (this.$._dnd.dragging) {
      // if touch continues holding and drag starts, then uncheck tiles
      if (!this.dragged) {
        this.$.uncheckAll();
      }
      this.dragged = true;
    }

    if (this.dragged && this.toggle_timeout != -1) {
      // cancel check-toggle timeout
      window.clearTimeout(this.toggle_timeout);
      this.toggle_timeout = -1;
    }

    // tileDND#touchmove
    window.setTimeout(() => {
      this.$._dnd.tileDNDDOM?.dispatchEvent(e);
    }, 0);

    //
    // if (this.dragged) {
    //   e.preventDefault();
    // }
  }

  //
  private touch_end(e: TouchEvent): void {
    if (this.touch_start_id == -1) {
      return;
    }
    const touch = Array.from(e.changedTouches).find(t => t.identifier == this.touch_start_id);
    if (!touch) {
      return;
    }
    if (!this.dragged) {
      this.$._dnd.cancel();
    }
    this.touch_start_event = null;
    this.touch_start_id  = -1;
    if (this.dragged) {
      window.setTimeout(() => {
        // tileDND#touchend
        this.$._dnd.tileDNDDOM?.dispatchEvent(e);
      }, 0);

      // cancel drag-n-drop timeout
      if (this.allow_dnd_timeout != -1) {
        window.clearTimeout(this.allow_dnd_timeout);
        this.allow_dnd_timeout = -1;
      }
      // cancel check-toggle timeout
      if (this.toggle_timeout != -1) {
        window.clearTimeout(this.toggle_timeout);
        this.toggle_timeout = -1;
      }
      return;
    }
    // e.preventDefault();

    if (this.just_held_long) {
      this.just_held_long = false;
      return;
    }

    const r = this.node.getBoundingClientRect();
    const hover = touch.clientX >= r.x && touch.clientX < r.right && touch.clientY >= r.y && touch.clientY < r.bottom;

    if (hover) {
      // cancel drag-n-drop timeout
      if (this.allow_dnd_timeout != -1) {
        window.clearTimeout(this.allow_dnd_timeout);
        this.allow_dnd_timeout = -1;
      }

      // cancel check-toggle timeout
      if (this.toggle_timeout != -1) {
        window.clearTimeout(this.toggle_timeout);
        this.toggle_timeout = -1;
      }

      //
      if (this.toggle_timestamp < Date.now() - 100) {
        this.short_click(e);
      }
    }
  }

  //
  private touch_cancel(e: TouchEvent): void {
    if (this.touch_start_id == -1) {
      return;
    }
    const touch = Array.from(e.changedTouches).find(t => t.identifier == this.touch_start_id);
    if (!touch) {
      return;
    }
    if (!this.dragged) {
      this.$._dnd.cancel();
    }
    this.touch_start_event = null;
    this.touch_start_id  = -1;
    if (this.dragged) {
      window.setTimeout(() => {
        // tileDND#touchcancel
        this.$._dnd.tileDNDDOM?.dispatchEvent(e);
      }, 0);

      // cancel drag-n-drop timeout
      if (this.allow_dnd_timeout != -1) {
        window.clearTimeout(this.allow_dnd_timeout);
        this.allow_dnd_timeout = -1;
      }
      // cancel check-toggle timeout
      if (this.toggle_timeout != -1) {
        window.clearTimeout(this.toggle_timeout);
        this.toggle_timeout = -1;
      }
      return;
    }
    // e.preventDefault();

    // cancel drag-n-drop timeout
    if (this.allow_dnd_timeout != -1) {
      window.clearTimeout(this.allow_dnd_timeout);
      this.allow_dnd_timeout = -1;
    }

    // cancel check-toggle timeout
    if (this.toggle_timeout != -1) {
      window.clearTimeout(this.toggle_timeout);
      this.toggle_timeout = -1;
    }
  }

  //
  private short_click(e: Event): void {
    if (this.toggle_timeout !== -1) {
      window.clearTimeout(this.toggle_timeout);
      this.toggle_timeout = -1;
    }

    //
    this.$._dnd.cancel();

    // removed? do nothing.
    if (!this.node.parentElement) {
      return;
    }

    // during selection mode a click is a check toggle

    const tile_buttons = this.$._groups.values()
      .map(g =>Array.from(g.tiles.values().map(t => t.dom).filter(btn => !!btn)))
      .reduce((a, b) => a.concat(b), []);

    const selection_mode = tile_buttons.some(btn => btn.getAttribute("data-checked") === "true");
    if (selection_mode) {
      this.toggle_check();
    } else {
      // click
      this.$.dispatchEvent(new CustomEvent("click", {
        detail: { tile: this.id }
      }));
    }

    //
    this.toggle_timestamp = 0;
  }

  //
  private toggle_check(): void {
    // removed? do nothing.
    if (!this.node.parentElement) {
      return;
    }

    // proceed only if checkEnabled=true
    if (!this.$._check_enabled) {
      return;
    }

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
  private context_menu(e: MouseEvent): void {
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
  private get id(): string {
    return this.node.getAttribute("data-id") ?? "";
  }
}