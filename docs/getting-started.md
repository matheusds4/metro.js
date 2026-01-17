# Getting started

## Installation

Using the NPM package manager:

```sh
npm i com.sweaxizone.metro
```

## Fonts

The library requires the following fonts:

- Noto Sans
- Source Code Pro

They can be explicitly linked using:

```tsx
// link fonts
import "com.sweaxizone.metro/fonts";
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
} from "com.sweaxizone.metro/components";
import { RTLProvider } from "com.sweaxizone.metro/layout";
import {
    ThemePresets,
    ThemeProvider,
} from "com.sweaxizone.metro/theme";

// simple example
function SimpleExample(): React.ReactNode {
    return (
        <ThemeProvider theme={ThemePresets.get("dark")}>
            <Root full solid selection={false}>
                <Label variant="heading">simple</Label>
            </Root>
        </ThemeProvider>
    );
}
```

The `<Root>` component integrates basic style sheets of the Metro design library for its children.

## Primary colors

To opt in to using primary colors in certain components such as heading titles and checkboxes, use the `Primary` context provider:

```tsx
import { Primary } from "com.sweaxizone.metro/theme";

// somewhere in React content
<Primary prefer>
    ...
</Primary>
```

## Right-to-left

Indicate whether a LTR layout or RTL layout is preferred through `RTLProvider`:

```tsx
import { RTLProvider } from "com.sweaxizone.metro/layout";

// somewhere in React content
<RTLProvider rtl={false}>
    ...
</RTLProvider>
```