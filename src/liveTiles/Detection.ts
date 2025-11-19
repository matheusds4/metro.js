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
    //
  }
}