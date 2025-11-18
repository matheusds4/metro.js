// third-party
import assert from "assert";
import { TypedEventTarget } from "@hydroperx/event";
import Draggable from "@hydroperx/draggable";

// local
import { SimpleGroup, SimpleTile } from "./SimpleGroup";
import { TileSize, getWidth, getHeight, TileSizeMap } from "./TileSize";
import * as REMConvert from "../utils/REMConvert";
import { REMObserver } from "../utils/REMObserver";
import * as MathUtils from "../utils/MathUtils";
import * as ScaleUtils from "../utils/ScaleUtils";

/**
 * Live tiles core implementation.
 */
export class Core extends (EventTarget as TypedEventTarget<CoreEventMap>) {
  /**
   * @hidden
   */
  public _state: CoreGroup[] = [];
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
  public _size_1x1: number;
  /**
   * Tile gap in `rem`.
   * @hidden
   */
  public _tile_gap: number;
  /**
   * Group gap in `rem`.
   * @hidden
   */
  public _group_gap: number;
  /**
   * Group width for a vertical layout, in 1x1 tiles unit.
   * Must be at least 4.
   * @hidden
   */
  public _group_width: number;
  /**
   * Number of inline groups in a vertical layout.
   * @hidden
   */
  public _inline_groups: number;
  /**
   * Height of a vertical layout, in 1x1 tiles unit.
   * @hidden
   */
  public _height: number;
  /**
   * Group's label height in `rem`.
   * @hidden
   */
  public _label_height: number;

  /**
   * @hidden
   */
  public _rearrange_timeout: number = -1;

  /**
   * @hidden
   */
  public _drag_enabled: boolean;
  /**
   * @hidden
   */
  public _check_enabled: boolean;

  /**
   * @hidden
   */
  public _rem_observer: REMObserver;

  /**
   * @hidden
   */
  public _rem: number = 16;

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
  }) {
    super();
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

  //
  public constructor(params: {
    dom: null | HTMLDivElement,
    id: string,
    label: string,
  }) {
    this.dom = params.dom;
    this.id = params.id;
    this.label = params.label;
  }
}

/**
 * Tile state.
 */
export class CoreTile {
  public dom: null | HTMLButtonElement;
  public x: number;
  public y: number;
  public size: TileSize;

  //
  public constructor(params: {
    dom: null | HTMLButtonElement,
    x: number,
    y: number,
    size: TileSize,
  }) {
    this.dom = params.dom;
    this.x = params.x;
    this.y = params.y;
    this.size = params.size;
  }
}

/**
 * The layout direction of a `Core` instance.
 */
export type CoreDirection = "horizontal" | "vertical";