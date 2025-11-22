// third-party
import Draggable from "@hydroperx/draggable";
import getOffset from "getoffset";

// local
import type { BulkChange, Core } from "./Core";
import { CoreGroup, CoreTile } from "./CoreGroup";
import { type SnapResult } from "./layouts/Layout";
import { MAXIMUM_Z_INDEX } from "../utils/Constants";
import { Rectangle } from "../utils/Rectangle";

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

  // original state (in compact form (no DOM, no group labels))
  //
  // NOTE: _original_state is entirely unused for now.
  // kept just in case we decide for changes in the future.
  private _original_state: Map<number, CoreGroup> = new Map();

  // this timeout is used to make drag-n-drop less destructive.
  // on drag move, wait a bit before moving tile/group.
  private _movement_timeout = -1;

  //
  private _movement_timeout_multiplier = 0;

  //
  private _snap: null | SnapResult = null;

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
    this.tileDNDDraggable = null;

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

  //
  public initGroupDraggable(groupId: string, groupNode: HTMLElement): void {
    // destroy previous Draggable
    this.groupDraggable?.[1].destroy();
    this.groupDraggable = null;

    this.groupDraggable = [groupId, new Draggable(groupNode, {
      threshold: "0.5rem",
      cascadingUnit: "rem",
      setPosition: false,
      onDragStart: this._group_drag_start.bind(this),
      onDrag: this._group_drag_move.bind(this),
      onDragEnd: this._group_drag_end.bind(this),
    })];
  }

  // cancels any active drag-n-drop
  public cancel(): void {
    if (this.tileDNDDOM && this._tile_dnd_click_handler) {
      this.tileDNDDOM!.removeEventListener("click", this._tile_dnd_click_handler! as any);
    }
    if (this.dragging && this.tileButton) {
      this.tileButton!.style.visibility = "visible";
    }

    //
    if (this.tileDNDDOM?.children.length !== 0) {
      this.tileDNDDOM?.children[0].removeAttribute("data-dragging");
    }

    // for groups, remove the data-dragging attribute
    const group = this.groupDraggable ?
      this.$._groups.values().find(g => g.id == this.groupDraggable![0]) :
      null;
    group?.dom?.removeAttribute("data-dragging");

    // cancel movement timeout
    if (this._movement_timeout != -1) {
      window.clearTimeout(this._movement_timeout);
      this._movement_timeout = -1;
    }
    this.tileButton = null;
    this.tileId = "";
    // destroy previous Draggable
    this.tileDNDDraggable?.destroy();
    this.tileDNDDraggable = null;
    this.groupDraggable?.[1].destroy();
    this.groupDraggable = null;
    /*
    this.restore();
    */
    // clear state backup
    this._original_state.clear();

    this.dragging = false;
    if (this.tileDNDDOM) {
      this.tileDNDDOM.style.visibility = "hidden";
    }
    this.tileDNDDOM = null;
  }

  /*
  // restore initial layout state before drag-n-drop.
  //
  // for tiles: this should restore state, remove dead dragging tile if the case,
  // re-add any new tiles and groups,
  // and re-arrange later.
  //
  // for groups: this should restore state, remove dead dragging group if the case,
  // re-add any new groups, and re-arrange later.
  //
  // this will also update the `_original_state` variable
  // with the current changes.
  //
  // this might trigger some events.
  private _restore(): void {
    fixme();
  }
  */

  //
  private _tile_drag_start(element: Element, x: number, y:  number, event: Event): void {
    //
    if (this._movement_timeout != -1) {
      window.clearTimeout(this._movement_timeout);
      this._movement_timeout = -1;
    }

    // visibility changes
    this.tileDNDDOM!.style.visibility = "visible";
    this.tileButton!.style.display = "none";

    //
    if (this.tileDNDDOM?.children.length !== 0) {
      this.tileDNDDOM?.children[0].setAttribute("data-dragging", "true");
    }

    // original state
    this._original_state = this.$._clone_state();

    //
    this.dragging = true;

    //
    this._movement_timeout_multiplier = 0.6;

    //
    this.tileDNDDOM!.style.zIndex = MAXIMUM_Z_INDEX;

    // reset snap cache
    this._snap = null;

    // Core#dragStart
    this.$.dispatchEvent(new CustomEvent("dragStart", {
      detail: { id: this.tileId, dnd: this.tileDNDDOM! },
    }));
  }

  //
  private _tile_drag_move(element: Element, x: number, y:  number, event: Event): void {
    // update tile <button> reference as its DOM may have been re-created
    // (typically in response to React.js's rendering)
    this.tileButton = this.$._groups.values()
      .find(g => g.tiles.has(this.tileId))?.tiles.get(this.tileId)?.dom ?? null;

    // visibility changes
    if (this.tileButton) {
      this.tileButton!.style.display = "none";
    }

    // exit if the tile has been removed while dragging.
    if (!(this.tileButton && this.tileButton!.parentElement)) {
      return;
    }

    // track last snap
    const old_snap = this._snap;

    // try snapping to grid now
    this._snap = this.$._layout.snap(this.tileDNDDOM!);

    // if snap resolves successfully to an existing area
    if (!!this._snap && !!this._snap!.group) {
      let threshold_met = true;

      if (old_snap) {
        threshold_met =
          old_snap.group !== this._snap!.group ||
          Math.abs(old_snap!.x - this._snap!.x) >= 1 ||
          Math.abs(old_snap!.y - this._snap!.y) >= 1;

        // revert shifting changes
        /*
        if (threshold_met) {
          this._restore();
        }
        */
      }

      // if threshold is met
      if (threshold_met) {
        // clear movement timeout
        if (this._movement_timeout != -1) {
          window.clearTimeout(this._movement_timeout);
          this._movement_timeout = -1;
        }

        this._movement_timeout = window.setTimeout(() => {
          this._movement_timeout_multiplier = 1;
          const old_group_id = this.tileId;
          const new_group_id = this._snap!.group!;
          if (old_group_id == new_group_id) {
            // move tile
            const bulkChange: BulkChange = {
              movedTiles: [{ id: this.tileId, x: this._snap!.x, y: this._snap!.y }],
              groupTransfers: [],
              groupRemovals: [],
              groupCreation: null,
            };
            this.$.dispatchEvent(new CustomEvent("bulkChange", {
              detail: bulkChange,
            }));
          } else {
            // group transfer
            const bulkChange: BulkChange = {
              movedTiles: [],
              groupTransfers: [{ group: new_group_id, id: this.tileId, x: this._snap!.x, y: this._snap!.y }],
              groupRemovals: [],
              groupCreation: null,
            };
            this.$.dispatchEvent(new CustomEvent("bulkChange", {
              detail: bulkChange,
            }));
          }
        }, 570 * this._movement_timeout_multiplier);
      }
    } else {
      // clear movement timeout
      if (this._movement_timeout != -1) {
        window.clearTimeout(this._movement_timeout);
        this._movement_timeout = -1;
      }
    }

    // trigger Core#dragMove
    this.$.dispatchEvent(new CustomEvent("dragMove", {
      detail: { id: this.tileId, dnd: this.tileDNDDOM! },
    }));
  }

  //
  private _tile_drag_end(element: Element, x: number, y:  number, event: Event): void {
    // update tile <button> reference as its DOM may have been re-created
    // (typically in response to React.js's rendering)
    this.tileButton = this.$._groups.values()
      .find(g => g.tiles.has(this.tileId))?.tiles.get(this.tileId)?.dom ?? null;

    // cancel movement timeout
    if (this._movement_timeout != -1) {
      window.clearTimeout(this._movement_timeout);
      this._movement_timeout = -1;
    }

    // exit if the tile has been removed while dragging.
    if (!(this.tileButton && this.tileButton!.parentElement)) {
      // Core#dragEnd
      this.$.dispatchEvent(new CustomEvent("dragEnd", {
        detail: { id: this.tileId, dnd: this.tileDNDDOM! },
      }));

      // reset some vars
      this.dragging = false;
      this.tileId = "";
      this.tileButton = null;

      return;
    }

    // last grid-snapping may have requested a new group,
    // which is appropriate to create during drag end.
    if (this._snap && !this._snap!.group) {
      // group transfer
      const bulkChange: BulkChange = {
        movedTiles: [],
        groupTransfers: [],
        groupRemovals: [],
        groupCreation: { tile: this.tileId },
      };
      this.$.dispatchEvent(new CustomEvent("bulkChange", {
        detail: bulkChange,
      }));
    }

    this.dragging = false;
    this.tileId = "";
    this._original_state.clear();

    // visibility changes
    this.tileButton!.style.display = "";
    this.tileDNDDOM!.style.visibility = "hidden";

    //
    if (this.tileDNDDOM?.children.length !== 0) {
      this.tileDNDDOM?.children[0].removeAttribute("data-dragging");
    }

    // Core#dragEnd
    this.$.dispatchEvent(new CustomEvent("dragEnd", {
      detail: { id: this.tileId, dnd: this.tileDNDDOM! },
    }));
  }

  //
  private _group_drag_start(element: Element, x: number, y:  number, event: Event): void {
    //
    if (this._movement_timeout != -1) {
      window.clearTimeout(this._movement_timeout);
      this._movement_timeout = -1;
    }

    // backup state
    this._original_state = this.$._clone_state();

    //
    this.dragging = true;

    //
    this._movement_timeout_multiplier = 0.6;

    //
    element.setAttribute("data-dragging", "true");

    //
    (element as HTMLElement).style.zIndex = MAXIMUM_Z_INDEX;

    // Core#groupDragStart
    this.$.dispatchEvent(new CustomEvent("groupDragStart", {
      detail: { id: this.groupDraggable![0], element: element as HTMLDivElement },
    }));
  }

  //
  private _group_drag_move(element: Element, x: number, y:  number, event: Event): void {
    // exit if the group has been removed while dragging.
    if (!element.parentElement) {
      return;
    }

    // check the nearest intersection
    const this_rect = Rectangle.from(getOffset(element as HTMLElement, this.$._container)!);
    let new_index = -1;
    let greater_intersection: null | Rectangle = null;
    for (const [idx,g] of this.$._groups) {
      if (g.id == this.groupDraggable![0] || !g.dom) {
        continue;
      }
      const g_rect = Rectangle.from(getOffset(g.dom!, this.$._container)!);
      const intersection = this_rect.intersection(g_rect);
      if (intersection && (!greater_intersection || intersection.area > greater_intersection!.area)) {
        new_index = idx;
        greater_intersection = intersection;
      }
    }

    // schedule for moving group
    // (although in this case we need to manually
    // reorder groups to act like a splice,
    // later emitting a `reorderGroups` event.)
    if (new_index !== -1) {
      if (this._movement_timeout != -1) {
        window.clearTimeout(this._movement_timeout);
        this._movement_timeout = -1;
      }
      this._movement_timeout = window.setTimeout(() => {
        this._movement_timeout_multiplier = 1;

        let group_pairs = Array.from(this.$._groups.entries());
        group_pairs.sort(([a], [b]) => a - b);
        let groups = group_pairs.map(p => p[1]);
        const old_index = groups.findIndex(g => g.id == this.groupDraggable![0]);
        const this_group = groups[old_index];
        groups.splice(new_index, 0, this_group);
        groups.splice(old_index + (new_index <= old_index ? 1 : 0), 1);
        this.$._groups.clear();
        for (const [i, g] of groups.entries()) {
          this.$._groups.set(i, g);
        }
        // trigger Core#reorderGroups event
        this.$.dispatchEvent(new CustomEvent("reorderGroups", {
          detail: new Map(groups.entries().map(([i, g]) => [i, g.id]))
        }));

        // rearrange
        this.$.rearrange();
      }, 570 * this._movement_timeout_multiplier);
    }

    // Core#groupDragMove
    this.$.dispatchEvent(new CustomEvent("groupDragMove", {
      detail: { id: this.groupDraggable![0], element: element as HTMLDivElement },
    }));
  }

  //
  private _group_drag_end(element: Element, x: number, y:  number, event: Event): void {
    // cancel movement timeout
    if (this._movement_timeout != -1) {
      window.clearTimeout(this._movement_timeout);
      this._movement_timeout = -1;
    }

    //
    (element as HTMLElement).style.zIndex = "";
    (element as HTMLElement).style.inset = "";

    //
    element.removeAttribute("data-dragging");

    // Core#groupDragEnd
    this.$.dispatchEvent(new CustomEvent("groupDragEnd", {
      detail: { id: this.groupDraggable![0], element: element as HTMLDivElement },
    }));

    // reset some vars
    this.dragging = false;
    this.groupDraggable![1].destroy();
    this.groupDraggable = null;
    this._original_state.clear();

    // rearrange
    this.$.rearrange();
  }
}