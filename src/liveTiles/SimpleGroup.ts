// third-party
import assert from "assert";

// local
import * as MathUtils from "../utils/MathUtils";

/**
 * A tile in the `SimpleGroup` class.
 */
export class SimpleTile {
  /**
   * @param x X coordinate in small tiles unit (1x1).
   * @param y Y coordinate in small tiles unit (1x1).
   * @param width Width in small tiles unit (1x1).
   * @param height Height in small tiles unit (1x1).
   */
  public constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number
  ) {}

  get left() {
    return this.x;
  }

  get top() {
    return this.y;
  }

  get right() {
    return this.x + this.width;
  }

  get bottom() {
    return this.y + this.height;
  }

  /**
   * Checks whether two tiles intersect.
   */
  public intersects(other: SimpleTile): boolean {
    return !(
      this.x + this.width <= other.x ||
      this.x >= other.x + other.width ||
      this.y + this.height <= other.y ||
      this.y >= other.y + other.height
    );
  }

  public intersection(other: SimpleTile): null | SimpleTile {
    const { x: ax1, y: ay1 } = this;
    const ax2 = this.x + this.width;
    const ay2 = this.y + this.height;
    const { x: bx1, y: by1 } = other;
    const bx2 = other.x + other.width;
    const by2 = other.y + other.height;

    const ix1 = Math.max(ax1, bx1);
    const iy1 = Math.max(ay1, by1);
    const ix2 = Math.min(ax2, bx2);
    const iy2 = Math.min(ay2, by2);

    if (ix1 < ix2 && iy1 < iy2) {
      return new SimpleTile(ix1, iy1, ix2 - ix1, iy2 - iy1);
    }
    return null;
  }
  
  /**
   * Determines what side of `other` this tile intersects with.
   */
  public intersectsSideOf(other: SimpleTile): null | IntersectionSide {
    // based on ChatGPT

    const intersection = this.intersection(other);
    if (!intersection) {
      return null;
    }

    // compute overlap depths
    const overlap_x = intersection!.width;
    const overlap_y = intersection!.height;

    if (overlap_x < overlap_y) {
      // horizontal penetration is smaller → collision is Left/Right
      let from_left  = Math.abs(this.right - other.left);
      let from_right = Math.abs(other.right - this.left);

      if (from_left < from_right) {
        return "left";
      } else {
        return "right";
      }
    } else {
      // vertical penetration is smaller → collision is Top/Bottom
      let from_top    = Math.abs(this.bottom - other.top);
      let from_bottom = Math.abs(other.bottom - this.top);

      if (from_top < from_bottom) {
        return "top";
      } else {
        return "bottom";
      }
    }
  }

  /**
   * Checks whether this tile is more above `other`.
   */
  public isMoreAbove(other: SimpleTile): boolean {
    const aCenterY = this.y + this.height / 2;
    const bCenterY = other.y + other.height / 2;

    return aCenterY < bCenterY;
  }

  /**
   * Checks whether this tile is more below `other`.
   */
  public isMoreBelow(other: SimpleTile): boolean {
    return other.isMoreAbove(this);
  }

  /**
   * Checks whether this tile is more left to `other`.
   */
  public isMoreLeft(other: SimpleTile): boolean {
    const aCenterX = this.x + this.width / 2;
    const bCenterX = other.x + other.width / 2;

    return aCenterX < bCenterX;
  }

  /**
   * Checks whether this tile is more right to `other`.
   */
  public isMoreRight(other: SimpleTile): boolean {
    return other.isMoreLeft(this);
  }

  /**
   * Clones tile data.
   */
  public clone(): SimpleTile {
    return new SimpleTile(this.x, this.y, this.width, this.height);
  }
}

/**
 * The side where a tile intersects with another.
 */
export type IntersectionSide =
  | "top"
  | "bottom"
  | "left"
  | "right";

/**
 * A layout mimmicking the Windows 8 or 10's live tile layout,
 * representing a group's rectangle.
 *
 * Tiles have a minimum position of (0, 0), and the maximum
 * position is either infinite, or:
 * 
 * - If `width` is given in the constructor, maximum X = `width`.
 * - If `height` is given in the constructor, maximum Y = `height`.
 */
export class SimpleGroup {
  /**
   * Tile data.
   */
  public tiles: Map<string, SimpleTile> = new Map();

  /**
   * Maximum width.
   */
  private maxWidth?: number;

  /**
   * Maximum height.
   */
  private maxHeight?: number;

