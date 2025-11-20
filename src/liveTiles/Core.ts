// third-party
import assert from "assert";
import { TypedEventTarget } from "@hydroperx/event";
import Draggable from "@hydroperx/draggable";
import { gsap } from "gsap/gsap-core";

// local
import { DND } from "./DND";
import { Detection } from "./Detection";
import { Layout } from "./layouts/Layout";
import { HorizontalLayout } from "./layouts/HorizontalLayout";
import { VerticalLayout } from "./layouts/VerticalLayout";
import { SimpleGroup, SimpleTile } from "./SimpleGroup";
import { CoreGroup, CoreTile } from "./CoreGroup";
import { TileSize, getWidth, getHeight, TileSizeMap, TileSizeMapPair } from "./TileSize";
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
  public _layout: Layout;
  /**
   * @hidden
   */
  public _groups: Map<number, CoreGroup> = new Map();
  /**
   * @hidden
   */
  public _detection: Detection;
  /**
   * Global `window` handlers contributed by tile and group pointer handlers.
   * @hidden
   */
  public _window_handlers: [string, Function][] = [];
  /**
   * @hidden
   */
  public _tile_tweens: gsap.core.Tween[] = [];
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
  public _dnd: DND = new DND(this);

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
    this._layout = params.direction == "horizontal" ? new HorizontalLayout(this) : new VerticalLayout(this);
    this._detection = new Detection(this);
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

    // *click outside tiles* handler
    this._container.addEventListener("click", this._click_outside.bind(this));

    // rearrange
    this.rearrange();
  }

  /**
   * Shorthand to `addEventListener()`.
   */
  public on<K extends keyof CoreEventMap>(type: K, listenerFn: (event: CoreEventMap[K]) => void, options?: AddEventListenerOptions): void;
  public on(type: string, listenerFn: (event: Event) => void, options?: AddEventListenerOptions): void;
  public on(type: any, listenerFn: any, options?: AddEventListenerOptions): void {
    this.addEventListener(type, listenerFn, options);
  }

  /**
   * Shorthand to `removeEventListener()`.
   */
  public off<K extends keyof CoreEventMap>(type: K, listenerFn: (event: CoreEventMap[K]) => void, options?: EventListenerOptions): void;
  public off(type: string, listenerFn: (event: Event) => void, options?: EventListenerOptions): void;
  public off(type: any, listenerFn: any, options?: EventListenerOptions): void {
    this.removeEventListener(type, listenerFn, options);
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
    this._dnd.tileDNDDraggable = null;
    this._dnd.groupDraggable?.[1].destroy();
    this._dnd.groupDraggable = null;

    // discard global handlers
    for (const [type, fn] of this._window_handlers) {
      window.removeEventListener(type, fn as any);
    }

    // discard tile tweens
    for (const tween of this._tile_tweens) {
      tween.kill();
    }
    this._tile_tweens.length = 0;

    // discard deferred rearrangement
    if (this._rearrange_timeout != -1) {
      window.clearTimeout(this._rearrange_timeout);
      this._rearrange_timeout = -1;
    }
  }

  /**
   * The direction of the live tile layout.
   */
  public get direction(): CoreDirection {
    return this._dir;
  }
  public set direction(val) {
    const k = this._dir;
    this._dir = val;

    if (k != this._dir) {
      this._layout = this._dir == "horizontal" ? new HorizontalLayout(this) : new VerticalLayout(this);
      this._re_add_tiles();
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
      this._re_add_tiles();
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
      this._re_add_tiles();
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
   * Returns the number of inline groups available for
   * the given width (either in `px` or `rem`).
   * *Applies to a vertical layout only.*
   * 
   * @throws If not in a vertical layout.
   */
  public inlineGroupsAvailable(width: string): number {
    assert(this._dir == "vertical", "Core.inlineGroupsAvailable() can only be called on vertical layouts.");
    const unitMatch = width.match(/(px|rem)$/i);
    assert(!!unitMatch, "Core.inlineGroupsAvailable() takes a width with a 'px' or 'rem' unit.");
    const unit = unitMatch[1].toLowerCase();
    let w = parseFloat(width.trim());
    // convert px to rem
    if (unit == "px") {
      w /= this._rem;
    }
    let r: number = 0;
    for (let acc: number = 0; acc < w; r++) {
      if (acc != 0) {
        acc += this._group_gap;
      }
      acc += this._group_width*this._size_1x1 + (this._group_width-1)*this._group_gap;
    }
    return r;
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
      for (const [, group] of this._groups) {
        for (const [, tile] of group.tiles) {
          tile.dom?.removeAttribute("data-checked");
        }
      }
    }
  }

  /**
   * Detects a node (tile or group) and checks
   * if it has changed, re-positioning and
   * rearranging things up, transferring group
   * or removing item.
   */
  public detect(node: HTMLElement): void {
    this._detection.detect(node);
  }

  /**
   * Sets whether a tile is checked or not.
   */
  public checked(tileId: string, value: boolean): void {
    const current: string[] = [];
    let changed = false;
    for (const [, g] of this._groups) {
      for (const [tileId2, tile] of g.tiles) {
        if (tileId == tileId2) {
          if (value) {
            if (tile.dom) {
              if (tile.dom!.getAttribute("data-checked") !== "true") {
                changed = true;
              }
              tile.dom!.setAttribute("data-checked", "true");
              current.push(tileId);
            }
          } else {
            if (tile.dom?.getAttribute("data-checked") === "true") {
              changed = true;
            }
            tile.dom?.removeAttribute("data-checked");
          }
        } else if (tile.dom?.getAttribute("data-checked") === "true") {
          current.push(tileId2);
        }
      }
    }
    if (changed) {
      this.dispatchEvent(new CustomEvent("checkedChange", {
        detail: { tiles: current },
      }));
    }
  }

  /**
   * Checks all tiles.
   */
  public checkAll(): void {
    const current: string[] = [];
    let changed = false;
    for (const [, g] of this._groups) {
      for (const [tileId, tile] of g.tiles) {
        if (tile.dom?.getAttribute("data-checked") !== "true") {
          changed = true;
        }
        if (tile.dom) {
          tile.dom!.setAttribute("data-checked", "true");
          current.push(tileId);
        }
      }
    }
    if (changed) {
      this.dispatchEvent(new CustomEvent("checkedChange", {
        detail: { tiles: current },
      }));
    }
  }

  /**
   * Unchecks all tiles.
   */
  public uncheckAll(): void {
    let changed = false;
    for (const [, g] of this._groups) {
      for (const [tileId, tile] of g.tiles) {
        if (tile.dom?.getAttribute("data-checked") === "true") {
          changed = true;
        }
        tile.dom?.removeAttribute("data-checked");
      }
    }
    if (changed) {
      this.dispatchEvent(new CustomEvent("checkedChange", {
        detail: { tiles: [] },
      }));
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
  public rearrangeMin(): AbortController {
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

  // rearrange immediately.
  private _rearrange_now(): void {
    this._layout.rearrange();
  }

  // reset SimpleGroups and perform a rearrangement.
  private _re_add_tiles(): void {
    // re-assign SimpleGroups
    for (const [, group] of this._groups) {
      // backup tiles
      const backups =  group.simple.tiles;

      // re-assign SimpleGroup
      group.simple = new SimpleGroup({
        width: this._dir == "vertical" ? this._group_width : undefined,
        height: this._dir == "horizontal" ? this._group_height : undefined,
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

  // handle click outside tiles (uncheck all)
  private _click_outside(e: MouseEvent): void {
    let outside = true;
    g: for (const [,g] of this._groups) {
      for (const [,tile] of g.tiles) {
        if (tile.dom) {
          const r = tile.dom!.getBoundingClientRect();
          // .matches(":hover") does not work
          // on touchscreens.
          if (
            e.clientX >= r.left && e.clientX < r.right &&
            e.clientY >= r.top && e.clientY < r.bottom
          ) {
            outside = false;
            break g;
          }
        }
      }
    }
    if (outside) this.uncheckAll();
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
   * Class name used for identifying group label inputs.
   */
  groupLabelInput: string,
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
   * Event that dispatches when a tile is clicked.
   */
  click: CustomEvent<{ tile: string, clientX: number, clientY: number }>,
  /**
   * Event that dispatches when right click occurs in a tile.
   * Default behavior is prevented beforehand.
   */
  contextMenu: CustomEvent<{ tile: string, clientX: number, clientY: number }>,
  /**
   * Event that dispatches when right click occurs in a group's label.
   * Default behavior is **not** prevented beforehand.
   */
  groupContextMenu: CustomEvent<{ group: string, clientX: number, clientY: number, original: Event }>,
  /**
   * Bulk change event.
   */
  bulkChange: CustomEvent<BulkChange>,
  /**
   * Reorder groups event. (`index => groupId`)
   */
  reorderGroups: CustomEvent<Map<number, string>>,
  /**
   * Rename group event.
   */
  renameGroup: CustomEvent<{ id: string, label: string }>,
  /**
   * Tile's drag start event.
   */
  dragStart: CustomEvent<{ id: string, dnd: HTMLElement }>,
  /**
   * Tile's drag move event.
   */
  dragMove: CustomEvent<{ id: string, dnd: HTMLElement }>,
  /**
   * Tile's drag start event.
   */
  dragEnd: CustomEvent<{ id: string, dnd: HTMLElement }>,
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
   * Moved tiles (in response to actions like drag-n-drop or direction change).
   */
  movedTiles: { id: string, x: number, y: number }[],
  /**
   * Resized tiles (triggered when the developer specifies a size that
   * could not fit into the layout).
   */
  resizedTiles: { id: string, size: TileSize }[],
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
  /**
   * Requests to create a new group at the end,
   * in response to a drag-n-drop in the last empty space.
   * Contains a tile ID to contain,
   */
  groupCreation: null | { tile: string },
};

/**
 * The layout direction of a `Core` instance.
 */
export type CoreDirection = "horizontal" | "vertical";