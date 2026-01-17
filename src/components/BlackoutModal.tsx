// third-party
import React from "react";
import { input } from "com.sweaxizone.inputaction";
import { styled } from "styled-components";

// local
import { ESCAPABLE, MAXIMUM_Z_INDEX } from "../utils/Constants";
import * as EscapableUtils from "../utils/EscapableUtils";

/**
 * A modal displaying a blackout backdrop.
 * 
 * `BlackoutModal` is always visible. It should stay present in DOM
 * only when opened; the `close` event handler should destroy it from
 * the DOM.
 */
export function BlackoutModal(params: {
  className?: string,
  id?: string,
  style?: React.CSSProperties,
  children?: React.ReactNode,
  ref?: React.Ref<null | HTMLDivElement>,

  /**
   * Close event. The specified handler should
   * destroy the modal from the DOM.
   */
  close: () => void,
}): React.ReactNode {
  // basics
  const div_ref = React.useRef<null | HTMLDivElement>(null);
  const close_ref = React.useRef<() => void>(params.close);

  // initialization
  React.useEffect(() => {

    input.on("inputPressed", global_input_pressed);

    // cleanup
    return () => {
      input.off("inputPressed", global_input_pressed);
    };

  }, []);

  // sync `close` handler
  React.useEffect(() => {

    close_ref.current = params.close;

  }, [params.close]);

  // handle input pressed
  function global_input_pressed(): void {
    // escape input action
    if (input.justPressed("escape")) {
      if (EscapableUtils.escapable(div_ref.current!)) {
        close_ref.current?.();
      }
    }
  }

  // handle click
  function modal_click(e: React.MouseEvent<HTMLDivElement>): void {
    let outside = true;
    for (const child of div_ref.current!.children) {
      const r = child.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right
      && e.clientY >= r.top && e.clientY <= r.bottom) {
        outside = false;
        break;
      }
    }
    if (outside) {
      close_ref.current?.();
    }
  }

  return (
    <>
      <BlackoutModal_div
        className={[
          "BlackoutModal",
          ESCAPABLE,
          ...(params.className ?? "").split(" ").filter(c => c != ""),
        ].join(" ")}
        id={params.id}
        style={params.style}
        ref={obj => {
          div_ref.current = obj;
          if (typeof params.ref == "function") {
            params.ref(obj);
          } else if (params.ref) {
            params.ref!.current = obj;
          }
        }}
        onClick={modal_click}>
        {params.children}
      </BlackoutModal_div>
    </>
  );
}

const BlackoutModal_div = styled.div `
  && {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    background: rgba(0,0,0,0.4);
    z-index: ${MAXIMUM_Z_INDEX};
  }
`;