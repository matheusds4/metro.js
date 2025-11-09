// register Metro design fonts
import "@hydroperx/metrodesign/fonts";

// third-party
import { createRoot } from "react-dom/client";
import * as React from "react";
import {
  Root,
  Group,
  HGroup,
  VGroup,
  Button,
  Label,
  Icon,
} from "@hydroperx/metrodesign/components";
import { RTLProvider } from "@hydroperx/metrodesign/layout";
import {
  Primary,
  ThemePresets,
  ThemeProvider,
  type Theme,
} from "@hydroperx/metrodesign/theme";

/**
 * The test.
 */
function App() {
  return (
    <ThemeProvider theme={ThemePresets.dark}>
      <RTLProvider rtl={false}>
        <Primary prefer>
          <Root
            full
            solid
            selection={false}
            style={{
              overflowY: "auto",
            }}>
            <VGroup>
            </VGroup>
          </Root>
        </Primary>
      </RTLProvider>
    </ThemeProvider>
  );
}

// Render App
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
