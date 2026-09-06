---
title: "DOM scalar parts and attributes"
summary: "See which exact DOM location each scalar template interpolation owns and what one push changes."
section: "Template rendering"
kind: "deep-dive"
order: 6
---

Suppose the query state is correct in a log but the search field appears stale. There are several
possible breaks: the input event read the wrong field, state was not published, the render was
stopped, a queue hasn't applied the change, or another writer overwrote the native field. Debugging
is easier when each step has a concrete target.

This guide follows the editing loop from [template authoring](/explore/authoring-typed-templates).
The syntax's set/clear rules live in [scalar bindings](/explore/template-element-bindings); this page
uses them to locate a real update failure.

## Start from one complete feedback loop

```ts
import { RefSubject } from "@typed/fx";
import { component } from "@typed/ui/Component";
import { html } from "@typed/template";
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
| Events stop after a spread change | whether the handler entry was removed and finalized |

An attribute MutationObserver cannot detect every property assignment. Inspect the native property
as well, and use a DOM breakpoint on the actual suspect element rather than observing the entire
page. Count producer publications and applied changes separately; queue coalescing can make those
counts differ while retaining the latest value.

## Draw the cooperation boundary around fields

Typed can own the edit property while an analytics helper owns a distinct data attribute and an
animation library owns separate class tokens. It cannot merge simultaneous writes to `.value` or
recover its captured input after another owner replaces the label's `innerHTML`.

The same rule explains why a spread is not one opaque assignment. Each accepted entry has its own
field and lifetime; class/data entries additionally track local collections. Use
[spread lifetimes](/explore/template-spreads-data) and [class contributions](/explore/dom-class-names)
when the suspected conflict is inside those collections.

## Keep the test proportional to the failure

For a property binding, assert its native value and stable element identity after a real state
change. For an event, assert dispatch/cancellation and cleanup. For a queue, assert the chosen
scheduling condition rather than sleeping a guessed duration. For structural replacement, test the
owned range and child lifetimes.

A passing text assertion proves only that text. It does not prove a selection survived, another
owner's class remained, or a removed listener stopped running. Move to
[Direct updates, local reconciliation](/explore/dom-updates-and-reconciliation) when the interaction
actually changes a collection or nested range.