  /**
   * A `SimpleGroup` is horizontal if there is a set height.
   */
  public get isHorizontal() {
    return this.maxHeight !== undefined;
  }

  /**
   * A `SimpleGroup` is vertical if there is a set width.
   */
  public get isVertical() {
    return this.maxWidth !== undefined;
  }

  /**
   * Constructor. Must specify one of `width` and `height`.
   * 
   * - A `width` limits how far tiles can go horizontally.
   *   If specified, must be at least 4.
   * - A `height` limits how far tiles can go vertically.
   *   If specified, must be at least 4.
   */
  public constructor({ width, height }: { width?: number; height?: number }) {
    assert(!(width === undefined && height === undefined), "One of width and height must be specified.");
    assert(!(width !== undefined && height !== undefined), "Width and height are mutually-exclusive.");
    this.maxWidth = width;
    this.maxHeight = height;
    assert(this.maxWidth === undefined || this.maxWidth >= 4, "Width must be >= 4 if specified.");
    assert(this.maxHeight === undefined || this.maxHeight >= 4, "Height must be >= 4 if specified.");
  }

  /**
   * Clones the `SimpleGroup`.
   */
  public clone() {
    const r = new SimpleGroup({
      width: this.maxWidth,
      height: this.maxHeight,
    });
    r.tiles = new Map(Array.from(this.tiles.entries())
      .map(([id, tile]) => [id, tile.clone()]));
    return r;
  }

  /**
   * Returns whether a specific tile exists.
   */
  public hasTile(id: string): boolean {
    return this.tiles.has(id);
  }

  /**
   * Returns the size of the layout in small tile units (1x1),
   * counting maximum width and maximum height.
   */
  public getLayoutSize(): { width: number; height: number } {
    let maxX = this.maxWidth ?? 0;
    let maxY = this.maxHeight ?? 0;
    for (const tile of this.tiles.values()) {
      maxX = Math.max(maxX, tile.x + tile.width);
      maxY = Math.max(maxY, tile.y + tile.height);
    }
    return { width: maxX, height: maxY };
  }

  /**
   * Attempts to add a tile, shifting any overlapping tiles as needed.
   *
   * If `x` and `y` are given as `null`, then this method always succeeds,
   * as the tile will be added into the best last position.
   * 
   * @param x X coordinate in small tiles unit (1x1), or `null`.
   * @param y Y coordinate in small tiles unit (1x1), or `null`.
   * @throws An `Error` if either x or y are null, but not both are null.
   * @returns `true` if there was no unsolvable conflict, and `false` otherwise.
   */
  public addTile(id: string, x: number | null, y: number | null, width: number, height: number): boolean {
    assert(!this.tiles.has(id), `Tile ${id} already exists.`);
    assert(!((x === null || y === null) && (x !== null || y !== null)), "If any of (x,y) are null, then both must be null.");
    // if both (x, y) are specified, add tile and shift
    // as needed.
    if (x !== null && y !== null) {
      const snapshot = this.snapshot();
      const tile = new SimpleTile(x!, y!, width, height);
      this.tiles.set(id, tile);
      this.fit(tile, id);

      // leave no holes
      let [horizontal_hole, vertical_hole] = this.findHoles(x!, y!, width, height);
      tile.x -= horizontal_hole;
      tile.y -= vertical_hole;
      [horizontal_hole, vertical_hole] = this.findHoles(x!, y!, width, height);
      tile.x -= horizontal_hole;
      tile.y -= vertical_hole;

      if (this.resolveConflicts(id)) {
        return true;
      }
      this.restoreSnapshot(snapshot);
      return false;
    // if `x` and `y` are `null`, the tile is positioned at the best *last* position.
    } else {
      let [x, y] = this.findBestLastPosition(width, height);
      // if the resulting (x,y) leave holes between other tile clusters,
      // then snap the resulting (x,y) so there is no hole between other tiles
      // (e.g. ensure they are contiguous).
      let [horizontal_hole, vertical_hole] = this.findHoles(x, y, width, height);
      x -= horizontal_hole;
      y -= vertical_hole;
      [horizontal_hole, vertical_hole] = this.findHoles(x, y, width, height);
      x -= horizontal_hole;
      y -= vertical_hole;
      // contribute tile.
      this.tiles.set(id, new SimpleTile(x!, y!, width, height));
    }
    return true;
  }

