// third-party
import assert from "assert";
import { TypedEventTarget } from "@hydroperx/event";
import Draggable from "@hydroperx/draggable";

// local
import { SimpleGroup, SimpleTile } from "./SimpleGroup";
import { TileSize, getWidth, getHeight, TileSizeMap, TileSizeMapPair } from "./TileSize";
import * as REMConvert from "../utils/REMConvert";
import { REMObserver } from "../utils/REMObserver";
import * as MathUtils from "../utils/MathUtils";
import * as ScaleUtils from "../utils/ScaleUtils";
import { DND } from "./DND";

/**
 * Live tiles core implementation.
 */
export class Core extends (EventTarget as TypedEventTarget<CoreEventMap>) {
  /**
   * @hidden
   */
  public _groups: CoreGroup[] = [];
  /**
   * The container (the parent of groups and DND tiles) is resized
   * as the layout rearranges.
   *
   * @hidden
   */
  public _container: HTMLElement;
  /**
   * @hidden
   */
  public _dir: CoreDirection;
  /**
   * @hidden
   */
  public _class_names: CoreClassNames;
  /**
   * 1x1 tile size in `rem`.
   * @hidden
   */
  public _size_1x1: number = 0;
  /**
   * Tile gap in `rem`.
   * @hidden
   */
  public _tile_gap: number = 0;
  /**
   * Group gap in `rem`.
   * @hidden
   */
  public _group_gap: number = 0;
  /**
   * Group width for a vertical layout, in 1x1 tiles unit.
   * Must be at least 4.
   * @hidden
   */
  public _group_width: number = 0;
  /**
   * Number of inline groups in a vertical layout.
   * @hidden
   */
  public _inline_groups: number = 0;
  /**
   * Height of a horizontal layout's group, in 1x1 tiles unit.
   * @hidden
   */
  public _group_height: number = 0;
  /**
   * Group's label height in `rem`.
   * @hidden
   */
  public _label_height: number = 0;

  /**
   * @hidden
   */
  public _rearrange_timeout: number = -1;

  /**
   * @hidden
   */
  public _drag_enabled: boolean = true;
  /**
   * @hidden
   */
  public _check_enabled: boolean = true;

  /**
   * @hidden
   */
  public _rem_observer: REMObserver;

  /**
   * @hidden
   */
  public _rem: number = 16;

  /**
   * @hidden
   */
  public _dnd: DND = new DND();

  /**
   * Tile size in the `rem` unit.
   * @hidden
   */
  public _tile_in_rem: TileSizeMap = {
    small: { width: 0, height: 0 },
    medium: { width: 0, height: 0 },
    wide: { width: 0, height: 0 },
    large: { width: 0, height: 0 },
  };

  /**
   * Constructs a `Core` instance.
   */
  public constructor(params: {
    /**
     * Container.
     */
    container: HTMLDivElement,
    /**
     * The direction of the live tile layout.
     */
    direction: CoreDirection,
    /**
     * Specific class names to target for.
     */
    classNames: CoreClassNames,
    /**
     * Whether drag-n-drop is enabled.
     * @default true
     */
    dragEnabled?: boolean,
    /**
     * Whether checking tiles is enabled.
     * @default true
     */
    checkEnabled?: boolean,
    /**
     * The size of a 1x1 tile in logical pixels.
     */
    size1x1: number,
    /**
     * Gap between tiles in logical pixels.
     */
    tileGap: number,
    /**
     * Gap between groups in logical pixels.
     */
    groupGap: number,
    /**
     * Group width in 1x1 tiles, effective only
     * in a vertical layout (must be `>= 4`).
     * @default 6
     */
    groupWidth?: number,
    /**
     * Height in 1x1 tiles, effective only
     * in a horizontal layout (must be `>= 4`).
     * @default 6
     */
    groupHeight?: number,
    /**
     * Number of inline groups, effective only
     * in a vertical layout (must be `>= 1`).
     * @default 1
     */
    inlineGroups?: number,
    /**
     * Group label height in logical pixels.
     */
    labelHeight: number,
  }) {
    super();
    this._container = params.container;
    this._container.style.position = "relative";
    this._dir = params.direction;
    this._class_names = structuredClone(params.classNames);
    this.size1x1 = params.size1x1;
    this.tileGap = params.tileGap;
    this.groupGap = params.groupGap;
    this.dragEnabled = params.dragEnabled ?? true;
    this.checkEnabled = params.checkEnabled ?? true;

    this.groupWidth = params.groupWidth ?? 6;
    this.groupHeight = params.groupHeight ?? 6;
    this.inlineGroups = params.inlineGroups ?? 1;
    this.labelHeight = params.labelHeight;

    // rem observer
    this._rem_observer = new REMObserver(val => {
      this._rem = val;
    });

    // rearrange
    this.rearrange();
  }

