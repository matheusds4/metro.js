// third-party
import { gsap } from "gsap/gsap-core";

// local
import type { BulkChange, Core, CoreGroup, CoreTile } from "../Core";
import { SimpleTile } from "../SimpleGroup";

// layout
export abstract class Layout {
  //
  public constructor(public readonly $: Core) {
    //
  }

  /**
   * Rearranges everything.
   */
  public abstract rearrange(): void;

  /**
   * Snaps location to grid.
   */
  public abstract snap(tileDND: HTMLElement): null | SnapResult;

  /**
   * Rearranges a group.
   */
  protected rearrangeGroup(group: CoreGroup): void {
    // move tiles and update the group's width/height REM together

    let movedTiles: { id: string, x: number, y: number }[] = [];
    let
      tile_list_width_rem: number = 0,
      tile_list_height_rem: number = 0;
    if (this.$._dir == "vertical") {
      tile_list_width_rem =
        this.$._group_width*this.$._size_1x1 +
        (this.$._group_width-1)*this.$._tile_gap;
    } else {
      tile_list_height_rem =
        this.$._group_height*this.$._size_1x1 +
        (this.$._group_height-1)*this.$._tile_gap;
    }

    // list of tiles to submit to tween later.
    const to_tween_y_late: {
      tile: { id: string, simple: SimpleTile, core: CoreTile },
      button: HTMLButtonElement,
      heightREM: number,
      yREM: number
    }[] = [];

    // group tile-list div
    const group_tiles_div = group.dom ? group.dom!.getElementsByClassName(this.$._class_names.groupTiles)[0] as HTMLElement : null;

    for (const [tileId, tile] of group.tiles) {
      const pos = group.tilePosition(tileId);
      const simple = group.simple.tiles.get(tileId)!;
      const { width, height } = simple;
      const x_rem = pos.x * this.$._size_1x1 + pos.x * this.$._tile_gap;
      const y_rem = pos.y * this.$._size_1x1 + pos.y * this.$._tile_gap;

      const w_rem = width*this.$._size_1x1 + (width-1)*this.$._tile_gap;
      const h_rem = height*this.$._size_1x1 + (height-1)*this.$._tile_gap;

      // change tile-list size REM
      tile_list_width_rem = Math.max(x_rem + w_rem, tile_list_width_rem);
      tile_list_height_rem = Math.max(y_rem + h_rem, tile_list_height_rem);

      // assign physical X/Y
      const
        old_x = parseInt(tile.dom?.getAttribute("data-x") ?? pos.x.toString()),
        old_y = parseInt(tile.dom?.getAttribute("data-y") ?? pos.y.toString());
      tile.dom?.setAttribute("data-x", pos.x.toString());
      tile.dom?.setAttribute("data-y", pos.y.toString());

      // state change
      if (!(old_x == pos.x && old_y == pos.y)) {
        movedTiles.push({ id: tileId, x: pos.x, y: pos.y });
      }

      // affect button
      if (tile.dom) {
        if (tile.tween) {
          tile.tween!.kill();
          tile.tween = null;
        }
        if (old_x == pos.x && old_y == pos.y) {
          tile.dom!.style.transform = `translateX(${x_rem}rem) translateY(${y_rem}rem)`;
        // change only Y
        } else if (old_x != pos.x && old_y != pos.y) {
          tile.dom!.style.transform = `translateX(${x_rem}rem) translateY(-1000rem)`;
          to_tween_y_late.push({ tile: { id: tileId, core: tile, simple }, button: tile.dom!, heightREM: h_rem, yREM: y_rem });
        // change either only X or only Y
        } else {
          const tween = gsap.to(tile.dom!, {
            x: x_rem + "rem",
            y: y_rem + "rem",
            duration: 0.18
          });
          tile.tween = tween;
          tween!.then(() => {
            const i = this.$._tile_tweens.indexOf(tween);
            if (i != -1) {
              this.$._tile_tweens.splice(i, 1);
            }
            if (this.$._tile_tweens.length == 0) {
              group_tiles_div!.style.overflow = "";
            }
          });
          group_tiles_div!.style.overflow = "hidden";
          this.$._tile_tweens.push(tween);
        }
      }
    }

    // tween Y from off view
    const middle = tile_list_height_rem / 2;
    for (const { tile, button, heightREM, yREM } of to_tween_y_late) {
      const tween = gsap.fromTo(tile.core.dom!,
        {
          y: (yREM + heightREM / 2 < middle ? -heightREM : tile_list_height_rem + heightREM) + "rem",
        },
        {
          y: yREM + "rem",
          duration: 0.18
        }
      );
      tile.core.tween = tween;
      tween!.then(() => {
        const i = this.$._tile_tweens.indexOf(tween);
        if (i != -1) {
          this.$._tile_tweens.splice(i, 1);
        }
        if (this.$._tile_tweens.length == 0) {
          group_tiles_div!.style.overflow = "";
        }
      });
      group_tiles_div!.style.overflow = "hidden";
      this.$._tile_tweens.push(tween);
    }

    // resize groupTiles div
    if (group_tiles_div) {
      let min_w = 0;
      if (this.$._dir == "horizontal") {
        min_w = 18;
      }
      group_tiles_div!.style.width = Math.max(min_w, tile_list_width_rem) + "rem";
      group_tiles_div!.style.height = tile_list_height_rem + "rem";
    }

    // bulkChange event (moved tiles only)
    if (movedTiles.length != 0) {
      const bulkChange: BulkChange = {
        movedTiles,
        groupTransfers: [],
        groupRemovals: [],
        groupCreation: null,
      };
      this.$.dispatchEvent(new CustomEvent("bulkChange", {
        detail: bulkChange,
      }));
    }
  }
}

/**
 * Grid snap result.
 */
export type SnapResult = {
  /**
   * Group ID.
   *
   * If none, requests a new group.
   */
  group?: string,
  /**
   * X-coordinate in 1x1 tiles.
   */
  x: number,
  /**
   * Y-coordinate in 1x1 tiles.
   */
  y: number,
};