  /**
   * Attempts to move a tile, shifting overlapping tiles as needed.
   *
   * @param x X coordinate in small tiles unit (1x1).
   * @param y Y coordinate in small tiles unit (1x1).
   * @returns `true` if there was no unsolvable conflict, and `false` otherwise.
   */
  public moveTile(id: string, x: number, y: number): boolean {
    const tile = this.tiles.get(id);
    assert(!!tile, "Tile '" + id + "' not found.");
    const snapshot = this.snapshot();
    // equal? then do nothing.
    if (tile!.x == x && tile!.y == y) {
      return true;
    }
    tile!.x = x;
    tile!.y = y;
    
    // leave no holes
    let [horizontal_hole, vertical_hole] = this.findHoles(x, y, tile.width, tile.height);
    tile.x -= horizontal_hole;
    tile.y -= vertical_hole;
    [horizontal_hole, vertical_hole] = this.findHoles(x, y, tile.width, tile.height);
    tile.x -= horizontal_hole;
    tile.y -= vertical_hole;

    if (this.resolveConflicts(id)) {
      return true;
    }

    this.restoreSnapshot(snapshot);
    return false;
  }

  /**
   * Attempts to resize a tile, shifting overlapping tiles as needed.
   *
   * @returns `true` if there was no unsolvable conflict, and `false` otherwise.
   */
  public resizeTile(id: string, width: number, height: number): boolean {
    const tile = this.tiles.get(id);
    assert(!!tile, "Tile '" + id + "' not found.");
    const snapshot = this.snapshot();
    // equal? then do nothing.
    if (tile!.width == width && tile!.height == height) {
      return true;
    }
    tile!.width = width;
    tile!.height = height;
    if (this.resolveConflicts(id)) {
      return true;
    }
    this.restoreSnapshot(snapshot);
    return false;
  }

  /**
   * Removes a tile.
   */
  public removeTile(id: string): void {
    const tile = this.tiles.get(id);
    assert(!!tile, "Tile '" + id + "' not found.");
    this.tiles.delete(id);

    // leave no holes
    for (;;) {
      let found = false;
      for (const [, other] of this.tiles) {
        let [horizontal_hole, vertical_hole] = this.findHoles(other.x, other.y, other.width, other.height);
        tile.x -= horizontal_hole;
        tile.y -= vertical_hole;
        if (horizontal_hole > 0 || vertical_hole > 0) {
          found = true;
        }
        [horizontal_hole, vertical_hole] = this.findHoles(other.x, other.y, other.width, other.height);
        tile.x -= horizontal_hole;
        tile.y -= vertical_hole;
        if (horizontal_hole > 0 || vertical_hole > 0) {
          found = true;
        }
      }
      if (!found) {
        break;
      }
    }
  }

  /**
   * Clears everything.
   */
  public clear(): void {
    this.tiles.clear();
  }

  // returns intersecting tiles
  private getIntersectingTiles(tile: SimpleTile, excludeId: string): string[] {
    const result: string[] = [];
    for (const [id, other] of this.tiles.entries()) {
      if (id !== excludeId && tile.intersects(other)) {
        result.push(id);
      }
    }
    return result;
  }

  // finds best last position for a tile.
  private findBestLastPosition(width: number, height: number): [number, number] {
    let testTile = new SimpleTile(0, 0, width, height);
    if (this.isHorizontal) {
      const layout_height = this.maxHeight!;
      for (let x = 0;; x++) {
        testTile.x = x;
        for (let y = 0; y < layout_height; y++) {
          testTile.y = y;
          if (this.getIntersectingTiles(testTile, "").length === 0) {
            return [x, y];
          }
        }
      }
    } else {
      const layout_width = this.maxWidth!;
      for (let y = 0;; y++) {
        testTile.y = y;
        for (let x = 0; x < layout_width; x++) {
          testTile.x = x;
          if (this.getIntersectingTiles(testTile, "").length === 0) {
            return [x, y];
          }
        }
      }
    }
  }

  // find holes (horizontal, vertical) between
  // a given position and tile clusters.
  private findHoles(x: number, y: number, width: number, height: number): [number, number] {
    let testTile = new SimpleTile(x, y, 1, height);
    let horizontal_holes = 0;
    let vertical_holes = 0;
    for (let dec_x = x; dec_x > 0;) {
      testTile.x = --dec_x;
      if (this.getIntersectingTiles(testTile, "").length === 0) {
        horizontal_holes++;
      } else {
        break;
      }
    }
    testTile.width = width;
    testTile.height = 1;
    testTile.x = x;
    for (let dec_y = y; dec_y > 0;) {
      testTile.y = --dec_y;
      if (this.getIntersectingTiles(testTile, "").length === 0) {
        vertical_holes++;
      } else {
        break;
      }
    }

    // exclude one axis of the holes as
    // decreasing both may lead to a conflict.
    if (horizontal_holes > vertical_holes) {
      return [horizontal_holes, 0];
    } else {
      return [0, vertical_holes];
    }
  }

