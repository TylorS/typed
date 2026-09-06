---
title: "Collection: mounted item identity and order"
summary: "Register runtime element handles with scope cleanup and explicit navigation metadata."
section: "UI / Foundations"
kind: "deep-dive"
order: 292
---

A command group needs more than an array of labels: keyboard movement must know which items are mounted, their current document order, and which are disabled. `Collection` stores that runtime inventory. It intentionally separates mounted element handles from serializable selection or active-ID state.

Read [component lifetime](/explore/ui-component) and then [Composite](/explore/ui-composite), which consumes collections. `Collection.makeState<Value, Element>()` creates a plain scoped RefSubject of items, not a hydrated state object. Serializing DOM handles would be the wrong boundary.

## Register report actions at their element lifetime

This inventory reports how many commands are currently mounted. It does not claim toolbar keyboard behavior; the buttons remain independent native controls.

```ts
import { Effect } from "effect";
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Collection from "@typed/ui/Collection";

const ReportCommands = <E, R, E2, R2>(
  exportReport: Effect.Effect<void, E, R>,
  printReport: Effect.Effect<void, E2, R2>,
) => component(function* () {
  // Commands retain their error and service requirements in the rendered result.
  const items = yield* Collection.makeState<string, HTMLButtonElement>();
  const count = RefSubject.map(items, (registered) => registered.length);
  return html`
    <section aria-label="Report actions">
      <button type="button" onclick=${exportReport}
        ref=${Collection.ref(items, { id: "report-export", value: "export", textValue: "Export CSV" })}>
        Export CSV
      </button>
      <button type="button" onclick=${printReport}
        ref=${Collection.ref(items, { id: "report-print", value: "print", textValue: "Print report" })}>
        Print report
      </button>
      <p>${count} actions available</p>
    </section>
  `;
});
const reportCommands = ReportCommands(Effect.void, Effect.void);
```

`ref` turns item metadata into an element callback. When run, it calls `register` with the actual element and adds a finalizer to the current Scope. Removing one item therefore removes its registration at that item's lifetime. Registering every element in a long-lived parent Scope would delay cleanup until that parent ends.

## Know what identifies an item

An item has a stable `id`, optional `element`, `disabled`, `submenu`, `textValue`, and `value`. Registration upserts by ID; another item with the same ID replaces the entry. IDs should represent logical items, not positions that change after sorting. `textValue` gives typeahead a useful label without querying incidental rendered markup.

The finalizer removes only the exact item instance it registered. An old Scope ending must not unregister a newer replacement that reused the same ID. Explicit `unregister(collection, id)` is different: it removes the current entry by ID, so use it only when that is the intended authority.

Equality compares element handles by identity and metadata/value appropriately; it does not traverse browser internals. Reuse the actual host element, not a detached clone or a wrapper whose position differs from the control.

## Registration order is not visual order

`enabledItems` excludes `disabled: true`. `byDomOrder` returns a sorted copy using `compareDocumentPosition` where available, preserving fallback order when handles cannot be compared. Data-only collections are valid for tests, but cannot prove browser order after DOM movement. Reordering registered controls does not require reassigning their IDs.

Disabled metadata does not disable a button by itself. Bind native disabled or ARIA behavior through the relevant UI family, and keep that state consistent with navigation metadata. The collection does not select an item, move focus, install key handlers, or assign roles; these belong to the family or Composite controller.

`register` preserves collection E/R and adds Scope for cleanup. Its finalizer captures the required services and ignores cleanup failure with logging; it does not create a new public cleanup error channel. The collection owner and each item's registration owner can have distinct lifetimes.

Test replacement under the same ID, stale finalizer cleanup, disabled filtering, and DOM reorder separately. If navigation lands on removed content, inspect registration Scope. If enabled items skip unexpectedly, inspect duplicate IDs and disabled metadata before changing arrow-key logic.

Continue with [Composite](/explore/ui-composite) to turn this inventory into movement, focus, scrolling, and typeahead. API: [Collection](/reference/modules/%40typed%2Fui%2FCollection).
