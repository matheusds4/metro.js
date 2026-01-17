// third-party
import { Color, ColorObserver } from "com.sweaxizone.color";
import React from "react";
import { styled, keyframes } from "styled-components";
import extend from "extend";
import assert from "assert";

// local
import { Logo as ELogo } from "../enum/Logo";
import * as REMConvert from "../utils/REMConvert";

/**
 * Logo parameters.
 */
export type LogoParams = {
  /**
   * Logo ID.
   */
  dynamic?: string;
  /**
   * Identifies an logo included in the Metro design library.
   */
  variant?: ELogo,
  /**
   * Width in logical pixels.
   */
  width?: number;
  /**
   * Height in logical pixels.
   */
  height?: number,
  style?: React.CSSProperties;
  id?: string,
  className?: string;
};

/**
 * Static logo map.
 */
export const LogoMap = {
  register(type: string, sources: { black: any; white: any }): void {
    logoMap.set(type, {
      black: typeof sources.black == "string" ? sources.black : sources.black.src,
      white: typeof sources.white == "string" ? sources.white : sources.white.src,
    });
  },
  registerMap(map: Map<string, { black: any; white: any }>): void {
    for (const [type, sources] of map) {
      LogoMap.register(type, sources);
    }
  },
  unregister(type: string): void {
    logoMap.delete(type);
  },
  get(type: string, color: "white" | "black"): any {
    const m = logoMap.get(type);
    assert(m !== undefined, "Logo is not defined: " + type);
    return m[color];
  },
  /**
   * Returns the logo map.
   */
  snapshot(): Map<string, { black: any; white: any }> {
    return new Map(logoMap.entries().map(p => structuredClone(p)));
  },
  /**
   * Clears logo map.
   */
  clear(): void {
    logoMap.clear();
  },
};

// logo map
const logoMap = new Map<string, { black: any; white: any }>();

// initial registers
LogoMap.registerMap(new Map([
  // [ELogo("example"), { black: example_black, white: example_white }],
]));

const Img = styled.img<{
  $computed_width: string;
  $computed_height: string;
}>`
  && {
    object-fit: contain;
    width: ${$ => $.$computed_width};
    height: ${$ => $.$computed_height};
    vertical-align: middle;
  }
`;

/**
 * Logo component.
 */
export function Logo(params: LogoParams) {
  // image ref
  const ref = React.useRef<null | HTMLImageElement>(null);

  // logo color
  const color_ref = React.useRef<string>("white");

  // logo type
  assert(!!params.dynamic || !!params.variant, "Logo type must be specified.");
  const type = React.useRef(params.dynamic ?? ELogo(params.variant!));

  // compute size
  const computed_width = params.width !== undefined ? REMConvert.pixels.remPlusUnit(params.width) : "100%";
  const computed_height = params.height !== undefined ? REMConvert.pixels.remPlusUnit(params.height) : "100%";

  // adjust color
  React.useEffect(() => {
    const color_observer = new ColorObserver(ref.current!, (color: Color) => {
      const new_color = color.isLight() ? "white" : "black";
      if (new_color !== color_ref.current) {
        color_ref.current = new_color;

        // update source
        const m = logoMap.get(type.current);
        assert(m !== undefined, "Logo is not defined: " + type.current);
        ref.current!.src = (m as any)[new_color];
      }
    });

    return () => {
      color_observer.cleanup();
    };
  }, []);

  // sync logo type
  React.useEffect(() => {
    type.current = params.dynamic ?? ELogo(params.variant!);

    // update source
    const m = logoMap.get(type.current);
    assert(m !== undefined, "Logo is not defined: " + type.current);
    ref.current!.src = (m as any)[color_ref.current!];

  }, [params.dynamic, params.variant]);

  const m = logoMap.get(type.current);
  assert(m !== undefined, "Logo is not defined: " + type.current);
  return (
    <Img
      ref={ref}
      src={(m as any)[color_ref.current]}
      draggable={false}
      alt={params.dynamic}
      style={params.style}
      className={["Logo", ...(params.className ?? "").split(" ").filter(c => c != "")].join(" ")}
      id={params.id}
      $computed_width={computed_width}
      $computed_height={computed_height}
    ></Img>
  );
}