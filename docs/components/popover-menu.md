# PopoverMenu

A `PopoverMenu` represents either a popover menu or a context menu.

## Representation

Each item must contain three tags: the icon, the label, and the ending (usually a shortcut or submenu indicator). All of them, except the label, are wrapped in a `span`. For an item representing a submenu, there is a following sibling tag being the sub-popover-menu.

```tsx
<PopoverMenu>
    <Item>
        <span><Icon variant="internetExplorer"/></span>
        <Label>Internet Explorer</Label>
        <span>Ctrl+E</span>
    </Item>

    <Separator/>

    <Item>
        <span></span>
        <Label>Submenu</Label>
        <span><Indicator/></span>
    </Item>
    <PopoverMenu>
        <Item>
            <span></span>
            <Label>Item 1</Label>
            <span></span>
        </Item>
    </PopoverMenu>
</PopoverMenu>
```

## Controller

Attach a `controller: PopoverMenuController` to a `PopoverMenu` tag to explicitly open/close the `PopoverMenu`.