  // in case a tile overflows the container, change its position
  // so it fits the container.
  //
  // this is, perhaps, a bit useful when switching from horizontal to vertical
  // and vice-versa.
  private fit(tile: SimpleTile, id: string): void {
    let horz_overflow = this.isVertical ? (tile.x + tile.width) - this.maxWidth! : 0;
    let vert_overflow = this.isHorizontal ? (tile.y + tile.height) - this.maxHeight! : 0;
    if (horz_overflow <= 0 && vert_overflow <= 0) {
      // no overflow: exit
      return;
    }

    // walk the overflowing position

    // for horizontal overflow (in a vertical container) = go row-by-row (up-down);
    //   for each row, move by the count of overflowing columns
    if (horz_overflow > 0) {
      horz_overflow -= tile.width;
      const max_width = this.maxWidth!;
      for (tile.y++; /*Infinity*/; tile.y++) {
        tile.x = MathUtils.clamp(horz_overflow, 0, max_width - tile.width);
        // const remainder = horz_overflow - tile.x;
        horz_overflow -= tile.x;
        // horz_overflow += remainder;
        if (horz_overflow <= 0) {
          break;
        }
      }

      // skip conflicting tiles without shifting them
      a: for (;; tile.x = 0, tile.y++) {
        for (; tile.x + tile.width <= max_width; tile.x++) {
          if (this.getIntersectingTiles(tile, id).length == 0) {
            break a;
          }
        }
      }

    // vert_overflow > 0
    //
    // for vertical overflow (in a horizontal container) = go column-by-column (left-right);
    //   for each column, move by the count of overflowing rows
    } else {
      vert_overflow -= tile.height;
      const max_height = this.maxHeight!;
      for (tile.x++; /*Infinity*/; tile.x++) {
        tile.y = MathUtils.clamp(vert_overflow, 0, max_height - tile.height);
        // const remainder = vert_overflow - tile.y;
        vert_overflow -= tile.y;
        // vert_overflow += remainder;
        if (vert_overflow <= 0) {
          break;
        }
      }

      // skip conflicting tiles without shifting them
      a: for (;; tile.x++, tile.y = 0) {
        for (; tile.y + tile.height <= max_height; tile.y++) {
          if (this.getIntersectingTiles(tile, id).length == 0) {
            break a;
          }
        }
      }
    }
  }

