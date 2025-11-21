// third-party
import getOffset from "getoffset";

// local
import { Layout, SnapResult } from "./Layout";
import type { Core } from "../Core";
import * as OffsetUtils from "../../utils/OffsetUtils";
import * as ScaleUtils from "../../utils/ScaleUtils";

// horizontal layout
export class HorizontalLayout extends Layout {
  //
  public constructor($: Core) {
    super($);
  }

  /**
   * Rearranges everything.
   */
  public override rearrange(): void {
    // current X in the cascading REM unit
    let x = 0;
    let parent_w = this.$._groups.size == 0 ? 0 : (this.$._groups.size - 1) * this.$._group_gap;
    let parent_h = this.$._label_height + this.$._tile_gap + this.$._group_height*this.$._size_1x1 + (this.$._group_height-1)*this.$._tile_gap;

    // read groups in sequential order
    let groups = Array.from(this.$._groups.entries());
    groups.sort((a, b) => a[0] - b[0]);

    // rearrange group tiles and reposition groups
    for (const [, group] of groups) {
      this.rearrangeGroup(group);

      // ignore from layout any group being dragged.
      if (group.dom?.getAttribute("data-dragging") == "true") {
        continue;
      }

      // reposition group
      let width = 0;
      const dragging = this.$._dnd.dragging && this.$._dnd.groupDraggable?.[0] == group.id;
      if (group.dom && !dragging) {
        group.dom!.style.transform = `translateX(${x}rem) translateY(0)`;
        width = ((group.dom!.getBoundingClientRect().width / ScaleUtils.getScale(group.dom!).x) / this.$._rem);
      } else {
        width = this.$._size_1x1*4;
      }
      parent_w += width;
      x += width + this.$._group_gap;
    }

    // parent width has some additional increase
    parent_w += this.$._size_1x1*2;

    // Set parent size
    this.$._container.style.width = parent_w + "rem";
    this.$._container.style.height = parent_h + "rem";
  }

  /**
   * Snaps location to grid.
   */
  public override snap(tileDND: HTMLElement): null | SnapResult {
    // base offset
    const offset = getOffset(tileDND, this.$._container)!;
    OffsetUtils.divideOffsetBy(offset, this.$._rem);
  
    // basics
    let accX = 0, accY = 0, resultX = 0, resultY = 0;
    const r = this.$._size_1x1/2;

    // resultY
    const tilesHeight = this.$._group_height*this.$._size_1x1 + (this.$._group_height - 1)*this.$._tile_gap;
    const fullHeight = tilesHeight + this.$._label_height + this.$._tile_gap;
    // skip label
    accY += this.$._label_height;
    // skip gap between label and tilesDiv
    accY += this.$._tile_gap;
    // offset-Y check 1
    const offset_middle_y = offset.y + offset.h/2;
    if (offset_middle_y < accY) {
      return null;
    }
    // const vertical_start = accY;
    for (; accY < fullHeight; resultY++) {
      if (offset.y < accY + this.$._size_1x1/2) {
        break;
      }
      accY += this.$._size_1x1 + this.$._tile_gap;
    }
    if (offset.y > accY + this.$._size_1x1) {
      return null;
    }

    let resultGroup: undefined | string = undefined;

    // read groups in sequential order
    let group_plus_idx = Array.from(this.$._groups.entries());
    group_plus_idx.sort((a, b) => a[0] - b[0]);
    const groups = group_plus_idx.map(([,g]) => g);

    // resultX
    const offset_center_x = offset.x + offset.w/2;
    if (offset_center_x < 0) {
      return null;
    }
    for (const group of groups) {
      let w = 0;
      if (group.dom) {
        w = ((group.dom!.getBoundingClientRect().width / ScaleUtils.getScale(group.dom!).x) / this.$._rem);
      } else {
        w = this.$._size_1x1*4;
      }
      const endX = accX + w;
      const group_horizontal_start = accX;
      resultGroup = group.id;
      if (offset.x < group_horizontal_start - r) {
        return null;
      }
      if (offset.x > group_horizontal_start + w + this.$._size_1x1 / 2) {
        // move on to the next group
        accX += w + this.$._group_gap;
        continue;
      }
      for (resultX = 0; accX < endX; resultX++) {
        if (offset.x < accX + this.$._size_1x1/2) {
          return { group: resultGroup, x: resultX, y: resultY };
        }
        accX += this.$._size_1x1 + this.$._tile_gap;
      }
      return { group: resultGroup, x: resultX, y: resultY };
    }
    // request anonymous group
    return {
      group: undefined,
      x: 0,
      y: resultY,
    };
  }
}