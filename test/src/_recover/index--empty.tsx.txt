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
  TextInput,
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
    <ThemeProvider theme={ThemePresets.get("dark")}>
      <RTLProvider rtl={false}>
        <Primary prefer={false}>
          <Root
            full
            solid
            selection={false}
            style={{
              overflowY: "auto",
            }}
            wheelVertical>
            <VGroup padding={10} gap={10}>
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
