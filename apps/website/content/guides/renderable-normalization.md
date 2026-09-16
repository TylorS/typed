---
title: "What a template can render"
summary: "Look up how a template position interprets values, arrays, and producers while retaining their errors and requirements."
section: "Template authoring"
kind: "reference"
order: 3
---

Template parts accept ordinary values, arrays, nested templates, and Effect, Fx, or Stream
producers. The position determines how those values are used: a child becomes output, while an
attribute or property updates that field. Use this reference after
[keyed collections](/explore/keyed-template-collections) when an input's rendering behavior is unclear.

## Let the position decide the interpretation

A value accepted by the broad `Renderable` contract is not meaningful in every position. An object
can describe `.data` keys or a DOM property; that does not turn an arbitrary record into child markup.
[Named element parts](/explore/template-element-bindings) select which field to update.

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

A boolean child is displayed data. Return `null` or the desired view when a condition should hide
content. Arrays are recognized; arbitrary Sets, generators, and iterables are not implicitly rendered
collections. Convert a fixed iterable to an array deliberately.

## Distinguish a value from the producer of that value

A string already exists. An Effect describes work that can obtain a value once. An Fx or Stream
describes values arriving over time. The following view puts each into a different part:

```ts
import { Effect, Stream } from "effect";
import { Fx } from "@typed/fx";
import { html } from "@typed/template";

const name = Effect.succeed("Ada");
const count = Fx.fromIterable([1, 2, 3]);
const status = Stream.fromIterable(["Loading", "Ready"]);

export const view = html`<section>
  <h1>Hello, ${name}</h1>
  <p>Count: ${count}</p>
  <output>${status}</output>
</section>`;
```

In a DOM render, each `count` emission updates its own position; it does not append another paragraph.
The Effect runs when rendering starts, not when the module defines `name`. A `RefSubject` can
replace the short demonstration Fx without changing the template's interpolation syntax.

## Return the output that fits the component

A helper can return several pieces without adding a wrapper element. No component generator is
needed when there is no setup:

```ts
import { html } from "@typed/template";

export const EmptyResults = (query: string) => [
  html`<h2>No results for ${query}</h2>`,
  html`<p>Try another search.</p>`,
];
```

Interpolate `EmptyResults(query)` as an ordered group. No wrapper is added around the heading and
paragraph. Components with setup can return these forms too; see
[component construction](/explore/ui-component). Returning a DOM node makes the output browser-specific.

An array describes order, not enduring record identity. For records that can be inserted, removed,
or reordered, use [keyed collections](/explore/keyed-template-collections).

## Keep errors and service requirements attached to the view

Interpolating an Effect preserves its error and requirement types in the resulting view:

```ts
import { Effect } from "effect";
import { html } from "@typed/template";

export const Heading = <E, R>(title: Effect.Effect<string, E, R>) =>
  html`<h1>${title}</h1>`;
```

`Heading` retains the title producer's `E` and `R`; its caller must handle failures and supply required
services before running the view. See the
[Renderable reference](/reference/modules/%40typed%2Ftemplate%2FRenderable) for channel inference and
[services and lifetime](/explore/fx-services-and-lifetime) for providing dependencies.

## Flatten producer relationships before rendering

An ordinary Fx's emitted values are update payloads. Emitting another Fx does not make the template
recursively subscribe to a new nested producer. If a query selects a request stream, choose the
intended [switching or concurrency operator](/explore/fx-higher-order-and-concurrency) first and give
the part the resulting output stream. An Effect's result is normalized; an Fx's emissions are not
recursively flattened into subscriptions.

Server rendering takes initial ordinary producer values, so a source with no initial value can
stall server output. See [rendering HTML on the server](/explore/rendering-html-on-the-server) for
that boundary and the distinct protocol for ordered renderer-owned HTML chunks.