  // shift conflicting tiles.
  private resolveConflicts(originalTargetId: string, shiftDirection: null | ShiftDirection = null): boolean {
    const original_target_tile = this.tiles.get(originalTargetId)!;
    const conflicting_tiles = this.getIntersectingTiles(original_target_tile, originalTargetId);
    if (conflicting_tiles.length == 0) {
      return true;
    }

    // snapshot before the conflict loop
    const before_conflict_snapshot = this.snapshot();

    // whether shifting occured fine.
    let success = true;

    // conflict loop
    conflicts: for (let conflicting_id of conflicting_tiles) {
      let conflicting_tile = this.tiles.get(conflicting_id)!;

      // skip *dirty* conflicting tile if the later code shifted
      // it indirectly (during recursion).
      if (!conflicting_tile.intersects(original_target_tile)) {
        continue;
      }

      // swap targets if one tile is more towards the opposite
      // shift direction.
      let target_tile = original_target_tile;
      let target_id = originalTargetId;
      if (shiftDirection) {
        let swap = false;
        if (shiftDirection == "upward") {
          if (conflicting_tile.y > target_tile.y) {
            swap = true;
          }
        } else if (shiftDirection == "downward") {
          if (conflicting_tile.y < target_tile.y) {
            swap = true;
          }
        } else if (shiftDirection == "leftward") {
          if (conflicting_tile.x > target_tile.x) {
            swap = true;
          }
        } else if (conflicting_tile.x < target_tile.x) {
          swap = true;
        }
        if (swap) {
          let k_conflicing_tile = conflicting_tile;
          let k_conflicting_id = conflicting_id;
          conflicting_tile = target_tile;
          conflicting_id = target_id;
          target_tile = k_conflicing_tile;
          target_id = k_conflicting_id;
        }
      }

      // normally shift occurs only in one axis, but
      // if it's cheap to shift at the other axis,
      // then do it.

      // horizontal-layout: cheap shift
      if (
        this.isHorizontal
          && target_tile.width == conflicting_tile.width
          && target_tile.height == conflicting_tile.height
          && target_tile.y == conflicting_tile.y
      ) {
        let cheap_space = new SimpleTile(target_tile.x + target_tile.width, target_tile.y, conflicting_tile.width, conflicting_tile.height);
        if (cheap_space!.x >= 0 && this.getIntersectingTiles(cheap_space!, target_id).length == 0) {
          conflicting_tile.x = cheap_space!.x;
          conflicting_tile.y = cheap_space!.y;
          continue conflicts;
        }
        cheap_space = new SimpleTile(target_tile.x - target_tile.width, target_tile.y, conflicting_tile.width, conflicting_tile.height);
        if (cheap_space!.x >= 0 && this.getIntersectingTiles(cheap_space!, target_id).length == 0) {
          conflicting_tile.x = cheap_space!.x;
          conflicting_tile.y = cheap_space!.y;
          continue conflicts;
        }
      // vertical-layout: cheap shift
      } else if (target_tile.width == conflicting_tile.width
        && target_tile.height == conflicting_tile.height
        && target_tile.x == conflicting_tile.x
      ) {
        let cheap_space = new SimpleTile(target_tile.x, target_tile.y + target_tile.height, conflicting_tile.width, conflicting_tile.height);
        if (cheap_space!.y >= 0 && this.getIntersectingTiles(cheap_space!, target_id).length == 0) {
          conflicting_tile.x = cheap_space!.x;
          conflicting_tile.y = cheap_space!.y;
          continue conflicts;
        }
        cheap_space = new SimpleTile(target_tile.x, target_tile.y - target_tile.height, conflicting_tile.width, conflicting_tile.height);
        if (cheap_space!.y >= 0 && this.getIntersectingTiles(cheap_space!, target_id).length == 0) {
          conflicting_tile.x = cheap_space!.x;
          conflicting_tile.y = cheap_space!.y;
          continue conflicts;
        }
      }

      // in case shift direction is undetermined and
      // tiles fully cover one another in the same shift axis,
      // this tells to try shifting to the opposite direction
      // later.
      let tryOpposite = false;
      let snapshot: null | Map<string, SimpleTile> = null;

      // initial target of the conflict resolution?
      let initialTarget = false;

      if (!shiftDirection) {
        // if shift direction isn't determined, then
        // that's because we're resolving conflicts from
        // a basemost target tile to be positioned.
        //
        // in case we fail to shift tile later,
        // we use that variable to determine if we can try
        // re-positioning the target tile at the same place
        // of the conflicting tile. (e.g. sometimes
        // a drag-n-drop might be imprecisely putting a tile
        // over another)
        initialTarget = true;

        // get a snapshot to restore later.
        snapshot = this.snapshot();

        if (this.isHorizontal) {
          shiftDirection =
            target_tile.isMoreAbove(conflicting_tile) ?
              "downward" :
            target_tile.isMoreBelow(conflicting_tile) ?
              "upward" :
              null;
          if (shiftDirection === null) {
            shiftDirection = "upward";
            tryOpposite = true;
          }
        } else {
          shiftDirection =
            target_tile.isMoreLeft(conflicting_tile) ?
              "rightward" :
            target_tile.isMoreRight(conflicting_tile) ?
              "leftward" :
              null;
          if (shiftDirection === null) {
            shiftDirection = "leftward";
            tryOpposite = true;
          }
        }
      }

      switch (shiftDirection!) {
        case "upward": {
          // shift upward in a horizontal layout.
          // this one has a limit.
          let k_conflict_x = conflicting_tile.x;
          let k_conflict_y = conflicting_tile.y;
          if (conflicting_tile.y <= 0 && conflicting_tile.x <= 0) {
            if (initialTarget
            && conflicting_tile.y + target_tile.height <= this.maxHeight!) {
              this.restoreSnapshot(before_conflict_snapshot);
              target_tile.x = conflicting_tile.x;
              target_tile.y = conflicting_tile.y;
              if (this.resolveConflicts(target_id, "downward")) {
                return true;
              }
              this.restoreSnapshot(snapshot!);
            }
            success = false;
            conflicting_tile.x = k_conflict_x;
            conflicting_tile.y = k_conflict_y;
            continue conflicts;
          }
          conflicting_tile.y -= conflicting_tile.height;
          if (conflicting_tile.y < 0) {
            conflicting_tile.x -= conflicting_tile.width;
            conflicting_tile.y = this.maxHeight! - conflicting_tile.height;
            if (conflicting_tile.x < 0) {
              if (initialTarget
              && conflicting_tile.y + target_tile.height <= this.maxHeight!) {
                this.restoreSnapshot(before_conflict_snapshot);
                target_tile.x = conflicting_tile.x;
                target_tile.y = conflicting_tile.y;
                if (this.resolveConflicts(target_id, "downward")) {
                  return true;
                }
                this.restoreSnapshot(snapshot!);
              }
              success = false;
              conflicting_tile.x = k_conflict_x;
              conflicting_tile.y = k_conflict_y;
              continue conflicts;
            }
          }

          break;
        }
        case "downward": {
          // shift downward in a horizontal layout.
          // (here, jump the height delta)
          const delta = target_tile.intersection(conflicting_tile)!.height;
          conflicting_tile.y += delta;
          if (conflicting_tile.y >= this.maxHeight!) {
            conflicting_tile.x += Math.max(target_tile.width, conflicting_tile.width);
            conflicting_tile.y = 0;
          }
          break;
        }
        case "leftward": {
          // shift leftward in a vertical layout.
          // this one has a limit.
          let k_conflict_x = conflicting_tile.x;
          let k_conflict_y = conflicting_tile.y;
          if (conflicting_tile.x <= 0 && conflicting_tile.y <= 0) {
            if (initialTarget
            && conflicting_tile.x + target_tile.width <= this.maxWidth!) {
              this.restoreSnapshot(before_conflict_snapshot);
              target_tile.x = conflicting_tile.x;
              target_tile.y = conflicting_tile.y;
              if (this.resolveConflicts(target_id, "rightward")) {
                return true;
              }
              this.restoreSnapshot(snapshot!);
            }
            success = false;
            conflicting_tile.x = k_conflict_x;
            conflicting_tile.y = k_conflict_y;
            continue conflicts;
          }
          conflicting_tile.x -= conflicting_tile.width;
          if (conflicting_tile.x < 0) {
            conflicting_tile.x = this.maxWidth! - conflicting_tile.width;
            conflicting_tile.y -= conflicting_tile.height;
            if (conflicting_tile.y < 0) {
              if (initialTarget
              && conflicting_tile.x + target_tile.width <= this.maxWidth!) {
                this.restoreSnapshot(before_conflict_snapshot);
                target_tile.x = conflicting_tile.x;
                target_tile.y = conflicting_tile.y;
                if (this.resolveConflicts(target_id, "rightward")) {
                  return true;
                }
                this.restoreSnapshot(snapshot!);
              }
              success = false;
              conflicting_tile.x = k_conflict_x;
              conflicting_tile.y = k_conflict_y;
              continue conflicts;
            }
          }
          break;
        }
        case "rightward": {
          // shift rightward in a vertical layout.
          // (here, jump the width delta)
          const delta = target_tile.intersection(conflicting_tile)!.width;
          conflicting_tile.x += delta;
          if (conflicting_tile.x >= this.maxWidth!) {
            conflicting_tile.x = 0;
            conflicting_tile.y += Math.max(target_tile.height, conflicting_tile.height);
          }
          break;
        }
      }

      // shift other conflicting tiles like a snail.
      if (!this.resolveConflicts(conflicting_id, shiftDirection!)) {
        // if failed and at basemost target tile,
        // try opposite direction
        if (tryOpposite) {
          this.restoreSnapshot(before_conflict_snapshot);
          return this.resolveConflicts(
            target_id,
            shiftDirection! == "upward" ?
              "downward" :
            shiftDirection! == "downward" ?
              "upward" :
              shiftDirection! == "leftward" ?
              "rightward" :
              "leftward");
        }
        success = false;
      }
    }

    if (!success) {
      this.restoreSnapshot(before_conflict_snapshot);
    }
    return success;
  }

  // returns a copy of the tile data.
  private snapshot(): Map<string, SimpleTile> {
    return new Map(
      [...this.tiles.entries()].map(([id, tile]) => [id, tile.clone()])
    );
  }

  // restore tile data.
  private restoreSnapshot(snapshot: Map<string, SimpleTile>): void {
    this.tiles = new Map(snapshot);
  }
}

type ShiftDirection = "upward" | "downward" | "leftward" | "rightward";