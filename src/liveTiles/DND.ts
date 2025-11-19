// third-party
import Draggable from "@hydroperx/draggable";

// local
import type { Core } from "./Core";

/**
 * Drag-n-drop implementation.
 */
export class DND {
  // TileDND is a direct child of the Core's container.
  public tileDNDDraggable: null | Draggable = null;

  // unique group Draggable `[groupId, draggable]`
  public groupDraggable: null | [string, Draggable] = null;

  //
  public constructor() {
    //
  }
}