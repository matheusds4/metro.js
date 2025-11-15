# Getting started

## Fonts

The library requires the following fonts:

- Noto Sans
- Nimbus Mono (bold as regular)

They can be explicitly linked using:

```tsx
// link fonts
import "@hydroperx/metrodesign/fonts";
```

## Simple example

```tsx
import React from "react";
import {
    Root,
    Group,
    HGroup,
    VGroup,
    Label,
} from "@hydroperx/metrodesign/components";
import { RTLProvider } from "@hydroperx/metrodesign/layout";
import {
    ThemePresets,
    ThemeProvider,
} from "@hydroperx/metrodesign/theme";

// simple example
function SimpleExample(): React.ReactNode {
    return (
        <ThemeProvider theme={ThemePresets.dark}>
            <Root full solid selection={false}>
                <Label variant="heading">simple</Label>
            </Root>
        </ThemeProvider>
    );
}
```