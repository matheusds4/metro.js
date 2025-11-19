// third-party
import assert from "assert";

// local
import type { Core, BulkChange } from "./Core";
import { CoreGroup, CoreTile } from "./CoreGroup";
import { SimpleGroup } from "./SimpleGroup";
import { TileSize, getWidth, getHeight, sizeNumbersToVariant } from "./TileSize";

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
      resizedTiles: [],
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
    const id = node.getAttribute("data-id") ?? "";
    const new_x = parseInt(node.getAttribute("data-x") || "-1");
    const new_y = parseInt(node.getAttribute("data-y") || "-1");
    const new_size = node.getAttribute("data-size") as TileSize;

    // in a group?
    if (node.parentElement?.classList.contains(this.$._class_names.groupTiles)) {
      const group_id = node.parentElement!.getAttribute("data-id") ?? "";

      // initialize group
      let new_group = this.$._groups.find(g => g.id == group_id);
      if (!new_group) {
        const group_dom = node.parentElement!.parentElement! as HTMLDivElement;
        const simple = new SimpleGroup({
          width: this.$._dir == "vertical" ? this.$._group_width : undefined,
          height: this.$._dir == "horizontal" ? this.$._group_height : undefined,
        });
        new_group = new CoreGroup({
          dom: group_dom,
          id: group_id,
          label: group_dom.getAttribute("data-label") ?? "",
          simple,
        });
      }

      // find maybe old group
      const maybe_old_group = this.$._groups.find(g => g.tiles.has(id));
      let tile = maybe_old_group?.tiles.get(id);

      // first iteration? (e.g. about to add tile to group?)
      const tile_first_iteration = !tile;

      // attach pointer handlers (if not already attached)
      //
      // `CoreTile.attachedHandlers` (compare element)
      if (tile ? tile.attachedHandlers !== node : true) {
        fixme();
      }

      // initialize tile
      if (!tile) {
        tile = new CoreTile({ dom: node });
      }
      tile!.attachedHandlers = node;
      tile!.dom = node;

      // transfer group?
      const is_group_transfer = !!maybe_old_group && maybe_old_group! !== new_group!;

      // on tile's first iteration (add), or
      // on group transfer, we've identical code.
      if (tile_first_iteration || is_group_transfer) {
        // remove tile from old group
        if (is_group_transfer) {
          maybe_old_group!.simple.removeTile(id);
          maybe_old_group!.tiles.delete(id);

          // remove previous group if empty.
          if (maybe_old_group!.tiles.size == 0 && !!maybe_old_group.dom) {
            bulkChange.groupRemovals.push({ id: maybe_old_group.id });
          }
        }

        // add to new group (handle -1 x, y too)
        new_group.tiles.set(id, tile!);
        if (new_group.simple.addTile(
          id,
          (new_x == -1 || new_y == -1) ? null : new_x,
          (new_x == -1 || new_y == -1) ? null : new_y,
          getWidth(new_size),
          getHeight(new_size)
        )) {
          const simple = new_group.simple.tiles.get(id)!;
          // if final (x, y) diverges from the user-specified,
          // then signal them.
          if (simple.x != new_x || simple.y != new_y) {
            bulkChange.movedTiles.push({ id, x: simple.x, y: simple.y });
          }
        } else {
          // use best last position if failed to shift conflicting
          // tiles, and signal change.
          new_group.simple.addTile(id, null, null, getWidth(new_size), getHeight(new_size));
          const simple = new_group.simple.tiles.get(id)!;
          bulkChange.movedTiles.push({ id, x: simple.x, y: simple.y });
        }

        return true;
      }

      //
      let changed = false;

      //
      let simple = new_group!.simple.tiles.get(id)!;

      // move X/Y
      if (new_x != simple.x || new_y != simple.y) {
        // use best last position
        if (new_x == -1 || new_y == -1) {
          new_group!.simple.removeTile(id);
          new_group!.simple.addTile(id, null, null, getWidth(new_size), getHeight(new_size));
          const final = new_group.simple.tiles.get(id)!;
          // signal new (x, y)
          bulkChange.movedTiles.push({ id, x: final.x, y: final.y });
        // move to specified (x, y) if not (-1, -1)
        } else if (new_group!.simple.moveTile(id, new_x, new_y)) {
          const final = new_group.simple.tiles.get(id)!;
          // if final (x, y) diverges from the user-specified,
          // then signal them.
          if (final.x != new_x || final.y != new_y) {
            bulkChange.movedTiles.push({ id, x: final.x, y: final.y });
          }
        } else {
          // fail? then move back to previous position.
          bulkChange.movedTiles.push({ id, x: simple.x, y: simple.y });
        }

        //
        changed = true;
      }

      //
      simple = new_group!.simple.tiles.get(id)!;

      // resize?
      if (getWidth(new_size) != simple.width || getHeight(new_size) != simple.height) {
        if (!new_group!.simple.resizeTile(id, getWidth(new_size), getHeight(new_size))) {
          // fail? then put previous size back.
          const old_size = sizeNumbersToVariant(simple.width, simple.height);
          bulkChange.resizedTiles.push({ id, size: old_size });
        }

        //
        changed = true;
      }

      return changed;
    }

    // tileDND? ignore.
    if (node.parentElement?.classList.contains(this.$._class_names.tileDND)) {
      return false;
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
  private _detect_group(group_dom: HTMLDivElement, bulkChange: BulkChange): boolean {
    const group_id = group_dom.getAttribute("data-id")!;
    const new_index = parseInt(group_dom.getAttribute("data-index") || "-1");
    const new_label = group_dom.getAttribute("data-label") ?? "";

    // remove group if it has no parent
    if (!group_dom.parentElement) {
      const i = this.$._groups.findIndex(g => g.id == group_id);
      if (i == -1) {
        return false;
      }
      this.$._groups.splice(i, 1);
      if (this.$._dnd.groupDraggable?.[0] == group_id) {
        this.$._dnd.groupDraggable![1].destroy();
        this.$._dnd.groupDraggable = null;
      }
      return true;
    }

    // initialize group
    let group = this.$._groups.find(g => g.id == group_id);
    if (!group) {
      const simple = new SimpleGroup({
        width: this.$._dir == "vertical" ? this.$._group_width : undefined,
        height: this.$._dir == "horizontal" ? this.$._group_height : undefined,
      });
      group = new CoreGroup({
        dom: group_dom,
        id: group_id,
        label: group_dom.getAttribute("data-label") ?? "",
        simple,
      });
    }

    // attach pointer handlers (if not already attached)
    //
    // `CoreGroup.attachedHandlers` (compare element)
    fixme();

    // note: if group to add has -1 index then change it to the last
    // position and dispatch the `moveGroup` event.

    fixme();
  }
}