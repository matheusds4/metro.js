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
  NativeIcons,
  ComboBox,
  Option,
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
  // Layout
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
            <VGroup padding={10}>
              <ComboBox default="foo">
                <Option value="foo">foo</Option>
                <Option value="bar">bar</Option>
                <Option value="qux">qux</Option>
              </ComboBox>
              <ComboBox default="foo" big>
                <Option value="foo">foo</Option>
                <Option value="bar">bar</Option>
                <Option value="qux">qux</Option>
              </ComboBox>
              <ComboBox default="foo" medium>
                <Option value="foo">foo</Option>
                <Option value="bar">bar</Option>
                <Option value="qux">qux</Option>
              </ComboBox>
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
