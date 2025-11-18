// third-party
import assert from "assert";
import { TypedEventTarget } from "@hydroperx/event";
import Draggable from "@hydroperx/draggable";

// local
import { SimpleGroup, SimpleTile } from "./SimpleGroup";
import { TileSize, getWidth, getHeight, TileSizeMap } from "./TileSize";
import { REMObserver } from "../utils/REMObserver";
import * as MathUtils from "../utils/MathUtils";
import * as ScaleUtils from "../utils/ScaleUtils";

/**
 * Live tiles core implementation.
 */
export class CoreTiles extends (EventTarget as TypedEventTarget<CoreTilesEventMap>) {
  /**
   * Constructs a `CoreTiles` instance.
   */
  public constructor(params: {
    classNames: CoreTilesClassNames,
  }) {
    super();
  }
}

/**
 * Class names used by `CoreTiles`.
 */
export type CoreTilesClassNames = {
  group: string,
  groupLabel: string,
  groupLabelText: string,
  groupTiles: string,
  tile: string,
  tileContent: string,
  tileDND: string,
};

/**
 * Events emitted by `Tiles` instances.
 */
export type CoreTilesEventMap = {
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
 * Ĝroup state.
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