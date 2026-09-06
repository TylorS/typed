---
title: "Preserve multi-node DOM output"
summary: "Hand existing DOM output across a renderer boundary, including a stable multi-node range when one is genuinely needed."
section: "Template internals"
kind: "deep-dive"
order: 3
---

A foreign summary renderer may produce a heading and paragraph without a wrapping element. A native
DocumentFragment can deliver those children once, but insertion empties the fragment. If the producer
must later identify or move that same group, it needs a persistent range representation.

Read [Using DomRenderEvent](/explore/dom-render-event) first. Most adapters should keep using a single
node; this page explains the additional tool needed when a genuine multi-node result must survive
fragment consumption.

## Start with the native fragment behavior

```ts
import { DomRenderEvent } from "@typed/template/RenderEvent";
import type { Rendered } from "@typed/template/Wire";

const heading = document.createElement("h2");
heading.textContent = "Collection summary";
const fragment = document.createDocumentFragment();
const summary = document.createElement("p");
summary.textContent = "12 saved articles";
fragment.append(heading, summary);

const output: Rendered = fragment;
export const event = DomRenderEvent(output);
```

When these children enter a parent, their identities are retained and the fragment becomes empty.
This is normal [DocumentFragment behavior](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment).
Emitting the same consumed fragment again does not describe the children that now live elsewhere.

You can retain the exact nodes in a collection when that is the desired representation. A Wire
adds persistent boundaries when a renderer needs the complete contiguous group to remain addressable
as one output value. It avoids adding an element that could change layout, table structure, or
accessibility semantics.

## Make the range persistent before insertion

```ts
import { DomRenderEvent } from "@typed/template/RenderEvent";
import { persistent } from "@typed/template/Wire";

const fragment = document.createDocumentFragment();
const heading = document.createElement("h2");
heading.textContent = "Collection summary";
const summary = document.createElement("p");
summary.textContent = "12 saved articles";
fragment.append(heading, summary);

const output = persistent(document, "article-summary-v1", fragment);
export const event = DomRenderEvent(output);
```

`persistent` keeps empty output as a fragment and single-child output as that node. With multiple
children it produces a transparent comment-bounded Wire. The identity string must identify the
producer's template shape; do not give every unrelated adapter the same generic boundary ID.

The Wire retains its start/end boundaries so its current nodes can be found after insertion.
It does not clone children or own their foreign resources. The receiving range controls placement;
the producer's scope still controls teardown, as described in the DOM event guide.

## Treat conversion as an operation, not just observation

A Wire's `valueOf()` gathers its range into a DocumentFragment. On mounted output that moves nodes.
`toHtml` and `getElements` use this conversion for Wire inputs, so calling them on a mounted range
can change the document you meant to inspect. `DomRenderEvent.toString()` can reach the same path.

For diagnostics, retain known nodes and read their properties, parent relationships, and boundaries.
Perform consuming serialization only on detached output when moving it is intended. A "log the
rendered HTML" statement can otherwise become the cause of a disappearing view.

The public `Rendered` union also accepts nested readonly collections. Guard functions such as
`isWire`, `isNode`, and `isDocumentFragment` let a renderer distinguish those representations without
relying on arbitrary object shape.

## Adopt existing boundaries only when your extension owns them

`fromComments` is an internal-but-published renderer extension function. It is appropriate when an
integration already owns both marker comments and the complete interval between them:

```ts
import { DomRenderEvent } from "@typed/template/RenderEvent";
import { fromComments } from "@typed/template/Wire";

const fragment = document.createDocumentFragment();
const start = document.createComment("summary:start");
const summary = document.createElement("p");
summary.textContent = "12 saved articles";
const end = document.createComment("summary:end");
fragment.append(start, summary, end);

export const event = DomRenderEvent(fromComments(fragment, start, end));
```

This is not permission to point at another renderer's comments or infer ownership from arbitrary
nearby markup. The extension is responsible for coherent boundaries and all represented nodes.
Likewise, `diffable` and `getAllSiblingsBetween` serve range/reconciliation machinery; normal
application components should not manufacture an alternate hydration protocol with them.

## Verify the group remains the same group

Capture the heading and paragraph before placement, then assert both exact objects after insertion
and reordering. Check their order and that adjacent foreign siblings remain unchanged. For a removed
range, assert producer finalizers separately from DOM removal. For a mounted Wire, ensure the test
itself does not consume the range while inspecting it.

Typed prefers the platform's state-preserving move operation for eligible connected nodes and falls
back to insertion. Retaining objects does not guarantee every browser-managed state survives that
fallback. Use [local reconciliation](/explore/dom-updates-and-reconciliation) for the move/cost
contract and the [Wire reference](/reference/modules/%40typed%2Ftemplate%2FWire) for exact conversions.
