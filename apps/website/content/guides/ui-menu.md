---
title: "Menu: commands, checked items, and nested popups"
summary: "Compose native popover command menus without confusing active focus with application state."
section: "UI / Collections"
kind: "deep-dive"
order: 242
---

An editor's Document actions menu offers Duplicate and Show guides. Duplicate creates something
and dismisses the menu; Show guides changes a preference and lets the person keep using the popup.
Both must work with keyboard and pointer input, and merely focusing Duplicate must never create a
copy. Building these two commands together exposes the distinction between menu focus, menu
visibility, and application state. If you need to choose a document rather than act on it, start
with the [project-switching walkthrough](/explore/selection-autocomplete-and-command-surfaces).

## A menu with a command and a persistent toggle

Ordinary items close the menu on activation. Checkbox and radio items remain open and expose
caller-owned `checked` state; they do not mutate it for you. The example visibly records a local
command and lets the user keep changing a view preference without reopening the menu.

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Menu from "@typed/ui/Menu";

export const DocumentActions = component(function* () {
  const state = yield* Menu.makeState({ id: "document-actions" });
  const collection = yield* Menu.makeCollection();
  const copies = yield* RefSubject.make(0);
  const showGuides = yield* RefSubject.make(true);
  return html`<section>
    ${Menu.Trigger({ state, content: "Document actions" })}
    ${Menu.Content({ state, collection, label: "Document actions", content: [
      Menu.Item({ state, collection, id: "document-duplicate", textValue: "Duplicate",
        content: "Duplicate", props: { onclick: RefSubject.update(copies, (n) => n + 1) } }),
      Menu.Separator({}),
      Menu.CheckboxItem({ state, collection, id: "document-guides", textValue: "Show guides",
        content: "Show guides", checked: showGuides,
        props: { onclick: RefSubject.update(showGuides, (value) => !value) } }),
    ] })}
    <p>Copies created: ${copies}</p>
    <p>Guides: ${RefSubject.map(showGuides, (value) => value ? "shown" : "hidden")}</p>
  </section>`;
});
```

`Trigger` is a native button wired to the state ID as its popover target. `Content` is a manual
native popover with menu semantics. Its rendered scope owns the state/popover synchronization,
collection references, and event handlers. Opening through the trigger supplies an invoker for
focus restoration. A programmatic `setOpen(state, true)` changes state, but does not invent a
missing invoker element.

## Keyboard focus is not command execution

Up/Down, Home/End, and buffered typeahead move real DOM focus. Unlike Listbox, Menu intentionally
includes disabled items in traversal so unavailable commands can still be discovered. Enter or
Space clicks the active item; Escape closes and requests invoker focus restoration. Tab closes
without cancelling ordinary tab navigation. Mouse entry updates active identity, so keyboard and
pointer movement share one active item.

An ordinary item's handler updates active ID and closes. A checkbox/radio item keeps the popup open,
but your handler still must toggle the boolean or maintain mutual exclusion. `RadioItem` supplies
`menuitemradio` semantics, not a group state machine. Use `Group` for a labeled logical group and
one application value to derive all its checked booleans. `Separator` is a separator, not a disabled
menu item. See the [APG menu pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/) for the user-facing
keyboard model; the implementation supports the particular parts described here, not every optional
interaction in that pattern.

## Give each submenu its own collection

A submenu has its own `Menu.makeState` and `makeCollection`. Render `Menu.SubmenuTrigger` with the
parent state/collection and child `submenu` state. Render the child's `Content` as a sibling popup,
not inside a parent item's label. Its `parent` can explicitly supply `{ state, collection, triggerId }`
for a menu parent; the trigger also registers owner information scoped to its DOM lifetime.
ArrowRight on a submenu trigger opens it; ArrowLeft in the child closes and restores the parent
relationship. Menubar ownership has a separate horizontal policy, covered in [Menubar](/explore/ui-menubar).

A plain nested div with `role=menu` does not establish those relationships. Avoid putting child
popup DOM under a root that would accidentally receive both widgets' bubbling arrow handlers.
Do not assume closing one ordinary item atomically dismisses an arbitrary tree of independently
controlled popovers: test the exact nested hierarchy your application mounts.

## Diagnose the native boundary

[MDN's Popover API guide](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) describes native
show/hide and toggle events. A manual popover is not a dialog or an automatic light-dismiss popup.
Preserve the component's ref and toggle handler in a custom host; losing them can leave `open` and
actual visibility disagreeing. Guard application effects for disabled commands: `aria-disabled`
and the family's inert internal handler do not disable unrelated custom listeners.

Browser checks should cover click-open, first focused item, a disabled item reached by arrows,
checked-state updates that remain open, ordinary activation, Escape restoration, Tab exit, and
submenu return. Inspect `document.activeElement` as well as `activeId`; a state assertion cannot
prove that the browser restored focus. Public parts: [Menu API](/reference/modules/%40typed%2Fui%2FMenu).
