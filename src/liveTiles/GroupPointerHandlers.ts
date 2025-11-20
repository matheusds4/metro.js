// local
import type { Core, BulkChange } from "./Core";
import { CoreGroup, CoreTile } from "./CoreGroup";
import { SimpleGroup } from "./SimpleGroup";
import * as MathUtils from "../utils/MathUtils";

//
export class GroupPointerHandlers {
  //
  private group_label: HTMLElement;
  //
  private group_label_text: HTMLElement;

  //
  public constructor(
    private readonly $: Core,
    private readonly node: HTMLDivElement
  ) {
    this.group_label = node.getElementsByClassName(this.$._class_names.groupLabel)[0] as HTMLElement;
    this.group_label_text = this.group_label.getElementsByClassName(this.$._class_names.groupLabelText)[0] as HTMLElement;
  }

  //
  public attach(): void {
    const { group_label } = this;

    // mouse handlers
    fixme();

    // touch handlers
    // 
    // - [ ] prevent default to avoid `click`
    fixme();

    // context menu handlers
    group_label.addEventListener("contextmenu", this.context_menu.bind(this));
  }

  //
  private context_menu(e: PointerEvent): void {
    this.$.dispatchEvent(new CustomEvent("groupContextMenu", {
      detail: {
        group: this.id,
        clientX: e.clientX,
        clientY: e.clientY,
        original: e,
      },
    }));
  }

  //
  private get id(): string {
    return this.node.getAttribute("data-id") ?? "";
  }
}