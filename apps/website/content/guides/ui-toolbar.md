---
title: "Toolbar: one keyboard surface for related commands"
summary: "Compose a roving command group while keeping command state and focus state independent."
section: "UI / Collections"
kind: "deep-dive"
order: 246
---

An editor offers Bold and Italic beside the current text. Both can be enabled, so neither is the
single “selected toolbar item.” The toolbar has one keyboard location; the document has two
formatting preferences. We will connect those facts without making arrow navigation toggle text
styles. This extends the [drawing-tools walkthrough](/explore/ui-collections-and-focus) with pressed
state and shows where nested controls would need a different keyboard design.

## Build a formatting toolbar with real state

A toolbar's `activeId` tells you where keyboard focus belongs. Bold and italic are application
preferences, so the example stores them separately and exposes each with `aria-pressed`.

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Toolbar from "@typed/ui/Toolbar";

export const Formatting = component(function* () {
  const state = yield* Toolbar.makeState({ activeId: "format-bold" });
  const collection = yield* Toolbar.makeCollection();
  const bold = yield* RefSubject.make(false);
  const italic = yield* RefSubject.make(false);
  return html`<section>
    ${Toolbar.Root({ state, collection, label: "Text formatting", content: [
      Toolbar.Item({ state, collection, id: "format-bold", content: "Bold",
        props: { "aria-pressed": bold, onclick: RefSubject.update(bold, (value) => !value) } }),
      Toolbar.Item({ state, collection, id: "format-italic", content: "Italic",
        props: { "aria-pressed": italic, onclick: RefSubject.update(italic, (value) => !value) } }),
    ] })}
    <p>Bold: ${RefSubject.map(bold, String)}. Italic: ${RefSubject.map(italic, String)}.</p>
  </section>`;
});
```

`Toolbar.Item`'s default host is a div with button semantics. The root supplies Enter/Space activation
for its active item by clicking that registered element, so the custom effect works for pointer and
keyboard interaction. Keep the actual action on the item, not on active-ID changes. An arrow to
Italic must not toggle it.

## Keep one consistent navigation axis

State defaults to horizontal orientation. Left/Right move between enabled items; vertical mode uses
Up/Down. Home/End select bounds, looping is configurable, and RTL changes horizontal direction.
The root initializes the first enabled item if focused with null active ID. Each item registers its
DOM element and sets active identity on focus; normal operation uses roving DOM focus, with zero
tabindex only on the active item. This family does not implement a buffered printable-key typeahead
handler, so do not promise letter navigation just because Menu has it.

The [APG toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) discusses grouping controls
and avoiding conflicts with controls that already need the toolbar's arrow axis. That distinction
matters when adding a slider or editable field. The current generic root handler does not supply a
complete nested-widget entry/exit mode. A horizontal slider nested in a horizontal toolbar would
need an explicit event/focus design before both can own Left/Right.

For simple toolbar actions, stay with the provided Item contract. For complex nested controls,
consider separate groups or ordinary tab stops and verify the full interaction. Changing roles or
stopping propagation indiscriminately can hide a collision without creating a usable keyboard path.

## Dynamic commands need identity policy

A toolbar collection knows only its mounted elements. Use stable IDs and keyed rendering when
commands reorder. If permissions remove the active command, choose its successor before leaving
focus on a detached element. Disabled commands stay registered but are skipped by normal toolbar
navigation. Disabled is a behavioral input, not a replacement for removing a command that should
not be exposed at all.

Application handlers must enforce their own disabled condition if they can mutate data. A div with
`aria-disabled=true` is not a native disabled button; see
[MDN aria-disabled](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled).
Likewise, checked or pressed state is not managed by Toolbar. Prefer one application source of truth
and derive the visible pressed styling from the same value used for its ARIA state.

Test arrows, Home/End, Enter/Space, and Tab exit against the actual focused node. Assert that arrows
change focus without changing bold/italic, while activation toggles exactly one preference. Add RTL
and disabled-middle-item tests if your product exposes those configurations. A custom host must
keep the registered ref, tabindex, role, and internal event handlers together on its focusable node.
The [Toolbar API](/reference/modules/%40typed%2Fui%2FToolbar) lists those options.
