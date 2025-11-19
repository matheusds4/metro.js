// local
import type { Core, BulkChange, concatBulkChanges } from "./Core";
import { TileSize } from "./TileSize";

// node detection for groups and tiles
export class Detection {
  //
  private _timeout: number = - 1;
  //
  private _queue: HTMLElement[] = [];

  //
  public constructor(private readonly $: Core) {
    //
  }

  //
  public detect(node: HTMLElement): void {
    if (this._timeout != -1) {
      window.clearTimeout(this._timeout);
    }
    this._queue.push(node);
    this._timeout = window.setTimeout(() => {
      this._detect_now();
    }, 5);
  }

  //
  private _detect_now(): void {
    let any_changes = false;
    let bulk_change: BulkChange = {
      movedTiles: [],
      groupTransfers: [],
      groupRemovals: [],
      groupCreation: null,
    };
    while (this._queue.length != 0) {
      const node = this._queue.shift()!;
      if (node.classList.contains(this.$._class_names.tile)) {
        const this_changed = this._detect_tile(node as HTMLButtonElement, bulk_change);
        any_changes ||= this_changed;
      } else if (node.classList.contains(this.$._class_names.group)) {
        const this_changed = this._detect_group(node as HTMLDivElement, bulk_change);
        any_changes ||= this_changed;
      }
    }
    if (any_changes) {
      this.$.dispatchEvent(new CustomEvent("bulkChange", {
        detail: bulk_change,
      }));
      this.$.rearrange();
    }
  }

  // detect tile.
  //
  // return false if there were no changes detected.
  private _detect_tile(node: HTMLButtonElement, bulkChange: BulkChange): boolean {
    const id = node.getAttribute("data-id")!;
    const new_x = parseInt(node.getAttribute("data-x") || "-1");
    const new_y = parseInt(node.getAttribute("data-y") || "-1");
    const new_size = node.getAttribute("data-size") as TileSize;

    // in a group?
    if (node.parentElement?.classList.contains(this.$._class_names.groupTiles)) {
      // attach pointer handlers (if not already attached)
      fixme();

      //
      let changed = false;

      // transfer group?
      fixme();

      // add to group?
      //
      // - if x & y = -1, then contribute a movedTile
      //   in the bulkChange for the best last position.
      fixme();

      // move X/Y
      fixme();

      // resize?
      fixme();

      return changed;
    }

    // if not, remove tile.
    const group = this.$._groups.find(g => g.tiles.has(id));
    if (!group) {
      return false;
    }
    group!.simple.removeTile(id);
    group!.tiles.delete(id);
    if (group!.tiles.size == 0 && !!group.dom) {
      // request group deletion if empty.
      bulkChange.groupRemovals.push({ id: group.id });
    }
    return true;
  }

  // detect group.
  //
  // return false if there were no changes detected.
  private _detect_group(node: HTMLDivElement, bulkChange: BulkChange): boolean {
    const id = node.getAttribute("data-id")!;
    const new_index = parseInt(node.getAttribute("data-index") || "-1");
    const new_label = node.getAttribute("data-label") ?? "";

    // remove group if it has no parent
    if (!node.parentElement) {
      const i = this.$._groups.findIndex(g => g.id == id);
      if (i == -1) {
        return false;
      }
      this.$._groups.splice(i, 1);
      if (this.$._dnd.groupDraggable?.[0] == id) {
        this.$._dnd.groupDraggable![1].destroy();
        this.$._dnd.groupDraggable = null;
      }
      return true;
    }

    // note: if group to add has -1 index then change it to the last
    // position and dispatch the `moveGroup` event.

    fixme();
  }
}