  /**
   * Destroys the `Core` instance, disposing
   * of any observers and handlers.
   */
  public destroy(removeFromDOM: boolean = true): void {
    // dispose of rem observer
    this._rem_observer.cleanup();

    // remove container from the DOM
    if (removeFromDOM) {
      this._container.remove();
    }

    // destroy draggables
    this._dnd.tileDNDDraggable?.destroy();
    this._dnd.groupDraggable?.destroy();

    // discard deferred rearrangement
    if (this._rearrange_timeout != -1) {
      window.clearTimeout(this._rearrange_timeout);
      this._rearrange_timeout = -1;
    }
  }

  /**
   * Group width in 1x1 tiles, effective only
   * in a vertical layout (must be `>= 4`).
   */
  public get groupWidth(): number {
    return this._group_width;
  }
  public set groupWidth(val) {
    assert(val >= 4, "Core.groupWidth must be >= 4.");
    this._group_width = val;

    if (this._dir == "vertical") {
      // re-assign SimpleGroups
      for (const group of this._groups) {
        // backup tiles
        const backups =  group.simple.tiles;

        // re-assign SimpleGroup
        group.simple = new SimpleGroup({
          width: this._group_width,
        });

        // re-add tiles
        for (const [tileId] of group.tiles) {
          const backup = backups.get(tileId)!;
          group.simple.addTile(tileId, backup.x, backup.y, backup.width, backup.height);
        }
      }

      // rearrange
      this.rearrange();
    }
  }

  /**
   * Group height in 1x1 tiles, effective only
   * in a horizontal layout (must be `>= 4`).
   */
  public get groupHeight(): number {
    return this._group_height;
  }
  public set groupHeight(val) {
    assert(val >= 4, "Core.groupHeight must be >= 4.");
    this._group_height = val;

    if (this._dir == "horizontal") {
      // re-assign SimpleGroups
      for (const group of this._groups) {
        // backup tiles
        const backups =  group.simple.tiles;

        // re-assign SimpleGroup
        group.simple = new SimpleGroup({
          height: this._group_height,
        });

        // re-add tiles
        for (const [tileId] of group.tiles) {
          const backup = backups.get(tileId)!;
          group.simple.addTile(tileId, backup.x, backup.y, backup.width, backup.height);
        }
      }

      // rearrange
      this.rearrange();
    }
  }

  /**
   * Number of inline groups, effective only
   * in a vertical layout. (Must be `>= 1`.)
   */
  public get inlineGroups(): number {
    return this._inline_groups;
  }
  public set inlineGroups(val) {
    assert(this._inline_groups >= 1, "Core.inlineGroups must be >= 1.");
    this._inline_groups = val;
    this.rearrange();
  }

  /**
   * 1x1 tile size in logical pixels.
   */
  public get size1x1(): number {
    return REMConvert.rem.pixels(this._size_1x1);
  }
  public set size1x1(val) {
    this._size_1x1 = REMConvert.pixels.rem(val);

    // reset known tile sizes in rem
    this._tile_in_rem.small.width = this._size_1x1;
    this._tile_in_rem.small.height = this._size_1x1;
    this._tile_in_rem.medium.width = this._size_1x1 * 2 + this._tile_gap;
    this._tile_in_rem.medium.height = this._tile_in_rem.medium.width;
    this._tile_in_rem.wide.width = this._tile_in_rem.medium.width * 2 + this._tile_gap;
    this._tile_in_rem.wide.height = this._tile_in_rem.medium.width;
    this._tile_in_rem.large.width = this._tile_in_rem.wide.width;
    this._tile_in_rem.large.height = this._tile_in_rem.wide.width;

    // resize tiles
    for (const group of this._groups) {
      for (const [tileId, tile] of group.tiles) {
        if (!tile.dom) {
          continue;
        }
        const size = group.tileSize(tileId)!;
        const p = (this._tile_in_rem as any)[size] as TileSizeMapPair;
        tile.dom!.style.width = p.width + "rem";
        tile.dom!.style.height = p.height + "rem";
      }
    }

    // rearrange
    this.rearrange();
  }

