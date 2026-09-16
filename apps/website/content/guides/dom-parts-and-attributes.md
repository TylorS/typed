---
title: "DOM scalar parts and attributes"
summary: "See which exact DOM location each scalar template interpolation owns and what one push changes."
section: "Template rendering"
kind: "reference"
order: 6
---

Each scalar interpolation owns a concrete DOM target: an element property, an attribute, or a text
location. The renderer captures that target during setup and writes to it when its input publishes.
A later update does not search the document or rerun the component generator.

The syntax's set/clear rules live in [scalar bindings](/explore/template-element-bindings). Here,
one editing loop shows how retained targets work and how to diagnose a stale field.

## Start from one complete feedback loop

```ts
import { RefSubject } from "@typed/fx";
import { component, html } from "@typed/template";
import * as EventHandler from "@typed/template/EventHandler";

export const Search = component(function* () {
  const query = yield* RefSubject.make("");

  const readInput = EventHandler.make((event: Event) =>
    RefSubject.set(query, (event.currentTarget as HTMLInputElement).value),
  );

  return html`<label>
    Search articles
    <input type="search" .value=${query} oninput=${readInput} />
    <output>${query}</output>
  </label>`;
});
```

The browser changes the edit property, then dispatches `input`. The handler reads that property and
sets the subject. Two subscribers receive the value: the input's `.value` part and the output's
text part. A render queue can determine when the native writes happen. The component generator does
not restart during that sequence.

## Know why a later write can be direct

At setup, parsed part paths identify concrete targets in the cloned or adopted structure. The
renderer captures those targets in updaters and subscribes their inputs. It does not run a document
selector after every emission or search a component tree for the matching field.

An attribute updater retains its attribute/element target; a property updater retains its element
and property name. A text-only updater writes its text target. A structural child hole instead
owns a bounded range that can contain multiple nodes. Do not treat replacing nested output as the
same operation as assigning a string to one field.

## Use observations to choose the next boundary

| Observation | Inspect next |
| --- | --- |
| The input visibly changed but the subject didn't | handler registration, `currentTarget`, and the state operation |
| Subject changed but neither consumer did | whether rendering is still running and whether work is queued |
| `getAttribute("value")` is unchanged | read `input.value`; this template owns the property |
| Output changed but input object was replaced | parent switching, root output, or a changing collection key |
| Field changes then immediately reverts | another writer or another state publication |

An attribute MutationObserver cannot detect every property assignment. Inspect the native property
as well, and use a DOM breakpoint on the actual suspect element rather than observing the entire
page. Count producer publications and applied changes separately; queue coalescing can make those
counts differ while retaining the latest value.

## Give each field one writer

Typed can own `.value` while another library owns a distinct data attribute. Two owners writing
`.value` can overwrite each other; replacing the label's `innerHTML` also destroys the captured
input. For collection-valued fields, see [spread lifetimes](/explore/template-spreads-data) and
[class contributions](/explore/dom-class-names).

## Verify the bound property

For the example above, retain the input object, change `query`, and assert that the same input's
`.value` and the output's text both match the new value after rendering applies it. Reading the
`value` attribute would test a different field.

For changes to collections or nested ranges, use
[Direct updates, local reconciliation](/explore/dom-updates-and-reconciliation).
