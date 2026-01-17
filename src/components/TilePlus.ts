// local
import { randomHex } from "../utils/RandomUtils";

/**
 * The `TilePlus` class may have instances
 * attached to a `Tiles` component for additional
 * control and testing methods.
 * 
 * With it you can:
 * 
 * - Check or uncheck tiles
 * - Determine the number of inline groups available for a given
 *   width.
 */
export class TilePlus extends SAEventTarget {
  declare [EventRecord]: {
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

  /**
   * Sets whether a tile is checked or not.
   */
  public checked(tile: string, value: boolean): void {
    this.emit(
      new CustomEvent("setChecked", {
        detail: { id: tile, value },
      }),
    );
  }

  /**
   * Checks all tiles.
   */
  public checkAll(): void {
    this.emit(new Event("checkAll"));
  }

  /**
   * Unchecks all tiles.
   */
  public uncheckAll(): void {
    this.emit(new Event("uncheckAll"));
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
        this.off("getInlineGroupsAvailableResult", listener);
        resolve(e.detail.value);
      };
      this.on("getInlineGroupsAvailableResult", listener);
      this.emit(
        new CustomEvent("getInlineGroupsAvailable", {
          detail: {
            requestId,
            width,
          },
        }),
      );
    });
  }
}