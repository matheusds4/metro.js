// third-party
import React from "react";
import { styled } from "styled-components";
import { Color } from "@hydroperx/color";
import { TypedEventTarget } from "@hydroperx/event";
import { gsap } from "gsap";

// local
import { TileMode, TileModeContext } from "./TileModeContext";
import { Core, CoreDirection, BulkChange } from "../liveTiles/Core";
import { TileSize } from "../liveTiles/TileSize";
import { RTLContext } from "../layout/RTL";
import { ThemeContext, Theme } from "../theme/Theme";
import * as ColorUtils from "../utils/ColorUtils";
import { REMObserver } from "../utils/REMObserver";
import { LIVE_TILES_OPENING_OR_CLOSING } from "../utils/Constants";
import { randomHex } from "../utils/RandomUtils";

/**
 * A live tiles container consisting mainly of `TileGroup`s.
 * 
 * Using `direction="horizontal"` is recommended for
 * landscape orientations (like start screens),
 * and `direction="vertical"` for
 * portrait orientations or smaller regions
 * (like desktop start menus).
 */
export function Tiles(params: {
  className?: string,
  id?: string,
  style?: React.CSSProperties,
  children?: React.ReactNode,
  ref?: React.Ref<null | HTMLDivElement>,

  /**
   * Attaching a `TilePlus` provides extra control
   * over tiles and testing methods.
   * 
   * With it you can:
   * 
   * - Check/uncheck tiles
   * - Determine the number of inline groups available
   *   for a given width.
   */
  plus?: TilePlus,

  /**
   * Whether to display open or close transition.
   *
   * A `Tiles` component displays a `LIVE_TILES_OPENING_OR_CLOSING` milliseconds
   * scale/opacity transition when visibility changes;
   * this property indicates whether the container is open or closed.
   *
   * @default true
   */
  open?: boolean;

  /**
   * The direction of the live tile layout.
   */
  direction: CoreDirection,

  /**
   * Whether drag-n-drop is enabled.
   */
  dragEnabled: boolean,

  /**
   * Whether checking tiles is enabled.
   */
  checkEnabled: boolean,

  /**
   * Whether renaming groups is enabled.
   */
  renamingGroupsEnabled: boolean,

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
   * Event triggered when a tile is clicked.
   */
  click?: (event: { tile: string }) => void,

  /**
   * Event triggered when the context menu button clicks in a tile.
   */
  contextMenu?: (event: { tile: string, clientX: number, clientY: number }) => void,

  /**
   * Event triggered when the context menu button clicks in a group's label.
   */
  groupContextMenu?: (event: { group: string, clientX: number, clientY: number, original: Event }) => void,

  /**
   * Event triggered for a bulk change.
   */
  bulkChange: (event: BulkChange) => void,

  /**
   * Event triggered for re-ordering groups.
   */
  reorderGroups: (event: Map<number, string>) => void,

  /**
   * Event triggered for renaming a group.
   */
  renameGroup: (event: { id: string, label: string }) => void,

  /**
   * Event triggered for a drag start on a tile.
   */
  dragStart?: (event: { id: string, dnd: HTMLElement }) => void,

  /**
   * Event triggered for a drag move on a tile.
   */
  dragMove?: (event: { id: string, dnd: HTMLElement }) => void,

  /**
   * Event triggered for a drag end on a tile.
   */
  dragEnd?: (event: { id: string, dnd: HTMLElement }) => void,

  /**
   * Event triggered for a drag start on a group.
  */
  groupDragStart?: (event: { id: string, element: HTMLDivElement }) => void,

  /**
   * Event triggered for a drag move on a group.
  */
  groupDragMove?: (event: { id: string, element: HTMLDivElement }) => void,

  /**
   * Event triggered for a drag end on a group.
  */
  groupDragEnd?: (event: { id: string, element: HTMLDivElement }) => void,

  /**
   * Event triggered for a change on which tiles are currently checked.
   */
  checkedChange?: (event: { tiles: string[] }) => void,

}): React.ReactNode {

  // mode
  //
  // used to slightly alter style of all tiles
  // during drag-n-drop or checking.
  const [mode, set_mode] = React.useState<TileMode>({
    checking: false,
    dnd: false,
  });
  const mode_sync = React.useRef(mode);

  // event handlers
  const handlers = React.useRef<TilesHandlers>({
    click: params.click,
    context_menu: params.contextMenu,
    group_context_menu: params.groupContextMenu,
    bulk_change: params.bulkChange,
    reorder_groups: params.reorderGroups,
    rename_group: params.renameGroup,
    drag_start: params.dragStart,
    drag_move: params.dragMove,
    drag_end: params.dragEnd,
    group_drag_start: params.groupDragStart,
    group_drag_move: params.groupDragMove,
    group_drag_end: params.groupDragEnd,
    checked_change: params.checkedChange,
  });

  // 
  const super_div_ref = React.useRef<null | HTMLDivElement>(null);
  const sub_div_ref = React.useRef<null | HTMLDivElement>(null);

  //
  const core = React.useRef<null | Core>(null);

  // ?rtl
  const rtl = React.useContext(RTLContext);

  // ?theme
  const theme = React.useContext(ThemeContext);

  // opening/closing transition stuff
  const open_close_tween = React.useRef<null | gsap.core.Tween>(null);
  const initial_open_close = React.useRef(true);
  const min_aborter = React.useRef<null | AbortController>(null);

  // initialization
  React.useEffect(() => {

    const sub_div = sub_div_ref.current!;

    const this_core = new Core({
      container: sub_div_ref.current!,
      direction: params.direction,
      classNames: {
        group: "TileGroup",
        groupLabel: "TileGroup-label",
        groupLabelText: "TileGroup-label-text",
        groupLabelInput: "TileGroup-label-input",
        groupTiles: "TileGroup-tiles",
        tile: "Tile",
        tileContent: "Tile-content",
        tileDND: "TileDND",
      },
      dragEnabled: params.dragEnabled,
      checkEnabled: params.checkEnabled,
      renamingGroupsEnabled: params.renamingGroupsEnabled,
      size1x1: 0,
      tileGap: 0,
      groupGap: 0,
      labelHeight: 0,
    });

    //
    core.current = this_core;

    // click
    this_core.addEventListener("click", e => {
      handlers.current.click?.(e.detail);
    });

    // contextMenu
    this_core.addEventListener("contextMenu", e => {
      handlers.current.context_menu?.(e.detail);
    });

    // groupContextMenu
    this_core.addEventListener("groupContextMenu", e => {
      handlers.current.group_context_menu?.(e.detail);
    });

    // bulkChange
    this_core.addEventListener("bulkChange", e => {
      handlers.current.bulk_change(e.detail);
    });

    // reorderGroups
    this_core.addEventListener("reorderGroups", e => {
      handlers.current.reorder_groups(e.detail);
    });

    // renameGroup
    this_core.addEventListener("renameGroup", e => {
      handlers.current.rename_group(e.detail);
    });

    // dragStart (tile)
    this_core.addEventListener("dragStart", e => {
      set_mode({
        checking: mode_sync.current.checking,
        dnd: true,
      });
      handlers.current.drag_start?.(e.detail);
    });

    // dragMove (tile)
    this_core.addEventListener("dragMove", e => {
      handlers.current.drag_move?.(e.detail);
    });

    // dragEnd (tile)
    this_core.addEventListener("dragEnd", e => {
      set_mode({
        checking: mode_sync.current.checking,
        dnd: false,
      });
      handlers.current.drag_end?.(e.detail);
    });

    // groupDragStart (group)
    this_core.addEventListener("groupDragStart", e => {
      handlers.current.group_drag_start?.(e.detail);
    });

    // groupDragMove (group)
    this_core.addEventListener("groupDragMove", e => {
      handlers.current.group_drag_move?.(e.detail);
    });

    // groupDragEnd (group)
    this_core.addEventListener("groupDragEnd", e => {
      handlers.current.group_drag_end?.(e.detail);
    });

    // checkedChange
    this_core.addEventListener("checkedChange", e => {
      set_mode({
        checking: e.detail.tiles.length != 0,
        dnd: mode_sync.current.dnd,
      });
      handlers.current.checked_change?.(e.detail);
    });

    // handle child requesting detection
    sub_div.addEventListener("_Tiles_detect" as any, (e: CustomEvent<HTMLElement>) => {
      this_core.detect(e.detail);
    });

    return () => {
      this_core.destroy();
    };

  }, []);

  // update metrics in response to change
  // in various parameters.
  React.useEffect(() => {

    update_metrics();

  }, [
    params.direction,
    params.groupWidth,
    params.groupHeight,
    params.inlineGroups,
    rtl
  ]);

  // sync handlers
  React.useEffect(() => {

    handlers.current = {
      click: params.click,
      context_menu: params.contextMenu,
      group_context_menu: params.groupContextMenu,
      bulk_change: params.bulkChange,
      reorder_groups: params.reorderGroups,
      rename_group: params.renameGroup,
      drag_start: params.dragStart,
      drag_move: params.dragMove,
      drag_end: params.dragEnd,
      group_drag_start: params.groupDragStart,
      group_drag_move: params.groupDragMove,
      group_drag_end: params.groupDragEnd,
      checked_change: params.checkedChange,
    };
  }, [
    params.bulkChange,
    params.reorderGroups,
    params.renameGroup,
    params.dragStart,
    params.dragMove,
    params.dragEnd,
    params.groupDragStart,
    params.groupDragMove,
    params.groupDragEnd,
    params.checkedChange,
  ]);

  // connect `TilePlus` instance
  React.useEffect(() => {

    if (!params.plus) {
      return;
    }

    const plus = params.plus;

    // external request to set whether a tile is checked or not.
    function external_checked(
      e: CustomEvent<{ id: string; value: boolean }>,
    ): void {
      core.current!.checked(e.detail.id, e.detail.value);
    }
    plus.on("setChecked", external_checked);

    // external request to check all tiles
    function external_check_all(e: Event): void {
      core.current!.checkAll();
    }
    plus.on("checkAll", external_check_all);

    // external request to uncheck all tiles
    function external_uncheck_all(e: Event): void {
      core.current!.uncheckAll();
    }
    plus.on("uncheckAll", external_uncheck_all);

    // external request to determine number of available inline groups.
    function external_get_inline_groups_available(
      e: CustomEvent<{ requestId: string; width: string }>,
    ): void {
      plus.dispatchEvent(
        new CustomEvent("getInlineGroupsAvailableResult", {
          detail: {
            requestId: e.detail.requestId,
            value: core.current!.inlineGroupsAvailable(e.detail.width),
          },
        }),
      );
    }
    plus.on("getInlineGroupsAvailable", external_get_inline_groups_available);

    // cleanup
    return () => {
      plus.off("setChecked", external_checked);
      plus.off("checkAll", external_check_all);
      plus.off("uncheckAll", external_uncheck_all);
      plus.off("getInlineGroupsAvailable", external_get_inline_groups_available);
    };

  }, [params.plus]);

  // opening/closing transition
  React.useEffect(() => {

    const open = params.open ?? true;

    if (open_close_tween.current) {
      open_close_tween.current!.kill();
      open_close_tween.current = null;
    }
    if (min_aborter.current) {
      min_aborter.current!.abort();
      min_aborter.current = null;
    }
    if (open) {
      super_div_ref.current!.style.opacity = "";
      if (initial_open_close) {
        open_close_tween.current = gsap.fromTo(
          super_div_ref.current!,
          { scale: 0 },
          { scale: 1, ease: "power1.out", duration: LIVE_TILES_OPENING_OR_CLOSING / 1_000 },
        );
      } else {
        open_close_tween.current = gsap.to(
          super_div_ref.current!,
          { scale: 1, ease: "power1.out", duration: LIVE_TILES_OPENING_OR_CLOSING / 1_000 },
        );
      }
      min_aborter.current = core.current!.rearrangeMin();
    } else {
      if (initial_open_close) {
        super_div_ref.current!.style.opacity = "0";
        super_div_ref.current!.style.transform = "scale(0)";
      } else {
        const tween = gsap.to(
          super_div_ref.current!,
          { scale: 0, ease: "power1.out", duration: LIVE_TILES_OPENING_OR_CLOSING / 1_000 },
        );
        tween.then(() => {
          super_div_ref.current!.style.opacity = "0";
        });
        open_close_tween.current = tween;
      }
    }
    initial_open_close.current = false;

  }, [params.open ?? true]);

  // sync mode
  React.useEffect(() => {

    mode_sync.current = mode;

  }, [mode]);

  // update several metrics like a 1x1 size and gaps.
  // (MUST ONLY be called directly from a React.js effect.)
  function update_metrics(): void {
    core.current!.rtl = rtl;
    core.current!.groupWidth = params.groupWidth ?? 6;
    core.current!.groupHeight = params.groupHeight ?? 6;
    core.current!.inlineGroups = params.inlineGroups ?? 1;

    core.current!.direction = params.direction;

    if (params.direction == "horizontal") {
      core.current!.size1x1 = 42;
      core.current!.tileGap = 10;
      core.current!.groupGap = 144;
      core.current!.labelHeight = 30.4;
    } else {
      core.current!.size1x1 = 39;
      core.current!.tileGap = 7;
      core.current!.groupGap = 32;
      core.current!.labelHeight = 28;
    }
  }

  return (
    <Tiles_div
      className={[
        "Tiles",
        ...(rtl ? ["rtl"] : []),
        ...(params.className ?? "").split(" ").filter(c => c != "")
      ].join(" ")}
      data-direction={params.direction.toString()}
      style={params.style}
      id={params.id}
      ref={obj => {
        super_div_ref.current = obj;
        if (typeof params.ref == "function") {
          params.ref(obj);
        } else if (params.ref) {
          params.ref!.current = obj;
        }
      }}
      $foreground={theme.colors.foreground}>
      <div className="Tiles-sub" ref={sub_div_ref}>
        <TileModeContext.Provider value={mode}>
          {params.children}
        </TileModeContext.Provider>
      </div>
    </Tiles_div>
  );
}

