// third-party
import React from "react";

export function Form(params: {
  id?: string;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
  ref?: React.Ref<HTMLFormElement | null>;

  /**
   * Submit event.
   */
  submit?: () => void;
}): React.ReactNode {

  // user submit handler
  const user_submit_handler_sync = React.useRef<undefined | (() => void)>(params.submit);

  // handle submit
  function submit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    user_submit_handler_sync.current?.();
  }

  // sync user `submit` handler
  React.useEffect(() => {
    user_submit_handler_sync.current = params.submit;
  }, [params.submit]);

  return (
    <form
      id={params.id}
      className={["Form", ...(params.className ?? "").split(" ").filter(c => c != "")].join(" ")}
      style={params.style}
      ref={params.ref}
      onSubmit={submit}>

      {params.children}
    </form>
  );
}