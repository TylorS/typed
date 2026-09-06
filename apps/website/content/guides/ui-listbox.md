---
title: "Listbox: visible choices with selection following focus"
summary: "Build a persistent single-choice list and understand when navigation commits the value."
section: "UI / Collections"
kind: "deep-dive"
order: 241
---

A theme preview offers Light, Dark, and High contrast in a visible list. Arrowing from Light to
Dark should immediately change the preview, while an eventual Save action can remain separate.
That makes the example a good fit for Listbox: focus movement is allowed to commit its local value.
We will connect the visible choice to preview state and then examine what changes when the list is
dynamic or the choice has expensive consequences. The
[project-switching walkthrough](/explore/selection-autocomplete-and-command-surfaces) contrasts this
with a choice that waits for explicit acceptance.

## Render a choice and observe its value

The option's DOM identity is distinct from the application value. This matters when IDs must be
prefixed to keep multiple listboxes unique while the saved values remain ordinary domain strings.

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Listbox from "@typed/ui/Listbox";

export const PreviewTheme = component(function* () {
  const state = yield* Listbox.makeState({ value: "light", activeId: "preview-light", loop: false });
  const collection = yield* Listbox.makeCollection();
  return html`<section>
    <h2>Preview appearance</h2>
    ${Listbox.Root({ state, collection, label: "Preview theme", content: [
      Listbox.Option({ state, collection, id: "preview-light", value: "light", content: "Light" }),
      Listbox.Option({ state, collection, id: "preview-dark", value: "dark", content: "Dark" }),
      Listbox.Option({ state, collection, id: "preview-contrast", value: "contrast",
        textValue: "High contrast", content: "High contrast" }),
    ] })}
    <p>Current preview: ${RefSubject.map(state, ({ value }) => value ?? "None")}</p>
  </section>`;
});
```

The root and all options share one state and one collection. The collection is optional in the
low-level props because custom integrations may provide their own behavior, but omit it here and
you lose the root's keyboard traversal. Register the actual option element through the component's
ref; mounting labels elsewhere does not make them collection items.

## Selection is an intentional side effect of navigation

`Listbox.select(state, id, value)` sets both active ID and value. An enabled option calls it on
focus and click. `Listbox.move` finds the next enabled registered item, commits its value, focuses
its element, and scrolls it. Root focus initializes the first enabled item only when `activeId` is
null. A preselected value should therefore be paired with its corresponding active ID as above;
`value` by itself is not a lookup request to initialize focus.

Up/Down and Home/End traverse the vertical collection. Printable keys use the buffered typeahead
search against `textValue`, which otherwise defaults to `value`. Default looping is enabled;
`loop: false` is appropriate when reaching the end should stop. The active option has tabindex zero,
the other options minus one: this is real roving DOM focus. The root's active-descendant helper does
not turn the default `virtualFocus: false` state into a virtual-focus widget.

The [APG listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/) covers single and multiple
selection variants. Typed's state stores one nullable string value and exposes no built-in range,
modifier-key, or multi-selection policy. Adding `aria-multiselectable` in `props` would advertise
behavior that this state machine does not implement. Likewise, a nested button cannot retain its
ordinary semantics simply by placing it inside an option.

## Separate previewing from saving

Because keyboard focus commits the listbox value, use that value for a reversible preview. If a
choice starts costly work or needs confirmation, maintain an application draft and a separate Save
control, or use a selection pattern with a distinct commit step. ARIA selection is not form
serialization: these div-based options do not supply a successful named form control. Integrate a
hidden input or the application's form state deliberately; see [forms](/explore/forms-as-a-browser-contract).

Disabled options are registered but skipped by normal movement and guarded by the family handlers.
If your custom click effect can change application data, enforce the same disabled condition there;
ARIA alone does not disable arbitrary listeners. [MDN's aria-disabled reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled)
explains that distinction.

For dynamic choices, preserve stable IDs through keyed rendering. Removing the active choice needs
an explicit successor or null state before the next keyboard interaction; the registry is not a
selection reconciliation engine. Check that exactly one enabled option is selected, only the active
option is in the tab sequence, and the focused DOM node agrees with state after arrows and typeahead.
Test an initial value, disabled middle option, empty list, and active-item removal. Use the
[Listbox API](/reference/modules/%40typed%2Fui%2FListbox) for the state transitions and component props.