/**
 * The `TilePlus` class may have instances
 * attached to a `Tiles` component for additional
 * control and testing methods.
 * 
 * With it, you can:
 * 
 * - Check or uncheck tiles
 * - Determine the number of inline groups available for a given
 *   width.
 */
export class TilePlus extends (EventTarget as TypedEventTarget<TilePlusEventMap>) {
  /**
   * Sets whether a tile is checked or not.
   */
  public checked(tile: string, value: boolean): void {
    this.dispatchEvent(
      new CustomEvent("setChecked", {
        detail: { id: tile, value },
      }),
    );
  }

  /**
   * Checks all tiles.
   */
  public checkAll(): void {
    this.dispatchEvent(new Event("checkAll"));
  }

  /**
   * Unchecks all tiles.
   */
  public uncheckAll(): void {
    this.dispatchEvent(new Event("uncheckAll"));
  }

  /**
   * Returns the number of inline groups available for
   * the given width (either in `px` or `rem`).
   *
   * > **Note** Applies to a vertical layout only.
   */
  public inlineGroupsAvailable(width: string): Promise<number> {
    return new Promise((resolve, _) => {
      const requestId = randomHex(true);
      const listener = (
        e: CustomEvent<{ requestId: string; value: number }>,
      ) => {
        if (e.detail.requestId !== requestId) return;
        this.removeEventListener("getInlineGroupsAvailableResult", listener);
        resolve(e.detail.value);
      };
      this.addEventListener("getInlineGroupsAvailableResult", listener);
      this.dispatchEvent(
        new CustomEvent("getInlineGroupsAvailable", {
          detail: {
            requestId,
            width,
          },
        }),
      );
    });
  }

