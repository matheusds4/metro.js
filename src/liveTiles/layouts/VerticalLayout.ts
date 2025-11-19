// third-party
import getOffset from "getoffset";

// local
import { Layout, SnapResult } from "./Layout";
import type { Core } from "../Core";
import * as OffsetUtils from "../../utils/OffsetUtils";
import * as ScaleUtils from "../../utils/ScaleUtils";

// vertical layout
export class VerticalLayout extends Layout {
  //
  public constructor($: Core) {
    super($);
  }

  /**
   * Rearranges everything.
   */
  public override rearrange(): void {
    // column Y in REM
    const column_y = new Map<number, number>();
    // group width in REM
    const group_w = this.$._group_width*this.$._size_1x1 + (this.$._group_width-1)*this.$._tile_gap;
    // parent width in REM
    const parent_w = this.$._inline_groups*group_w + (this.$._inline_groups-1)*this.$._group_gap;
    // parent height in REM
    let parent_h = 0;
    let max_rows_found = new Map<number, number>();

    // read groups in sequential order
    let groups = Array.from(this.$._groups.entries());
    groups.sort((a, b) => a[0] - b[0]);

    // rearrange group tiles and reposition groups
    for (const [i, group] of groups) {
      this.rearrangeGroup(group);

      // ignore from layout any group being dragged.
      if (group.dom?.getAttribute("data-dragging") == "true") {
        continue;
      }

      // reposition group
      const column = i % this.$._inline_groups;
      const left = column*group_w + column*this.$._group_gap;
      const top = column_y.get(column) ?? 0;
      let h = 0;
      if (group.dom) {
        group.dom!.style.transform = `translateX(${left}rem) translateY(${top}rem)`;
        h = ((group.dom!.getBoundingClientRect().height / ScaleUtils.getScale(group.dom!).y) / this.$._rem);
      } else {
        h = this.$._size_1x1*2;
      }
      parent_h = Math.max(parent_h, top + h);
      column_y.set(column, top + h + this.$._group_gap);
      max_rows_found.set(column, (max_rows_found.get(column) ?? 0) + 1);
    }

    // parent height has some additional increase
    parent_h += this.$._size_1x1*2;

    // set parent size
    const max_rows = Math.max(...Array.from(max_rows_found.values()));
    parent_h += max_rows == 0 ? 0 : (max_rows - 1) * this.$._group_gap;
    this.$._container.style.width = parent_w + "rem";
    this.$._container.style.height = parent_h + "rem";
  }

  /**
   * Snaps location to grid.
   */
  public override snap(tileDND: HTMLElement): null | SnapResult {
    // disclamer: some AI used for that.

    // base offset
    const offset = getOffset(tileDND, this.$._container)!;
    OffsetUtils.divideOffsetBy(offset, this.$._rem);

    // basics
    let resultX = 0, resultY = 0;
    const column_y = new Map<number, number>();

    // resultX: find group and tile index
    const groupWidth = this.$._group_width*this.$._size_1x1 + (this.$._group_width-1)*this.$._tile_gap;
    if (offset.x < (-this.$._size_1x1*2) - this.$._tile_gap*4) {
      return null;
    }
    let groupIdx = -1;
    let groupColumn = -1;
    let groupStartX = 0;
    for (let col = 0; col < this.$._inline_groups; col++) {
      const startX = col * groupWidth + col*this.$._group_gap;
      const endX = startX + groupWidth;
      if (offset.x >= startX - this.$._size_1x1/2 - this.$._tile_gap && offset.x < endX + this.$._size_1x1/2) {
        groupColumn = col;
        groupStartX = startX;
        break;
      }
    }
    if (groupColumn === -1) {
      return null;
    }
    //

    // read groups in sequential order
    let group_plus_idx = Array.from(this.$._groups.entries());
    group_plus_idx.sort((a, b) => a[0] - b[0]);
    const groups = group_plus_idx.map(([,g]) => g);

    // find groupIdx in this.groups for this column
    for (let i = 0, col = 0; i < groups.length; i++, col = i % this.$._inline_groups) {
      if (col === groupColumn) {
        groupIdx = i;
        break;
      }
    }
    // find tile index within group
    let tileX = 0;
    let tileStartX = groupStartX;
    for (; tileX < this.$._group_width; tileX++) {
      if (offset.x < tileStartX + this.$._size_1x1/2) {
        break;
      }
      tileStartX += this.$._size_1x1 + this.$._tile_gap;
    }
    resultX = tileX;
    // resultY
    // compute vertical positions for each group as in rearrange()
    const groupTops = new Map<number, number>(); // group index -> top Y
    for (let i = 0; i < groups.length; i++) {
      const column = i % this.$._inline_groups;
      const prevY = column_y.get(column) ?? 0;
      groupTops.set(i, prevY);
      const group = groups[i];
      let h = 0;
      if (group.dom) {
        h = ((group.dom!.getBoundingClientRect().height / ScaleUtils.getScale(group.dom!).y) / this.$._rem);
      } else {
        h = this.$._size_1x1*2;
      }
      column_y.set(column, prevY + h + this.$._group_gap);
    }
    // now snap to the group in the correct column whose bounds contain offset.y
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const column = i % this.$._inline_groups;
      if (column !== groupColumn) {
        continue;
      }
      const groupStartY = groupTops.get(i)!;
      let h = 0;
      if (group.dom) {
        h = ((group.dom!.getBoundingClientRect().height / ScaleUtils.getScale(group.dom!).y) / this.$._rem);
      } else {
        h = this.$._size_1x1*2;
      }
      const groupEndY = groupStartY + h;
      if (offset.y >= groupStartY-this.$._size_1x1 && offset.y < groupEndY+this.$._size_1x1) {
        // snap to tile within group
        let accY = groupStartY + this.$._label_height + this.$._tile_gap;
        let tileY = 0;
        for (; accY < groupEndY; tileY++) {
          if (offset.y < accY + this.$._size_1x1/2) {
            resultY = tileY;
            return {
              group: group.id,
              x: resultX,
              y: resultY,
            };
          }
          accY += this.$._size_1x1 + this.$._tile_gap;
        }
        resultY = tileY;
        return {
          group: group.id,
          x: resultX,
          y: resultY,
        };
      }
    }
    // request an anonymous group
    return {
      group: undefined,
      x: 0,
      y: 0,
    };
  }
}