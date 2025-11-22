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
import {
  type TileSize,
} from "@hydroperx/metrodesign/liveTiles";
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
  // our groups
  const [groups, set_groups] = React.useState<MyGroup[]>([
    {
      id: "group1",
      label: "Group 1",
      tiles: [
        { id: "camera", size: "medium", x: -1, y: -1 },
        { id: "bing", size: "small", x: -1, y: -1 },
      ],
    }
  ]);

  // render groups.
  function render_groups(groups: MyGroup[]): React.ReactNode[] {
    let group_nodes: React.ReactNode[] = [];
    for (let [i, group] of groups.entries()) {
      const tile_nodes: React.ReactNode[] = [];
      for (const tile of group.tiles) {
        const node = render_tile(tile);
        if (node) {
          tile_nodes.push(node);
        }
      }
      group_nodes.push(
        <TileGroup key={group.id} id={group.id} index={i} label={group.label}>
          {tile_nodes}
        </TileGroup>
      );
    }
    return group_nodes;
  }

  // render a tile.
  function render_tile(tile: MyTile): undefined | React.ReactNode {
    switch (tile.id) {
      case "camera": {
        return (
          <Tile key={tile.id} id={tile.id} size="medium" background="#937" foreground="white">
            <TilePage variant="iconLabel">
              <Group><Icon native="camera"/></Group>
              <Label>Camera</Label>
            </TilePage>
          </Tile>
        );
      }
      case "bing": {
        return (
          <Tile key={tile.id} id={tile.id} size="small" background="#f9c000" foreground="white">
            <TilePage variant="iconLabel">
              <Group><Icon native="bing"/></Group>
              <Label>Bing</Label>
            </TilePage>
          </Tile>
        );
      }
      default: {
        return undefined;
      }
    }
  }

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
              dragEnabled={false}
              checkEnabled={false}
              renamingGroupsEnabled={false}
              bulkChange={e => {
                //fixme();
              }}
              reorderGroups={e => {
                //fixme();
              }}
              renameGroup={e => {
                //fixme();
              }}>
              {render_groups(groups)}
            </Tiles>
          </Root>
        </Primary>
      </RTLProvider>
    </ThemeProvider>
  );
}

// a tile group
export type MyGroup = {
  id: string,
  label: string,
  tiles: MyTile[],
};

// a tile
export type MyTile = {
  id: string,
  x: number,
  y: number,
  size: TileSize,
};

// Render App
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
