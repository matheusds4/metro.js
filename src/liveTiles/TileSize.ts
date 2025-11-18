/**
 * Tile size.
 */
export type TileSize =
  | "small"
  | "medium"
  | "wide"
  | "large";

/**
 * Returns tile width as 1x1 tile units.
 */
export function getWidth(size: TileSize): number {
  return size == "large" ? 4 : size == "wide" ? 4 : size == "medium" ? 2 : 1;
}

/**
 * Returns tile height as 1x1 tile units.
 */
export function getHeight(size: TileSize): number {
  return size == "large" ? 4 : size == "wide" ? 2 : size == "medium" ? 2 : 1;
}

/**
 * Mapping of tile size variant to tile size pairs (width, height).
 */
export type TileSizeMap = {
  small: TileSizeMapPair;
  medium: TileSizeMapPair;
  wide: TileSizeMapPair;
  large: TileSizeMapPair;
};

/**
 * Tile size pairs (width, height).
 */
export type TileSizeMapPair = { width: number, height: number };