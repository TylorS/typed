---
title: "Combobox: editable queries and committed suggestions"
summary: "Compare query text, active suggestion, and accepted record; use the project picker for the worked flow."
section: "UI / Collections"
kind: "reference"
order: 240
---

A combobox separates query text from the active suggestion. Typing “Bo” and arrowing to Boston
does not yet accept Boston; Enter copies its value into the input and closes suggestions. The
example below demonstrates those transitions. It has no separate committed-record field: validate
the text at submission when a known city ID is required. For a distinct commit boundary, see
[selection and command surfaces](/explore/selection-autocomplete-and-command-surfaces).

## Build an editable city field

This example filters a small, already available dataset. Each suggestion keeps its ID while its
visibility changes. The native label targets the input ID derived from the state's `id`.

```ts
import { RefSubject } from "@typed/fx";
import { html, component } from "@typed/template";
import * as Combobox from "@typed/ui/Combobox";

export const CityField = component(function* () {
  const state = yield* Combobox.makeState({ id: "shipping-city" });
  const collection = yield* Combobox.makeCollection();

  const cities = [
    { id: "city-amsterdam", name: "Amsterdam" },
    { id: "city-boston", name: "Boston" },
    { id: "city-chicago", name: "Chicago" },
  ];

  const matches = RefSubject.map(state, ({ value }) => cities.filter(
    (city) => city.name.toLowerCase().includes(value.toLowerCase()),
  ));

  return html`<div>
    <label for="shipping-city-input">Shipping city</label>
    ${Combobox.Input({ state, collection, placeholder: "Type a city" })}
    ${Combobox.Popover({ state, collection, content: cities.map((city) =>
      Combobox.Item({ state, collection, id: city.id, value: city.name,
        content: city.name,
        props: { "?hidden": RefSubject.map(matches, (items) => !items.includes(city)) },
      }),
    ) })}
    <p role="status">${RefSubject.map(matches, (items) =>
      items.length === 0 ? "No matching cities" : `${items.length} suggestions`)}
    </p>
  </div>`;
});
```

`makeState` starts with empty `value`, closed `open`, and null `activeId` unless configured.
`setValue(state, text)` updates the text, clears the active identity, and opens suggestions.
Typing uses that transition. Arrow navigation changes only `activeId`; choosing an item writes its
`value` and closes the popup. `aria-selected` on an item compares its value to the input value,
so the highlighted active suggestion and a matching selected value are separate observations.

Do not use `value` alone as proof that a person committed a valid domain record. An exact city name
can also be typed. If a shipping address requires a known city ID, validate the text against the
current allowed dataset at submission and store the resulting domain identity separately. This
family has no separate public committed-value field or generic `onSelect` option.

## Follow the input's focus contract

Input focus opens the native manual popover. ArrowDown and ArrowUp navigate visible enabled
registered items and scroll the active suggestion into view. Enter accepts an active suggestion;
with no active ID it leaves the event alone. Escape closes the popup. Home, End, Left, and Right
retain native input editing behavior: the family does not repurpose them for list navigation.
Options use virtual focus, so keyboard navigation keeps `document.activeElement` on the input and
changes `aria-activedescendant`. The [APG combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
describes several variants; this family implements an editable input with list suggestions, not
all popup types or inline completion variants in that document.

[MDN's active-descendant reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-activedescendant)
explains why the referenced ID must identify an existing element. Filtering here uses `hidden`,
which the implementation explicitly excludes by checking the registered element's hidden ancestor.
CSS opacity is not equivalent filtering. If remote results replace the collection, clear any stale
active identity and reconcile results with the latest query before exposing them. A loading message
is not an option and should not register as one.

<span id="query-work-belongs-outside-keyboard-movement"></span>

## Extending the suggestion interaction

For remote suggestions, drive requests from query changes, not arrow movement. Choose cancellation
and replacement behavior with [Fx concurrency](/explore/fx-higher-order-and-concurrency).
The popup uses the [native Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API);
its manual mode is not a modal focus trap and does not give arbitrary outside-click dismissal policy.
Do not put buttons, checkboxes, or another editor inside option content: those require a different
interaction contract, not just a richer visual.

To check the interaction, type, navigate, and accept a suggestion. Focus should remain on the input,
`aria-activedescendant` should name a visible option, and acceptance should update text and close
the popup. Inspect `value`, `activeId`, and `open` separately when those observations disagree.
Public contracts: [Combobox](/reference/modules/%40typed%2Fui%2FCombobox).
