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
  Tiles,
  TileGroup,
  Tile,
  TilePage,
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
              overflowX: "auto",
            }}
            wheelHorizontal>
            <Tiles
              direction="horizontal"
              dragEnabled
              checkEnabled
              renamingGroupsEnabled
              bulkChange={e => {
                fixme();
              }}
              reorderGroups={e => {
                fixme();
              }}
              renameGroup={e => {
                fixme();
              }}>
              <TileGroup id="group1" index={0}>
                <Tile id="camera" size="medium" background="#937" foreground="white">
                  <TilePage variant="iconLabel">
                    <Group><Icon native="camera"/></Group>
                    <Label>Camera</Label>
                  </TilePage>
                </Tile>
                <Tile id="bing" size="small" background="#e9e900" foreground="white">
                  <TilePage variant="iconLabel">
                    <Group><Icon native="bing"/></Group>
                    <Label>Bing</Label>
                  </TilePage>
                </Tile>
              </TileGroup>
            </Tiles>
          </Root>
        </Primary>
      </RTLProvider>
    </ThemeProvider>
  );
}

// Render App
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
