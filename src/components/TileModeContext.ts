// third-party
import React from "react";

// internal
export type TileMode = {
  checking: boolean,
  dnd: boolean,
};

// internal context
export const TileModeContext = React.createContext<TileMode>({
  checking: false,
  dnd: false,
});