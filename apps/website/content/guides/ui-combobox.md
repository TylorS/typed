---
title: "Combobox: editable queries and committed suggestions"
summary: "Keep input focus stable while navigating filtered suggestions and distinguish text from a validated choice."
section: "UI / Collections"
kind: "deep-dive"
order: 240
---

A shipping form asks for a city. The person types “Bo”, arrows to Boston, then accepts it. During
that interaction, “Bo” is useful text but not yet a known city, and an active Boston suggestion is
not the same fact as a committed address. This guide builds the suggestion interaction first, then
shows where a real shipping form must validate the result. The
[project-switching walkthrough](/explore/selection-autocomplete-and-command-surfaces) develops an
explicit commit boundary; [collection focus](/explore/ui-collections-and-focus) explains the mounted
registry that makes suggestion navigation possible.

## Build an editable city field

This example filters a small, already available dataset. Each suggestion keeps its ID while its
visibility changes. The native label targets the input ID derived from the state's `id`.

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
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

## Query work belongs outside keyboard movement

A large remote search needs cancellation, loading, empty, and error states. Keep requests driven by
the query stream rather than arrow movement; otherwise browsing suggestions restarts the request.
Use [Fx concurrency](/explore/fx-higher-order-and-concurrency) to choose replacement behavior.
The popup uses the [native Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API);
its manual mode is not a modal focus trap and does not give arbitrary outside-click dismissal policy.
Do not put buttons, checkboxes, or another editor inside option content: those require a different
interaction contract, not just a richer visual.

When debugging, first inspect input ID, popup ID, `aria-controls`, and the active option's actual
DOM presence. Then check `value`, `activeId`, and `open` independently. A browser test should type a
query, navigate, assert input focus, accept an item, and verify both popup closure and text. Add an
empty-results case and a result-replacement case; state-only tests cannot prove focus or native
popover synchronization. Public contracts: [Combobox](/reference/modules/%40typed%2Fui%2FCombobox).
