---
title: "Toolbar: one keyboard surface for related commands"
summary: "Reference toolbar focus and pressed state; follow collections and focus for the worked scenario."
section: "UI / Collections"
kind: "reference"
order: 246
---

Bold and Italic are independent pressed values. Toolbar supplies one keyboard location for moving
between them; arrowing to Italic must not toggle it. This example shows that separation. See
[collections and focus](/explore/ui-collections-and-focus) for registration and changing item sets.

## Build a formatting toolbar with real state

A toolbar's `activeId` tells you where keyboard focus belongs. Bold and italic are application
preferences, so the example stores them separately and exposes each with `aria-pressed`.

```ts
import { RefSubject } from "@typed/fx";
import { html, component } from "@typed/template";
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

A slider or editor may already need the toolbar's arrow keys. The generic root does not supply a
nested-widget entry/exit mode, so use separate groups or ordinary tab stops until that interaction
is designed. The [APG toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) explains the conflict.

<span id="dynamic-commands-need-identity-policy"></span>

## Keep focus and pressed state independent

In a browser, arrows should change focus without changing bold/italic; Enter, Space, and click should
toggle only the activated preference. Derive visible pressed styling and `aria-pressed` from the
same value. Guard custom mutation handlers when disabled: `aria-disabled` on the default div host
does not disable arbitrary listeners.

A custom host must retain the ref, tabindex, role, and internal handlers on its focusable element.
The [Toolbar API](/reference/modules/%40typed%2Fui%2FToolbar) lists those options.
