---
title: "What a template can render"
summary: "See how ordinary values, Effect values, streams, arrays, and renderer output become one template part without losing errors or requirements."
section: "Template authoring"
kind: "concept"
order: 3
---

A saved-article page needs several kinds of output: a fixed heading, a query that changes, data
loaded through a service, a group of links, and perhaps an empty state. They do not need to be
converted into one special component-object format. Typed accepts ordinary values and Effect
producers, then interprets them according to the position where they are rendered.

Start with [Authoring Typed templates](/explore/authoring-typed-templates). This article answers the
next design question: what should a component return, or pass into an interpolation, when its data
isn't simply a string?

## Distinguish a value from the producer of that value

A string already exists. An Effect describes work that can obtain a value once. An Fx or Stream
describes values arriving over time. The following view puts each into a different part:

```ts
import { Effect, Stream } from "effect";
import { Fx } from "@typed/fx";
import { html } from "@typed/template";

const owner = Effect.succeed("Ada");
const query = Fx.fromIterable(["", "scope"]);
const syncStatus = Stream.fromIterable(["Checking", "Up to date"]);

export const header = html`<header>
  <h1>${owner}'s saved articles</h1>
  <p>Query: ${query}</p>
  <output>${syncStatus}</output>
</header>`;
```

In a DOM render, each `query` emission updates its own position; it does not append another paragraph.
The Effect runs when rendering starts, not when the module defines `owner`. A real `RefSubject` can
replace the short demonstration Fx without changing the template's interpolation syntax.

A server response needs a finite result. Its HTML renderer takes initial ordinary producer values
rather than waiting forever for future changes. A source with no initial value can therefore stall
server output. [Rendering HTML on the server](/explore/rendering-html-on-the-server) explains that
boundary and the distinct protocol for ordered renderer-owned HTML chunks.

## Let the position decide the interpretation

A value accepted by the broad `Renderable` contract is not meaningful in every position. An object
can describe `.data` keys or a DOM property; that does not turn an arbitrary record into child markup.

| Input | In a child position | In a named element part |
| --- | --- | --- |
| string, number, bigint | text | serialized attribute or direct property value |
| boolean | text, including `"false"` | attribute string or boolean-part truthiness |
| null or undefined | empty output | attribute removal or direct property assignment |
| array | ordered normalized entries | class collection or the property's array value |
| `Option` | `None` is empty; `Some` selects its contained value | interpreted by the chosen part |
| Effect | obtain its result, then normalize it | obtain the field's value |
| Fx, Stream, RefSubject | update the local output as values arrive | update the captured field |
| nested template or RenderEvent | renderer output in this position | not a generic attribute value |

Unlike conditional JSX conventions, a boolean child is displayed data. Return `null` or the desired
view when a condition should hide content. Arrays are recognized; arbitrary Sets, generators, and
iterables are not implicitly rendered collections. Convert a fixed iterable to an array deliberately.

## Return the output that fits the component

A helper does not need an extra element merely to return several pieces, and a helper with no
setup does not need a component generator:

```ts
import { html } from "@typed/template";

export const EmptyResults = (query: string, canSave: boolean) => {
  return [
    html`<h2>No saved articles match ${query}</h2>`,
    canSave ? html`<p>Save an article to include it in future searches.</p>` : null,
  ];
};

export const ReadOnlyNotice = "This collection is read-only.";
```

Interpolate `EmptyResults(query, canSave)` as an ordered group. No wrapper is added around the
heading and paragraph. When setup does need a generator, `component` accepts these same return
forms directly: a template, ordinary data, an Effect, or native output. Returning a DOM node
deliberately makes that component browser-specific; renderer
neutrality depends on its actual values and services, not on the constructor alone.

An array describes order, not the enduring identity of domain records. If saved articles can be
inserted, removed, or reordered, use [keyed collections](/explore/keyed-template-collections).

## Keep errors and service requirements attached to the view

Loading a collection name can fail or require a service. Preserve those facts instead of starting
an untracked Promise while constructing the template:

```ts
import { Context, Data, Effect } from "effect";
import { html } from "@typed/template";

class CollectionMissing extends Data.TaggedError("CollectionMissing")<{
  readonly id: string;
}> {}

interface Collections {
  readonly title: (id: string) => Effect.Effect<string, CollectionMissing>;
}
const Collections = Context.Service<Collections>("Collections");

export const CollectionHeading = (id: string) => html`<h1>${
  Effect.flatMap(Collections, (collections) => collections.title(id))
}</h1>`;
```

The inferred template output retains both `CollectionMissing` and the `Collections` requirement.
Effect's [service contract](https://github.com/Effect-TS/effect/blob/main/migration/services.md)
defines how `Context.Service` makes that dependency explicit.
Its caller decides which service to provide and how failure becomes a recovery view. The template
neither hides a global client nor promises that every render succeeds. See the
[Renderable reference](/reference/modules/%40typed%2Ftemplate%2FRenderable) for channel inference.

## Flatten producer relationships before rendering

An ordinary Fx's emitted values are update payloads. Do not assume that emitting another Fx causes
the template to recursively subscribe to a new nested producer. If the query selects a request
stream, choose the intended switching/concurrency operator first and give the part the resulting
output stream. Returning an Effect whose result is normalized is a different boundary from emitting
arbitrary higher-order streams.

When a view displays an unexpected object, inspect the payload and its destination part. When it
never appears, inspect whether its producer emits and whether required services were supplied.
When a stale request wins, inspect the producer's concurrency policy. Those are different failures;
adding another template wrapper does not solve them.
