# Icons and logos

The `Icon` component is colored automatically as black or white every frame according to the computed cascading `color` property.

The `CircleButton` component represents a circle button consisting of an icon. For example, `ArrowButton` is an alias to `<CircleButton variant="fullArrow{Left|Right|Up|down}" {...rest}/>`.

For built-in icons, use the `variant` property for a component where applicable, or `IconMap.get(Icon("type").toString(), "white|black")` as applicable..

For dynamically-registered icons, use the `dynamic` property.

## Icon registry

Register custom icons with:

```tsx
import { IconMap } from "com.sweaxizone.metro/components";

IconMap.register("iconX", { black: source, white: source });
```

These icons can then be used in for example the `Icon` and `CircleButton` components.

- To unregister a previously registered icon, use `IconMap.unregister()`.
- Retrieve a registered icon's source URI using `IconMap.get()`.

## Logo

Similiarly, for logos, you can use the `Logo` component or `LogoMap`.

Note that `Logo`s use a width and height instead of a square `size` (both are in logical pixels).