// third-party
import { gsap } from "gsap";

// local
import * as ComboBoxPlacement from "./ComboBoxPlacement";

/**
 * Provides open and close effects for `ComboBox`es.
 */
export class ComboBoxEffect {
  private upArrow: HTMLElement;
  private downArrow: HTMLElement;
  private dropdown: HTMLElement;
  private optionRects: Map<HTMLElement, DOMRect> = new Map();

  constructor(
    private comboBoxButton: HTMLButtonElement,
    private comboBoxList: HTMLDivElement
  ) {
    const parent = this.comboBoxList.parentElement!;
    this.upArrow = parent.getElementsByClassName("ComboBox-up-arrow")[0] as HTMLElement;
    this.downArrow = parent.getElementsByClassName("ComboBox-down-arrow")[0] as HTMLElement;
    this.dropdown = parent;
  }

  open(finishFn: () => void): AbortController {
    const abortController = new AbortController();

    const upArrowVisible = window.getComputedStyle(this.upArrow).display != "none";
    const downArrowVisible = window.getComputedStyle(this.downArrow).display != "none";
    const upArrowRect = this.upArrow.getBoundingClientRect();
    const downArrowRect = this.downArrow.getBoundingClientRect();
    const options = Array.from(this.comboBoxList.getElementsByClassName("Option")) as HTMLElement[];

    this.optionRects.clear();
    options.forEach(option => this.optionRects.set(option, option.getBoundingClientRect()));

    this.dropdown.classList.add("running-effect");
    this.comboBoxButton.style.pointerEvents = "none";
    this.upArrow.style.display = "none";
    this.downArrow.style.display = "none";

    // const centerX = this.comboBoxButton.getBoundingClientRect().left + this.comboBoxButton.offsetWidth / 2;
    const centerY = this.comboBoxButton.getBoundingClientRect().top + this.comboBoxButton.offsetHeight / 2;

    const selectedOption = options.find(opt => opt.dataset.selected === "true")!;
    selectedOption.style.zIndex = "1999999999";

    let zIndexCounter = 10000;
    let foundSelected = false;
    for (let i = options.length - 1; i >= 0; i--) {
      const option = options[i];
      if (option === selectedOption) {
        foundSelected = true;
        continue;
      }
      if (foundSelected) {
        option.style.zIndex = String(zIndexCounter++);
      }
    }

    const tweens: gsap.core.Tween[] = [];
    options.forEach(option => {
      const rect = this.optionRects.get(option)!;

      if (upArrowVisible ? rect.top + rect.height < upArrowRect.top : false) {
        option.style.display = "none";
        return;
      }

      if (downArrowVisible ? rect.top > downArrowRect.top : false) {
        option.style.display = "none";
        return;
      }

      Object.assign(option.style, {
        position: "fixed",
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        left: `${rect.left}px`,
        top: `${centerY - rect.height/2}px`,
      });

      const tween = gsap.to(option, {
        duration: 0.18,
        top: `${rect.top}px`,
        ease: "power1.out",
        onComplete: () => {
          if (abortController.signal.aborted) {
            return;
          }
          if (tweens.every(t => !t.isActive())) {
            this._abort();
            // scroll
            if (window.getComputedStyle(this.comboBoxList).visibility == "visible") {
              ComboBoxPlacement.scrollDropdownAlignSelected(this.comboBoxButton, this.comboBoxList);
            }
            finishFn();
          }
        }
      });

      tweens.push(tween);
    });

    if (tweens.length == 0) {
      this._abort();
      finishFn();
      // scroll
      if (window.getComputedStyle(this.comboBoxList).visibility == "visible") {
        ComboBoxPlacement.scrollDropdownAlignSelected(this.comboBoxButton, this.comboBoxList);
      }
      return abortController;
    }

    abortController.signal.addEventListener("abort", () => {
      tweens.forEach(t => t.kill());
      this._abort();
    });

    return abortController;
  }

  close(finishFn: () => void): AbortController {
    const abortController = new AbortController();

    const upArrowVisible = window.getComputedStyle(this.upArrow).display != "none";
    const downArrowVisible = window.getComputedStyle(this.downArrow).display != "none";
    const upArrowRect = this.upArrow.getBoundingClientRect();
    const downArrowRect = this.downArrow.getBoundingClientRect();
    const options = Array.from(this.comboBoxList.getElementsByClassName("Option")) as HTMLElement[];

    this.optionRects.clear();
    options.forEach(option => this.optionRects.set(option, option.getBoundingClientRect()));

    this.dropdown.classList.add("running-effect");
    this.comboBoxButton.style.pointerEvents = "none";
    this.upArrow.style.display = "none";
    this.downArrow.style.display = "none";

    const selectedOption = options.find(opt => opt.dataset.selected === "true")!;
    selectedOption.style.zIndex = "1999999999";

    let zIndexCounter = 10000;
    let foundSelected = false;
    for (let i = options.length - 1; i >= 0; i--) {
      const option = options[i];
      if (option === selectedOption) {
        foundSelected = true;
        continue;
      }
      if (foundSelected) {
        option.style.zIndex = String(zIndexCounter++);
      }
    }

    const tweens: gsap.core.Tween[] = [];
    // const centerX = this.comboBoxButton.getBoundingClientRect().left + this.comboBoxButton.offsetWidth / 2;
    const centerY = this.comboBoxButton.getBoundingClientRect().top + this.comboBoxButton.offsetHeight / 2;

    options.forEach(option => {
      const rect = this.optionRects.get(option)!;

      if (upArrowVisible ? rect.top + rect.height < upArrowRect.top : false) {
        option.style.display = "none";
        return;
      }

      if (downArrowVisible ? rect.top > downArrowRect.top : false) {
        option.style.display = "none";
        return;
      }

      Object.assign(option.style, {
        position: "fixed",
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        left: `${rect.left}px`,
        top: `${rect.top}px`,
      });

      const tween = gsap.to(option, {
        duration: 0.18,
        top: `${centerY - rect.height/2}px`,
        ease: "power1.out",
        onComplete: () => {
          if (abortController.signal.aborted) {
            return;
          }
          if (tweens.every(t => !t.isActive())) {
            this._abort(true);
            finishFn();
          }
        }
      });

      tweens.push(tween);
    });

    if (tweens.length == 0) {
      this._abort(true);
      finishFn();
      return abortController;
    }

    abortController.signal.addEventListener("abort", () => {
      tweens.forEach(t => t.kill());
      this._abort();
    });

    return abortController;
  }

  private _abort(close: boolean = false): void {
    const options = Array.from(this.comboBoxList.getElementsByClassName("Option")) as HTMLElement[];
    for (const option of options) {
      option.style.position = "";
      option.style.display = "";
      option.style.width = "";
      option.style.height = "";
      option.style.zIndex = "";
      option.style.left = "";
      option.style.top = "";
    }

    this.comboBoxButton.style.pointerEvents = "";
    if (close) {
      this.dropdown.style.visibility = "hidden";
    }
    this.dropdown.classList.remove("running-effect");
    this.upArrow.style.display = "";
    this.downArrow.style.display = "";
    if (window.getComputedStyle(this.comboBoxList).visibility == "visible") {
      ComboBoxPlacement.scrollDropdownAlignSelected(this.comboBoxButton, this.comboBoxList);
    }
  }
}