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
  HSlider,
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
  const [checked, set_checked] = React.useState<boolean>(false);

  return (
    <ThemeProvider theme={ThemePresets.dark}>
      <RTLProvider rtl={true}>
        <Primary prefer={false}>
          <Root
            full
            solid
            selection={false}
            style={{
              overflowY: "auto",
            }}>
            <VGroup padding={10} gap={10}>
              <HSlider default={0} start={0} end={10}/>
              <HSlider
                default={0.5}
                integer={false}
                start={0.5}
                end={0.9}
                increment={0.05}
                fixed={2}/>
              <HSlider default={0} stops={[{ value: 0, label: "100x100" }, { value: 1, label: "240x240" }, { value: 2, label: "800x600" }]}/>
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
