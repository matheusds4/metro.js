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
  ProgressBar,
  ProgressRing,
  PopoverMenu,
  MenuTrigger,
  Item,
  Indicator,
  Separator,
} from "@hydroperx/metrodesign/components";
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
      <Root
        full
        solid
        selection={false}
        style={{
          overflowY: "auto",
        }}>
        <VGroup>
          <MenuTrigger>
            <Button outline>click me</Button>
            <PopoverMenu>
              <Item>
                <span><Icon type={NativeIcons.INTERNET_EXPLORER}/></span>
                <Label>Internet Explorer</Label>
                <span>Ctrl+E</span>
              </Item>
              <Separator/>
              <Item>
                <span></span>
                <Label>Submenu</Label>
                <span><Indicator/></span>
              </Item>
              <PopoverMenu>
                <Item>
                  <span></span>
                  <Label>Item 1</Label>
                  <span></span>
                </Item>
              </PopoverMenu>
            </PopoverMenu>
          </MenuTrigger>
        </VGroup>
      </Root>
    </ThemeProvider>
  );
}

// Render App
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
