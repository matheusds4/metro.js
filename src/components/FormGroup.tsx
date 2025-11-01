// third-party
import { styled } from "styled-components";
import { useContext } from "react";

// local
import { RTLContext } from "../layout/RTL";

/**
 * A form group more commonly contains a label
 * followed by a form control.
 */
export function FormGroup(params: {
  vertical?: boolean;
  id?: string,
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  // ?RTL
  const rtl = useContext(RTLContext);

  return (
    <Div
      $vertical={!!params.vertical}
      $rtl={rtl}
      style={params.style}
      className={params.className}
      id={params.id}
    >
      {params.children}
    </Div>
  );
}

// css
const Div = styled.div<{
  $vertical: boolean;
  $rtl: boolean;
}>`
  && {
    display: flex;
    flex-direction: ${$ => $.$vertical ? "column" : !$.$rtl ? "row" : "row-reverse"};
    ${$ => $.$vertical ? "" : "justify-content: space-between;"}
    align-items: center;
    gap: 1rem;
  }

  ${$ => $.$vertical ? "" : `
    && > label, && > span, && > h1, && > h2, && > h3, && > h4, && > h5 {
      ${$.$rtl ? "text-align: right;" : ""}
    }
  `}
`;