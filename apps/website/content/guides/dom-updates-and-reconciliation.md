---
title: "Direct updates, local reconciliation"
summary: "What the DOM renderer creates, mounts, hydrates, and reconciles—and the local size each cost depends on."
section: "Template rendering"
kind: "deep-dive"
order: 5
---

A search page contains two very different updates. Typing another character changes a captured
input property and output text. Sorting a hundred results changes the order of a bounded group of
nodes. Both are local, but only the first is a scalar write; calling all rendering constant-time
would hide the list work that actually matters.

Read [keyed collections](/explore/keyed-template-collections) before using this cost model. The goal
here is to connect an observed interaction to the amount of work it requests, rather than compare
whole frameworks through unrelated benchmarks.

## Identify which boundary the interaction changes

```ts
import { Fx, RefSubject } from "@typed/fx";
import { html, many } from "@typed/template";

const query = Fx.succeed("scope");
const articles = Fx.succeed([
  { id: "scope", title: "Understanding resource scopes" },
  { id: "events", title: "Native browser events" },
]);
const rows = many(
  articles,
  (article) => article.id,
  (article) => html`<li>${article.pipe(RefSubject.map((value) => value.title))}</li>`,
);
export const page = html`<output>${query}</output><ul>${rows}</ul>`;
```

Changing `query` reaches one retained part. Changing the article array invokes keyed collection
work and then a concrete-node range diff. A row title update is narrower than a reorder, and a
complete new root emission is broader than either. Start a performance investigation by identifying
which of these the application actually produced.

Calling `html` is inert. On first interpretation the DOM renderer parses/caches the authored
structure and builds a namespace-specific fragment. Mounting clones that structure and connects
its parts. Later updates use the targets retained during that setup. Direct updates are possible
because the renderer already paid the setup cost.

## Use the local size for each operation

| Operation | Work to account for |
| --- | --- |
| Template mount | static nodes and dynamic parts in that template, including subscription setup |
| Captured text, attribute, property, boolean, comment | one native target, plus serialization and browser work |
| Class contribution | normalization and differences across previous/next local token collections |
| Dataset contribution | previous/next local key collections and changed attribute values |
| Spread installation/replacement | accepted record keys and lifetimes of affected entries |
| Retained reactive spread entry | its own captured part; no outer-record comparison for each emission |
| Event setup | registered entries across concrete delegation roots |
| Dynamic node range | normalization and comparison of its previous/next concrete nodes |
| Keyed collection emission | previous/next item keys, equality, affected child work, then concrete range reconciliation |
| Hydration | existing marked DOM inspected, compatible ranges found, and adopted parts connected |

There is no single page-wide `n` for these costs. A scalar write is direct relative to surrounding
DOM; string production can still depend on string size and browser layout can extend beyond the
changed element. Sparse expressions combine their authored segments before the final write.

For a keyed array with old/new lengths `a` and `b`, validation and visitation are O(`a + b`) plus
key/equality and affected-child costs. Average retained-key lookup is O(1), but that does not make
the whole array update O(1).

## Follow a structural update through its local range

A dynamic child position retains an end comment and the concrete nodes representing its current
output. The next output is normalized to another node array, and the diff operates only in that
owned range. It does not reconcile unrelated ancestors or siblings.

Equal heads/tails, append/remove cases, and a reverse swap have useful fast paths. Comparing a long
unchanged prefix still requires those comparisons. A more general change builds a map for the
remaining next range and moves or replaces nodes as needed. These are bounded-range optimizations,
not an unconditional constant-time algorithm.

`many` works before that diff: retained keys preserve child scopes and subjects, changed values
publish through their subjects, new keys acquire children, and removed keys finalize children.
A pure reorder of unchanged values does not rerun each item's setup or republish its data. The
renderer still flattens retained concrete output and reconciles its order.

## Separate native identity from native state preservation

For an already-parented node, the renderer attempts `moveBefore`. If unavailable or rejected, it
uses `insertBefore`; new nodes also use insertion. Both move the same object, but a successful
state-preserving platform move can retain browser states that removal/reinsertion can reset.
The [platform contract](https://developer.mozilla.org/en-US/docs/Web/API/Element/moveBefore)
describes connection and document restrictions.

Test focused input, selection, custom-element lifecycle, or iframe state when those are product
requirements. Do not infer all of them from `oldNode === newNode`, and do not infer identity from a
screenshot with matching row text.

## Measure the producer, renderer, and browser separately

For the search example, measure initial mount, one query edit, one title update, and a pure reorder
as separate interactions. Record whether record values were recreated, whether child scopes were
started/closed, which existing nodes moved, and how much time the browser spent in layout/paint.

If a query edit constructs a new root template, inspect application composition first. If keys are
stable but all rows publish, inspect immutable update/equality behavior. If publications are narrow
but frames remain expensive, inspect projection cost and browser layout before blaming key lookup.

A queue changes when captured work runs; it does not erase these costs. Continue with
[Schedule DOM rendering](/explore/render-scheduling). For scalar field diagnostics, use
[DOM scalar parts and attributes](/explore/dom-parts-and-attributes); for foreign concrete output,
use [Using DomRenderEvent](/explore/dom-render-event).
