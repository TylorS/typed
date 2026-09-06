---
title: "Menubar: a persistent command row with popup menus"
summary: "Connect horizontal command focus to independently owned submenu popovers."
section: "UI / Collections"
kind: "deep-dive"
order: 243
---

An editor keeps File and Help available above the document. File opens a popup; Help immediately
reveals instructions. A user should be able to tab into this row, arrow between its labels, and open
File without adding every child command to the page's Tab sequence. This is a menubar interaction,
not ordinary website navigation. We will build the bar and popup as separate focus scopes joined
by one trigger. Read [Menu](/explore/ui-menu) first if native command popups are unfamiliar.

## Connect a menu to a menubar item

`Menubar.Item` is an immediate command. A top-level item that opens a menu instead uses
`Menu.SubmenuTrigger`: it registers in the menubar collection while pointing to its own menu state.
The popup is rendered next to the menubar so its keyboard events do not bubble through both roots.

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
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

## Separate the focus surface from application commands

An item has no `selected` setting: `activeId` means keyboard location. If a command enables an
editor feature, store that preference separately and expose its state using the appropriate
checked menu item or toolbar toggle. Keep command execution in the click effect, and guard disabled
application effects explicitly. Do not run actions when observing every active-ID change.

The [APG menu and menubar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/) describes the
expected distinction between persistent menubars and popup menus. The
[native Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) governs the actual
popup lifecycle. Neither adding `role=menubar` nor putting a native popover nearby wires the two
keyboard scopes together; use the public trigger contract.

Test the bar independently with two immediate items, then add one submenu and test Down, Escape,
and Left return. For multiple menus, explicitly test sibling open/close behavior. If focus jumps
inside a hidden popup, inspect collection membership and DOM nesting before changing key mappings.
The [Menubar API](/reference/modules/%40typed%2Fui%2FMenubar) and
[Menu API](/reference/modules/%40typed%2Fui%2FMenu) document the two cooperating families.
