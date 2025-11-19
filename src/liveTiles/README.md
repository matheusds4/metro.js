# Core live tiles

## DOM structure

- Container (the main `<div>`)
  - Groups
    - 1. Group label (a `<div>`)
      - Group label text (a `<span>`)
    - 2. Group tiles (a `<div>`; alternatively called the *tile-list*)
      - Tiles (a `<button>` that should not be scaled up/down)
        - Tile content (a `<div>` with custom content that may be scaled up/down). In general, do any styling (like border, background and tilting) on this `<div>` instead of the tile itself.
  - Tile DND (a `<div>` that contains a tile representing the tile currently dragging)

## Group attributes

- `data-id` - Group ID.
- `data-index` - Group index.
- `data-dragging` - Indicates whether a pointer is actively dragging a group. (`true` or `false`)

## Tile attributes

- `data-id` - Tile ID.
- `data-size` - Tile size matching a `TileSize` variant.
- `data-checked` - Indicates whether a tile is checked. (`true` or `false`)
- `data-x` - Tile X coordinate (1x1).
- `data-y` - Tile Y coordinate (1x1).
- `data-size` - Tile size (indicated by the `TileSize` enumeration: `small` (1x1), `medium` (2x2), `wide` (4x2) and `large` (4x4))