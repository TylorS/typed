---
title: "Change a keyed template collection"
summary: "Keep one rendered range per stable key so insertions, removals, and moves preserve the browser state that belongs to an item."
section: "Template authoring"
kind: "guide"
order: 4
---

Sorting saved articles should move their rows, not turn each array position into a different article.
An input being edited, a row observer, and a foreign widget all belong to the logical article. `many`
expresses that identity so the renderer can keep the same child work while its position changes.

This builds on [renderable values](/explore/renderable-normalization). A fixed array of templates
is sufficient for fixed output; use `many` when records can be added, removed, updated, or reordered.

## Give the record an identity independent of its position

Use an ID that stays with the record. A title can change and an array index can refer to a different
record after sorting, so neither is a reliable key for editable rows.

The example makes that distinction observable: reversing the list changes positions, while each
row's browser-owned note input should stay with its article.

```ts
import { RefSubject } from "@typed/fx";
import { html, many } from "@typed/template";
import { component } from "@typed/ui/Component";

interface Article {
  readonly id: string;
  readonly title: string;
}

const ArticleRow = (article: RefSubject.RefSubject<Article>, id: string) => {
  return html`<li data-article-id=${id}>
    <span>${article.pipe(RefSubject.map((value) => value.title))}</span>
    <label>Private note <input type="text" /></label>
  </li>`;
};

export const SavedArticles = component(function* () {
  const articles = yield* RefSubject.make<ReadonlyArray<Article>>([
    { id: "scope", title: "Understanding resource scopes" },
    { id: "events", title: "Native browser events" },
  ]);
  const reverse = RefSubject.update(articles, (current) => [...current].reverse());
  const rows = many(articles, (article) => article.id, ArticleRow);

  return html`<section>
    <button type="button" onclick=${reverse}>Reverse order</button>
    <ul aria-label="Saved articles">${rows}</ul>
  </section>`;
});
```

[`many`](/reference/modules/%40typed%2Ftemplate%2Fmany) returns a renderer descriptor, not an
independently flattened Fx. It supplies the collection,
key function, and child renderer to the target. The DOM target can therefore own the keyed entry map
directly, while the HTML target can render one finite initial collection.

## Read each retained item through its subject

`ArticleRow` receives a `RefSubject<Article>`, not a snapshot of the record. Its title projection
stays subscribed. Changing the title under the same ID updates that subject and its text part;
it does not reconstruct the row template.

In a generator-backed row, reading `yield* article` during setup and then interpolating only the resulting title would capture
the initial snapshot. That is appropriate for a setup decision but wrong for a displayed field
that should remain live. Derive live fields from the supplied subject.

Update domain records immutably. Mutating the same object in place can leave equality seeing the
same retained value and skip the expected publication. Preserve unchanged object references when
possible; recreating every plain object can cause unnecessary item publications. The renderer uses
Effect equality when deciding whether to set a retained subject.

## Follow three different list changes

Starting with `scope, events`, reversing the array retains both keys. Both child scopes, both
subjects, and their existing DOM remain. Unchanged item values are not republished, although the
renderer still visits the list and reconciles its concrete node order.

Changing `events.title` keeps the same key and publishes the new record to that row's subject.
Only the subscribed title part needs to change. Removing `scope` closes that child's scope and
removes its represented output. An observer acquired by that row is finalized even while the
remaining list continues to run.

A list emission is consequently not constant-time work. It validates and visits old and new keys,
checks equality, and reconciles the local concrete range. The behavioral benefit is narrower:
retained children keep their identity and lifetime. See
[Direct updates, local reconciliation](/explore/dom-updates-and-reconciliation) for the cost model.

## Make identity testable

Mount the example, type a note into the `events` row, capture that input object, and reverse the list.
Assert the same input is now in the moved row and its text remains with the correct article.
Then test a title update and a removal separately. Count a row resource's acquisitions and finalizers
if its lifetime matters; final text order alone cannot reveal unnecessary recreation.

Node identity and browser-managed state are related but distinct. The diff prefers `moveBefore`
for already-parented nodes and falls back to `insertBefore`. Both retain the object; the successful
platform move preserves additional states subject to its connection/document constraints. Consult
the [platform move contract](https://developer.mozilla.org/en-US/docs/Web/API/Element/moveBefore)
and test the fallback on supported browsers rather than promising every native state survives.

## Carry the same identity through a server response

Keys must be unique within the current array. Duplicate keys fail with `Cause.IllegalArgumentError`
in both DOM and HTML rendering; they are not an instruction to merge records. For hydratable output,
use a string, number, or `Symbol.for()` key. A local `Symbol()` has no serializable identity and fails
that boundary.

The server reads the initial collection, validates it, and serializes items in order with keyed
markers when using the hydratable renderer. It does not keep live child scopes around after the
response to process future sorting. The browser later uses compatible initial keys to adopt those
ranges. Share IDs and initial state across that handoff; array position alone cannot restore them.
Continue with [Server rendering and hydration](/explore/server-rendering-and-hydration) when this
list should arrive as interactive server HTML.
