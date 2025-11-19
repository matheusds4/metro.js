# Core live tiles

## DOM structure

- Container (the main `<div>`)
  - Groups
    - 1. Group label (a `<div>`)
      - Group label text (a `<span>`)
      - Conditionally present *Group label input* (an `<input type="text">`)
    - 2. Group tiles (a `<div>`; alternatively called the *tile-list*)
      - Tiles (a `<button>` that should not be scaled up/down)
        - Tile content (a `<div>` with custom content that may be scaled up/down). In general, do any styling (like border, background and tilting) on this `<div>` instead of the tile itself.
  - Tile DND (a `<div>` that contains a tile representing the tile currently dragging)

## Group list

- For representing a group list, you need a `Map<number, T>` array (`index => T`). You should manually optimize this map so that indices are zero-based and contiguous. A common trick is to defer group re-order, accumulating them, so that same-time group moves will result in a consistent order when optimizing the map.

## Tile rules

- When any of the (x, y) coordinates is given `-1` or unspecified, tiles go to the best last position (as if both (x, y) were omitted).

## Group attributes

- `data-id` - Read-only group ID.
- `data-index` - Group index.
- `data-label` - Group label.
- `data-dragging` - *(Set by this library only.)* Indicates whether a pointer is actively dragging a group. (`true` or `false`)

## Tile attributes

During tile addition, if `data-x` and `data-y` are `-1` or unspecified, the tile is added to the best last position, triggering a `bulkChange` event with `.movedTiles` entries.

- `data-id` - Read-only tile ID. MUST BE unique across groups.
- `data-checked` - *(Set by this library only.)* Indicates whether a tile is checked. (`true` or `false`)
- `data-x` - Tile X coordinate (1x1).
- `data-y` - Tile Y coordinate (1x1).
- `data-size` - Tile size (indicated by the `TileSize` enumeration: `small` (1x1), `medium` (2x2), `wide` (4x2) and `large` (4x4))