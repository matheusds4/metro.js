// third-party
import React from "react";

// local
import { Icon } from "./Icon";
import { RTLContext } from "../layout/RTL";

/**
 * A context-dependent indicator icon.
 *
 * # Popover menus
 * 
 * Currently used
 * inside a `PopoverMenu`'s `Item`,
 * inside the third child tag, as in:
 * 
 * ```
 * <Item>
 *     <span></span>
 *     <Label>More</Label>
 *     <span><Indicator/></span>
 * </Item>
 * <PopoverMenu>
 *     ...
 * </PopoverMenu>
 * <Item>
 *     <span></span>
 *     <Label>Enable me (1)</Label>
 *     <span><Indicator state="checked"/></span>
 * </Item>
 * <Item>
 *     <span></span>
 *     <Label>Enable me (2)</Label>
 *     <span><Indicator state="none"/></span>
 * </Item>
 * <Item>
 *     <span></span>
 *     <Label>Option A</Label>
 *     <span><Indicator state="option"/></span>
 * </Item>
 * <Item>
 *     <span></span>
 *     <Label>Option B</Label>
 *     <span><Indicator state="none"/></span>
 * </Item>
 * ```
 */
export function Indicator(params: {
  /**
   * Whether the indicator is checked, invisible (`"none"`)
   * or a popover menu indicator.
   *
   * @default "popoverMenu"
   */
  state?: IndicatorState,

  /**
   * Indicator size.
   */
  size?: number,
}) {
  // div
  const div = React.useRef<null | HTMLDivElement>(null);

  // indicator type
  const [indicator_type, set_indicator_type] = React.useState<IndicatorState>(params.state ?? "popoverMenu");

  // ?rtl
  const rtl = React.useContext(RTLContext);

  // initialization
  React.useEffect(() => {
    const div_el = div.current!;
    if (div_el.parentElement?.parentElement?.parentElement?.parentElement?.classList.contains("PopoverMenu")) {
      set_indicator_type("popoverMenu");
    }
  }, []);

  // detect changes to the `state` parameter.
  React.useEffect(() => {
    set_indicator_type(params.state ?? indicator_type);
  }, [params.state]);

  return (
    <div
      className="Indicator"
      ref={div}>

      {
        indicator_type == "popoverMenu" ?
          <Icon native={rtl ? "arrowLeft" : "arrowRight"} size={params.size ?? 20}/> :
        indicator_type == "checked" ?
          <Icon native="checked" size={params.size ?? 20}/> :
        indicator_type == "option" ?
          <Icon native="bullet" size={params.size ?? 20}/> :
          undefined
      }
    </div>
  );
}

export type IndicatorState =
  | "none"
  | "checked"
  | "option"
  | "popoverMenu";