import "com.sweaxizone.w3c.extension";

// constants
export * from "./Constants";

// placement utilities
export type { SimplePlacementType } from "./PlacementUtils";

// cascading `rem` unit utilities
export * as REMConvert from "./REMConvert";
export { REMObserver } from "./REMObserver";

// escapable utilities
export { escapable } from "./EscapableUtils";

// random utilities
export { randomHex } from "./RandomUtils";

// Rectangle
export { Rectangle, type IntersectionSide } from "./Rectangle";

// Point
export { Point } from "./Point";