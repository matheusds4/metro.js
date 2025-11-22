// local
import type { Core, BulkChange } from "./Core";
import { CoreGroup, CoreTile } from "./CoreGroup";
import { SimpleGroup } from "./SimpleGroup";
import * as MathUtils from "../utils/MathUtils";

//
export class GroupPointerHandlers {
  //
  private group_label: HTMLElement;
  //
  private group_label_text: HTMLElement;

  //
  private draggable_ready: boolean = false;
  private dragged: boolean = false;
  private mouse_started: boolean = false;

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
    private readonly node: HTMLDivElement
  ) {
    this.group_label = node.getElementsByClassName(this.$._class_names.groupLabel)[0] as HTMLElement;
    this.group_label_text = this.group_label.getElementsByClassName(this.$._class_names.groupLabelText)[0] as HTMLElement;
  }

  //
  public attach(): void {
    const { group_label } = this;

    // mouse handlers
    group_label.addEventListener("mousedown", this.mouse_down.bind(this));
    group_label.addEventListener("mouseup", this.mouse_up.bind(this));
    group_label.addEventListener("click", this.click.bind(this));

    // touch handlers
    group_label.addEventListener("touchstart", this.touch_start.bind(this));
    group_label.addEventListener("touchmove", this.touch_move.bind(this));
    group_label.addEventListener("touchend", this.touch_end.bind(this));
    group_label.addEventListener("touchcancel", this.touch_cancel.bind(this));

    // context menu handlers
    group_label.addEventListener("contextmenu", this.context_menu.bind(this));
  }

  //
  private mouse_down(e: MouseEvent): void {
    if (this.$._dnd.dragging || e.button != 0 || this.touch_start_id != -1) {
      return;
    }
    this.draggable_ready = false;
    this.mouse_started = true;
    this.dragged = false;

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
      this.$._dnd.initGroupDraggable(this.id, this.node);
      this.draggable_ready = true;
      // group#mousedown
      this.node.dispatchEvent(new MouseEvent("mousedown", {
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
  private mouse_up(e: MouseEvent): void {
    this.discard_window_handlers();
  }

  //
  private click(e: MouseEvent): void {
    this.discard_window_handlers();

    if (!this.mouse_started || this.dragged) {
      return;
    }

    this.short_click(e);
  }

  //
  private touch_start(e: TouchEvent): void {
    if (this.$._dnd.dragging || this.mouse_started) {
      return;
    }
    e.preventDefault();
    this.touch_start_id = e.touches[0].identifier;
    this.enable_touch_dnd = false;
    this.dragged = false;
    this.mouse_started = false;
    this.draggable_ready = false;
    this.touch_start_event = e;

    // timeout to enable drag-n-drop
    this.allow_dnd_timeout = window.setTimeout(() => {
      this.allow_dnd_timeout = -1;
      this.enable_touch_dnd = true;
    }, 700);
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

    //
    if (this.enable_touch_dnd && !this.draggable_ready && this.$._drag_enabled) {
      this.$._dnd.initGroupDraggable(this.id, this.node);
      this.draggable_ready = true;
      // group#touchstart
      this.node.dispatchEvent(this.touch_start_event!);
    }

    //
    if (this.$._dnd.dragging) {
      // if touch continues holding and drag starts, then uncheck tiles
      if (!this.dragged) {
        this.$.uncheckAll();
      }
      this.dragged = true;
    }

    //
    if (this.dragged) {
      // group#touchmove
      this.node.dispatchEvent(e);
    }
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
    this.touch_start_event = null;
    this.touch_start_id  = -1;
    if (this.dragged) {
      // group#touchend
      this.node.dispatchEvent(e);

      // cancel drag-n-drop timeout
      if (this.allow_dnd_timeout != -1) {
        window.clearTimeout(this.allow_dnd_timeout);
        this.allow_dnd_timeout = -1;
      }
      return;
    }
    e.preventDefault();

    const r = this.node.getBoundingClientRect();
    const hover = touch.clientX >= r.x && touch.clientX < r.right && touch.clientY >= r.y && touch.clientY < r.bottom;

    if (hover) {
      // cancel drag-n-drop timeout
      if (this.allow_dnd_timeout != -1) {
        window.clearTimeout(this.allow_dnd_timeout);
        this.allow_dnd_timeout = -1;
      }

      this.short_click(e);
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
    this.touch_start_event = null;
    this.touch_start_id  = -1;
    if (this.dragged) {
      // group#touchcancel
      this.node.dispatchEvent(e);

      // cancel drag-n-drop timeout
      if (this.allow_dnd_timeout != -1) {
        window.clearTimeout(this.allow_dnd_timeout);
        this.allow_dnd_timeout = -1;
      }
      return;
    }
    e.preventDefault();

    // cancel drag-n-drop timeout
    if (this.allow_dnd_timeout != -1) {
      window.clearTimeout(this.allow_dnd_timeout);
      this.allow_dnd_timeout = -1;
    }
  }

  //
  private short_click(e: Event): void {
    // removed? do nothing.
    if (!this.node.parentElement) {
      return;
    }

    // click in a group's label
    this.enter_label_input();
  }

  //
  private enter_label_input(): void {
    if (!this.$._renaming_groups_enabled) {
      return;
    }

    // find group
    const group = this.$._groups.values().find(g => g.id == this.id);
    if (!group) {
      return;
    }

    const inputs = this.group_label.getElementsByClassName(this.$._class_names.groupLabelInput);
    let input = (inputs.length === 0 ? null : inputs[0]) as null | HTMLInputElement
    if (!input) {
      input = document.createElement("input");
      input.type = "text";
      this.group_label.appendChild(input);
    }

    // style settings
    if (!input!.classList.contains(this.$._class_names.groupLabelInput)) {
      input!.classList.add(this.$._class_names.groupLabelInput);
    }
    input!.style.position = "absolute";
    input!.style.left = "0";
    input!.style.right = "0";
    input!.style.top = "0";
    input!.style.bottom = "0";
    input!.dirName = this.$._rtl ? "rtl" : "ltr";
    this.group_label_text.style.visibility = "hidden";

    // initial value
    input!.value = group.label;

    // focus
    input!.focus();
  }

  //
  private context_menu(e: MouseEvent): void {
    this.$.dispatchEvent(new CustomEvent("groupContextMenu", {
      detail: {
        group: this.id,
        clientX: e.clientX,
        clientY: e.clientY,
        original: e,
      },
    }));
  }

  //
  private get id(): string {
    return this.node.getAttribute("data-id") ?? "";
  }
}