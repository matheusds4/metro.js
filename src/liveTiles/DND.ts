// third-party
import Draggable from "@hydroperx/draggable";

// local
import type { Core } from "./Core";

/**
 * Drag-n-drop implementation.
 */
export class DND {
  // dragging something? (whether a tile or whole group.)
  public dragging: boolean = false;

  // TileDND is a direct child of the Core's container.
  public tileDNDDOM: null | HTMLElement = null;

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
    // destroy previous Draggable
    this.tileDNDDraggable?.destroy();

    // find DND element and build Draggable up
    const dnd_dom_list = this.$._container.getElementsByClassName(this.$._class_names.tileDND);
    this.tileDNDDOM = dnd_dom_list.length == 0 ? null : dnd_dom_list[0] as HTMLElement;
    if (this.tileDNDDOM) {
      this.tileDNDDraggable = new Draggable();
    }
  }
}