  /**
   * Group's label height in logical pixels.
   */
  public get labelHeight(): number {
    return REMConvert.rem.pixels(this._label_height);
  }
  public set labelHeight(val) {
    this._label_height = REMConvert.pixels.rem(val);
    this.rearrange();
  }

  /**
   * Gap between tiles in logical pixels.
   */
  public get tileGap(): number {
    return REMConvert.rem.pixels(this._tile_gap);
  }
  public set tileGap(val) {
    this._tile_gap = REMConvert.pixels.rem(val);

    // reset known tile sizes in rem
    this._tile_in_rem.small.width = this._size_1x1;
    this._tile_in_rem.small.height = this._size_1x1;
    this._tile_in_rem.medium.width = this._size_1x1 * 2 + this._tile_gap;
    this._tile_in_rem.medium.height = this._tile_in_rem.medium.width;
    this._tile_in_rem.wide.width = this._tile_in_rem.medium.width * 2 + this._tile_gap;
    this._tile_in_rem.wide.height = this._tile_in_rem.medium.width;
    this._tile_in_rem.large.width = this._tile_in_rem.wide.width;
    this._tile_in_rem.large.height = this._tile_in_rem.wide.width;

    // resize tiles
    for (const group of this._groups) {
      for (const [tileId, tile] of group.tiles) {
        if (!tile.dom) {
          continue;
        }
        const size = group.tileSize(tileId)!;
        const p = (this._tile_in_rem as any)[size] as TileSizeMapPair;
        tile.dom!.style.width = p.width + "rem";
        tile.dom!.style.height = p.height + "rem";
      }
    }

    // rearrange
    this.rearrange();
  }

  /**
   * Gap between groups in logical pixels.
   */
  public get groupGap(): number {
    return REMConvert.rem.pixels(this._group_gap);
  }
  public set groupGap(val) {
    this._group_gap = REMConvert.pixels.rem(val);
    this.rearrange();
  }

  /**
   * Whether drag-n-drop is enabled.
   */
  public get dragEnabled(): boolean {
    return this._drag_enabled;
  }
  public set dragEnabled(val) {
    this._drag_enabled = val;
  }

  /**
   * Whether checking tiles is enabled.
   */
  public get checkEnabled(): boolean {
    return this._check_enabled;
  }
  public set checkEnabled(val) {
    this._check_enabled = val;

    // Uncheck any tile if `checkEnabled=false`
    if (!this._check_enabled) {
      // resize tiles
      for (const group of this._groups) {
        for (const [, tile] of group.tiles) {
          tile.dom?.removeAttribute("data-checked");
        }
      }
    }
  }

  /**
   * Requests a deferred rearrangement.
   */
  public rearrange(): void {
    if (this._rearrange_timeout != -1) {
      window.clearTimeout(this._rearrange_timeout);
    }
    this._rearrange_timeout = window.setTimeout(() => {
      this._rearrange_now();
    }, 0);
  }

