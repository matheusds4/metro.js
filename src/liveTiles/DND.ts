// third-party
import Draggable from "@hydroperx/draggable";

// local
import type { Core } from "./Core";
import { CoreGroup, CoreTile } from "./CoreGroup";

/**
 * Drag-n-drop implementation.
 */
export class DND {
  // dragging something? (whether a tile or whole group.)
  public dragging: boolean = false;

  // TileDND is a direct child of the Core's container.
  public tileDNDDOM: null | HTMLElement = null;

  // used for propagating click to the true tile <button>
  private _tile_dnd_click_handler: null | Function = null;

  // original state (in compact form)
  private _original_state: Map<number, CoreGroup> = new Map();

  //
  public tileButton: null | HTMLButtonElement = null;

  // tile actively dragging
  public tileId: string = "";

  //
  public tileDNDDraggable: null | Draggable = null;

  // unique group Draggable `[groupId, draggable]`
  public groupDraggable: null | [string, Draggable] = null;

  //
  public constructor(private readonly $: Core) {
    //
  }

  //
  public initTileDNDDraggable(): void {
    if (this.tileDNDDOM && this._tile_dnd_click_handler) {
      this.tileDNDDOM!.removeEventListener("click", this._tile_dnd_click_handler! as any);
    }
    // destroy previous Draggable
    this.tileDNDDraggable?.destroy();

    // find DND element and build Draggable up
    const dnd_dom_list = this.$._container.getElementsByClassName(this.$._class_names.tileDND);
    this.tileDNDDOM = dnd_dom_list.length == 0 ? null : dnd_dom_list[0] as HTMLElement;
    if (this.tileDNDDOM) {
      this.tileDNDDOM!.style.visibility = "visible";
      this.tileDNDDraggable = new Draggable(this.tileDNDDOM!, {
        threshold: "0.7rem",
        cascadingUnit: "rem",
        setPosition: false,
        onDragStart: this._tile_drag_start.bind(this),
        onDrag: this._tile_drag_move.bind(this),
        onDragEnd: this._tile_drag_end.bind(this),
      });

      // propagate click
      this._tile_dnd_click_handler = (e: MouseEvent) => {
        this.tileButton?.click();
        this.cancel();
      };
      this.tileDNDDOM!.addEventListener("click", this._tile_dnd_click_handler! as any);
    }
  }

  // cancels any active drag-n-drop
  public cancel(): void {
    if (this.tileDNDDOM && this._tile_dnd_click_handler) {
      this.tileDNDDOM!.removeEventListener("click", this._tile_dnd_click_handler! as any);
    }
    if (this.dragging && this.tileButton) {
      this.tileButton!.style.visibility = "visible";
    }
    this.tileButton = null;
    this.tileId = "";
    // destroy previous Draggable
    this.tileDNDDraggable?.destroy();
    this.tileDNDDraggable = null;
    this.groupDraggable?.[1].destroy();
    this.groupDraggable = null;

    this._restore();
    this.dragging = false;
    if (this.tileDNDDOM) {
      this.tileDNDDOM.style.visibility = "hidden";
    }
    this.tileDNDDOM = null;
  }

  // restore initial layout state before drag-n-drop.
  //
  // for tiles: this should restore state, remove dead dragging tile if the case,
  // re-add any new tiles and groups,
  // and re-arrange later.
  //
  // for groups: this should restore state, remove dead dragging group if the case,
  // re-add any new groups, and re-arrange later.
  //
  // this might trigger some events.
  private _restore(): void {
    fixme();
  }
}