  /**
   * Shorthand to `addEventListener()`.
   * @hidden
   */
  public on<K extends keyof TilePlusEventMap>(type: K, listenerFn: (event: TilePlusEventMap[K]) => void, options?: AddEventListenerOptions): void;
  public on(type: string, listenerFn: (event: Event) => void, options?: AddEventListenerOptions): void;
  public on(type: any, listenerFn: any, options?: AddEventListenerOptions): void {
    this.addEventListener(type, listenerFn, options);
  }

  /**
   * Shorthand to `removeEventListener()`.
   * @hidden
   */
  public off<K extends keyof TilePlusEventMap>(type: K, listenerFn: (event: TilePlusEventMap[K]) => void, options?: EventListenerOptions): void;
  public off(type: string, listenerFn: (event: Event) => void, options?: EventListenerOptions): void;
  public off(type: any, listenerFn: any, options?: EventListenerOptions): void {
    this.removeEventListener(type, listenerFn, options);
  }
}

// internal events exchanged between `Tiles`
// and `TilePlus`
type TilePlusEventMap = {
  /** @hidden */
  setChecked: CustomEvent<{ id: string; value: boolean }>;
  /** @hidden */
  checkAll: Event;
  /** @hidden */
  uncheckAll: Event;
  /** @hidden */
  getInlineGroupsAvailable: CustomEvent<{ requestId: string, width: string }>;
  /** @hidden */
  getInlineGroupsAvailableResult: CustomEvent<{ requestId: string, value: number }>;
};