  /**
   * Rearranges the layout when the minimum scale to make it work
   * is reached.
   *
   * Calling this method may be necessary if the
   * container is initially scaled to zero.
   */
  public rearrangeOverMinimumScale(): AbortController {
    const initialScale = ScaleUtils.getScale(this._container);
    const abortController = new AbortController();
    const check = () => {
      if (abortController.signal.aborted) {
        return;
      }
      const scale = ScaleUtils.getScale(this._container);
      if (scale.x >= 0.1 && scale.y >= 0.1) {
        this.rearrange();
        return;
      } else if (scale.x < initialScale.x || scale.y < initialScale.y) {
        return;
      }
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
    return abortController;
  }
}

/**
 * Class names used by `Core`.
 */
export type CoreClassNames = {
  /**
   * Class name used for identifying groups.
   */
  group: string,
  /**
   * Class name used for identifying group labels.
   */
  groupLabel: string,
  /**
   * Class name used for identifying group label texts.
   */
  groupLabelText: string,
  /**
   * Class name used for identifying the group tiles container.
   */
  groupTiles: string,
  /**
   * Class name used for identifying tiles.
   */
  tile: string,
  /**
   * Class name used for identifying tile contents.
   */
  tileContent: string,
  /**
   * Class name used for identifying the container
   * (direct child of the `container` option) that
   * contains the active drag-n-drop tile.
   */
  tileDND: string,
};

/**
 * Events emitted by `Core` instances.
 */
export type CoreEventMap = {
  /**
   * Bulk change event.
   */
  bulkChange: CustomEvent<BulkChange>,
  /**
   * Move group event.
   */
  moveGroup: CustomEvent<{ id: string, index: number }>,
  /**
   * Rename group event.
   */
  renameGroup: CustomEvent<{ id: string, label: string }>,
  /**
   * Tile's drag start event.
   */
  dragStart: CustomEvent<{ id: string, dom: HTMLButtonElement }>,
  /**
   * Tile's drag move event.
   */
  dragMove: CustomEvent<{ id: string, dom: HTMLButtonElement }>,
  /**
   * Tile's drag start event.
   */
  dragEnd: CustomEvent<{ id: string, dom: HTMLButtonElement }>,
  /**
   * Group's drag start event.
   */
  groupDragStart: CustomEvent<{ id: string, dom: HTMLDivElement }>,
  /**
   * Group's drag move event.
   */
  groupDragMove: CustomEvent<{ id: string, dom: HTMLDivElement }>,
  /**
   * Group's drag start event.
   */
  groupDragEnd: CustomEvent<{ id: string, dom: HTMLDivElement }>,
  /**
   * Event indicating which tiles are currently checked.
   */
  checkedChange: CustomEvent<{ tiles: string[] }>,
};

/**
 * Bulk change in a live tiles layout.
 */
export type BulkChange = {
  /**
   * Moves (in response to actions like drag-n-drop or direction change).
   */
  moves: { id: string, x: number, y: number }[],
  /**
   * Group transfers (tiles moving to other groups,
   * in response to actions like drag-n-drop).
   */
  groupTransfers: { id: string, group: string, x: number, y: number }[],
  /**
   * Group removals (in response to drag-n-drop or
   * explicit tile removal (in case group turns empty))
   */
  groupRemovals: { id: string }[],
};

/**
 * Group state.
 */
export class CoreGroup {
  public dom: null | HTMLDivElement = null;
  public id: string;
  public label: string;
  public tiles: Map<string, CoreTile> = new Map();
  public simple: SimpleGroup;

  //
  public constructor(params: {
    dom: null | HTMLDivElement,
    id: string,
    label: string,
    simple: SimpleGroup,
  }) {
    this.dom = params.dom;
    this.id = params.id;
    this.label = params.label;
    this.simple = params.simple;
  }

  /**
   * Returns a tile's size.
   */
  public tileSize(id: string): TileSize {
    const tile = this.simple.tiles.get(id);
    if (tile) {
      const w = tile!.width;
      const h = tile!.height;
      return (
        w == 4 ? (
          h == 2 ? "wide" : "large"
        ) :
        w == 2 ? "medium" : "small"
      );
    }
    return "small";
  }
}

/**
 * Tile state.
 *
 * @hidden
 */
export class CoreTile {
  public dom: null | HTMLButtonElement;
  /**
   * The layout direction this tile was last
   * detected for.
   */
  public forDirection: CoreDirection;
  /**
   * The layout group width/height this tile was last
   * detected for.
   */
  public forLimit: number;

  //
  public constructor(params: {
    dom: null | HTMLButtonElement,
    forDirection: CoreDirection,
    forLimit: number,
  }) {
    this.dom = params.dom;
    this.forDirection = params.forDirection;
    this.forLimit = params.forLimit;
  }
}

/**
 * The layout direction of a `Core` instance.
 */
export type CoreDirection = "horizontal" | "vertical";