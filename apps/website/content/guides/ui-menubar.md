---
title: "Menubar: a persistent command row with popup menus"
summary: "Connect horizontal command focus to independently owned submenu popovers."
section: "UI / Collections"
kind: "deep-dive"
order: 243
---

A menubar joins a horizontal command row to independently navigated popup menus. Here File opens
a menu and Help runs an immediate command. The bar and popup use separate collections connected by
`Menu.SubmenuTrigger`. Read [Menu](/explore/ui-menu) first for popup behavior.

## Connect a menu to a menubar item

`Menubar.Item` is an immediate command. A top-level item that opens a menu instead uses
`Menu.SubmenuTrigger`: it registers in the menubar collection while pointing to its own menu state.
The popup is rendered next to the menubar so its keyboard events do not bubble through both roots.

```ts
import { RefSubject } from "@typed/fx";
import { html, component } from "@typed/template";
import * as Menubar from "@typed/ui/Menubar";
import * as Menu from "@typed/ui/Menu";

export const EditorCommands = component(function* () {
  const bar = yield* Menubar.makeState({ activeId: "editor-file" });
  const barItems = yield* Menubar.makeCollection();

  const file = yield* Menu.makeState({ id: "editor-file-menu" });
  const fileItems = yield* Menu.makeCollection();

  const documents = yield* RefSubject.make(1);
  const help = yield* RefSubject.make(false);

  return html`<section>
    ${Menubar.Root({ state: bar, collection: barItems, label: "Editor commands", content: [
      Menu.SubmenuTrigger({ state: bar, collection: barItems, submenu: file,
        id: "editor-file", textValue: "File", content: "File" }),
      Menubar.Item({ state: bar, collection: barItems, id: "editor-help",
        textValue: "Help", content: "Help",
        props: { onclick: RefSubject.update(help, (visible) => !visible) } }),
    ] })}
    ${Menu.Content({ state: file, collection: fileItems, label: "File", content: [
      Menu.Item({ state: file, collection: fileItems, id: "editor-new",
        textValue: "New document", content: "New document",
        props: { onclick: RefSubject.update(documents, (count) => count + 1) } }),
    ] })}
    <p>Open documents: ${documents}</p>
    <p ?hidden=${RefSubject.map(help, (visible) => !visible)}>Choose File to create a document.</p>
  </section>`;
});
```

The menubar and popup do not share a collection: one contains File/Help, the other contains New
document. That separation prevents an arrow on the bar from accidentally landing on a hidden child
command. IDs are globally unique even though each registry is local. The trigger's owner ref links
the menu back to the appropriate parent state and DOM element for return movement.

## Traverse first; activate second

`Menubar.makeState` defaults to horizontal orientation and otherwise uses the Composite policy:
active ID, looping, RTL, and focus configuration. In the normal roving model, the active registered
item is the tab stop. Root focus initializes the first item only when there is no active identity.
Left/Right and Home/End move focus; printable text searches `textValue`. RTL reverses horizontal
movement. Disabled items are included in traversal, but the root avoids activating them.

Enter/Space activate an enabled item. ArrowDown activates only an item registered as a submenu;
it does not invoke an ordinary Help command. `Menu.SubmenuTrigger` supplies that metadata as well
as `aria-haspopup`, `aria-expanded`, and the native popover target. Replacing it with a styled
`Menubar.Item` and an `onclick` does not provide the same owner relationship.

The child uses Menu's Up/Down, Enter/Space, Escape, and Tab behavior. In a horizontal submenu-owner
relationship, the current owner return implementation can move to the preceding bar item on
ArrowLeft. It is not a complete desktop application's menu-switching engine: do not assume all
optional APG cross-menu switching, hover delay, or sibling dismissal rules are supplied. Verify
that any additional policy closes the intended popup and keeps the chosen parent item focused.

<span id="separate-the-focus-surface-from-application-commands"></span>

## Keep commands separate from focus

`activeId` is keyboard location, not a selected preference. Execute commands in click effects, not
on active-ID changes. Checked preferences, disabled custom effects, and native popover synchronization
follow the [Menu contract](/explore/ui-menu).

For multiple menus, test sibling open/close behavior and return focus. If focus enters a hidden
popup, inspect collection membership and DOM nesting first.
The [Menubar API](/reference/modules/%40typed%2Fui%2FMenubar) and
[Menu API](/reference/modules/%40typed%2Fui%2FMenu) document the two cooperating families.