// handler references
type TilesHandlers = {
  click: undefined | ((event: { tile: string }) => void),
  context_menu: undefined | ((event: { tile: string, clientX: number, clientY: number }) => void),
  group_context_menu: undefined | ((event: { group: string, clientX: number, clientY: number, original: Event }) => void),
  bulk_change: (event: BulkChange) => void,
  reorder_groups: (event: Map<number, string>) => void,
  rename_group: (event: { id: string, label: string }) => void,
  drag_start: undefined | ((event: { id: string, dnd: HTMLElement }) => void),
  drag_move: undefined | ((event: { id: string, dnd: HTMLElement }) => void),
  drag_end: undefined | ((event: { id: string, dnd: HTMLElement }) => void),
  group_drag_start: undefined | ((event: { id: string, element: HTMLDivElement }) => void),
  group_drag_move: undefined | ((event: { id: string, element: HTMLDivElement }) => void),
  group_drag_end: undefined | ((event: { id: string, element: HTMLDivElement }) => void),
  checked_change: undefined | ((event: { tiles: string[] }) => void),
};

// style sheet
const Tiles_div = styled.div<{
  $foreground: string,
}> `
  && {
    color: ${$ => $.$foreground};
    padding: 0.5rem 1.5rem;
    width: 100%;
    height: 100%;
  }

  &&[data-direction="horizontal"] {
  }

  &&[data-direction="vertical"] {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  && > .TileDND {
    opacity: 0.6;
  }

  && .TileGroup-label {
    overflow: hidden;
  }

  &&[data-direction="horizontal"] .TileGroup-label {
    overflow: hidden;
    font-size: 1.2rem;
    font-weight: lighter;
  }

  &&[data-direction="vertical"] .TileGroup-label {
    overflow: hidden;
    font-size: 1rem;
    font-weight: normal;
  }

  && .TileGroup-label:hover {
    background: ${$ => Color($.$foreground).alpha(0.1).toString()};
  }

  && .TileGroup-label-input {
    background: none;
    padding: 0;
    margin: 0;
    outline: none;
    border: none;
    width: 100%;
    height: 100%;
    word-break: none;
    color: ${$ => $.$foreground};
    font-size: 1rem;
    font-weight: lighter;
  }

  &&:not(.rtl) .Tile-content > .TilePage[data-variant="iconLabel"] > .Label,
  &&:not(.rtl) .Tile-content > .TilePage[data-variant="labelIcon"] > .Label {
    text-align: left;
  }

  &&.rtl .Tile-content > .TilePage[data-variant="iconLabel"] > .Label,
  &&.rtl .Tile-content > .TilePage[data-variant="labelIcon"] > .Label {
    text-align: right;
  }

  &&:not(.rtl) .Tile:not(.small) > .Tile-content > .TilePage[data-variant="labelIcon"] > .Group {
    left: 0.2rem;
  }

  &&.rtl .Tile:not(.small) > .Tile-content > .TilePage[data-variant="labelIcon"] > .Group {
    right: 0.2rem;
  }
`;