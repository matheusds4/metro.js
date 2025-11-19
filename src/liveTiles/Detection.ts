// local
import type { Core } from "./Core";

// node detection for groups and tiles
export class Detection {
  //
  private _timeout: number = - 1;
  //
  private _queue: HTMLElement[] = [];

  //
  public constructor(private readonly $: Core) {
    //
  }

  //
  public detect(node: HTMLElement): void {
    if (this._timeout != -1) {
      window.clearTimeout(this._timeout);
    }
    this._queue.push(node);
    this._timeout = window.setTimeout(() => {
      this._detect_now();
    }, 5);
  }

  //
  private _detect_now(): void {
    let any_changes = false;
    while (this._queue.length != 0) {
      const node = this._queue.shift()!;
      if (node.classList.contains(this.$._class_names.tile)) {
        const this_changed = this._detect_tile(node as HTMLButtonElement);
        any_changes ||= this_changed;
      } else if (node.classList.contains(this.$._class_names.group)) {
        const this_changed = this._detect_group(node);
        any_changes ||= this_changed;
      }
    }
    if (any_changes) {
      this.$.rearrange();
    }
  }

  // detect tile.
  //
  // return false if there were no changes detected.
  private _detect_tile(node: HTMLButtonElement): boolean {
    fixme();
  }

  // detect group.
  //
  // return false if there were no changes detected.
  private _detect_group(node: HTMLElement): boolean {
    fixme();
  }
}