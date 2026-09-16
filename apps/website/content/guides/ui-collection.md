---
title: "Collection: mounted item identity and order"
summary: "Register runtime element handles with scope cleanup and explicit navigation metadata."
section: "UI / Foundations"
kind: "deep-dive"
order: 292
---

`Collection` tracks mounted items by stable ID, including their element handles and navigation metadata. A keyboard controller can use that inventory to find enabled items in document order. Selection and active-ID state stay separate from the mounted elements.

Start with [component lifetime](/explore/ui-component). After registering items here, [Composite](/explore/ui-composite) adds movement and focus. `Collection.makeState<Value, Element>()` creates a plain scoped RefSubject of items, not a hydrated state object. Serializing DOM handles would be the wrong boundary.

<span id="register-report-actions-at-their-element-lifetime"></span>

## Register controls for their mounted lifetime

The count reflects mounted controls. Each checkbox still supplies its own native interaction; registration does not add keyboard movement between them.

```ts
import { RefSubject } from "@typed/fx";
import { html, component } from "@typed/template";
import * as Collection from "@typed/ui/Collection";

const RegisteredControls = component(function* () {
  const items = yield* Collection.makeState<string, HTMLInputElement>();
  const count = RefSubject.map(items, (registered) => registered.length);

  return html`
    <fieldset>
      <legend>Preview options</legend>
      <label>
        <input type="checkbox"
          ref=${Collection.ref(items, { id: "show-grid", value: "grid", textValue: "Show grid" })}>
        Show grid
      </label>
      <label>
        <input type="checkbox"
          ref=${Collection.ref(items, { id: "show-guides", value: "guides", textValue: "Show guides" })}>
        Show guides
      </label>
      <p>${count} controls mounted</p>
    </fieldset>
  `;
});
```

`ref` turns item metadata into an element callback. When run, it calls `register` with the actual element and adds a finalizer to the current Scope. Removing one item therefore removes its registration at that item's lifetime. Registering every element in a long-lived parent Scope would delay cleanup until that parent ends.

## Know what identifies an item

An item has a stable `id`, optional `element`, `disabled`, `submenu`, `textValue`, and `value`. Registration upserts by ID; another item with the same ID replaces the entry. IDs should represent logical items, not positions that change after sorting. `textValue` gives typeahead a useful label without querying incidental rendered markup.

The finalizer removes only the exact item instance it registered. An old Scope ending must not unregister a newer replacement that reused the same ID. Explicit `unregister(collection, id)` is different: it removes the current entry by ID, so use it only when that is the intended authority.

Equality compares element handles by identity and metadata/value appropriately; it does not traverse browser internals. Reuse the actual host element, not a detached clone or a wrapper whose position differs from the control.

## Registration order is not visual order

`enabledItems` excludes `disabled: true`. `byDomOrder` returns a sorted copy using `compareDocumentPosition` where available, preserving fallback order when handles cannot be compared. Data-only collections are valid for tests, but cannot prove browser order after DOM movement. Reordering registered controls does not require reassigning their IDs.

Disabled metadata does not disable a button by itself. Bind native disabled or ARIA behavior through the relevant UI family, and keep that state consistent with navigation metadata. The collection does not select an item, move focus, install key handlers, or assign roles; these belong to the family or Composite controller.

Continue with [Composite](/explore/ui-composite) to turn this inventory into movement, focus, scrolling, and typeahead. API: [Collection](/reference/modules/%40typed%2Fui%2FCollection).
