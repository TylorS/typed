---
title: "The template compilation pipeline"
summary: "Build a renderer or framework target on the public Template, HtmlChunk, and RenderEvent contracts."
section: "Template internals"
kind: "deep-dive"
order: 4
---

An alternate renderer cannot implement `html` by simply joining strings and values. A query in
`.value` is a DOM property, an article title is escaped text, and a nested preview is ordered output
with its own lifetime. The parser preserves those distinctions so a target can interpret them
without making application components aware of its machinery.

Start with [RenderEvent output](/explore/render-event-substrate). This guide is for a library that
must understand template syntax itself; an adapter with existing nodes should stop at RenderEvent.

## Separate authoring, interpretation, and output

```text
Authored literal + interpolation values
                    ↓
             RenderTemplate service
                    ↓
        parse strings → Template AST
                    ↓
   target compilation + value interpretation
                    ↓
          scoped Fx<RenderEvent, E, R>
```

`html` constructs the lazy program and resolves the target service when run. The target decides
how to cache parsed literals, connect values to their parts, and emit output. The public parser is
synchronous and resource-free; it does not subscribe to values or mount nodes.

That separation is useful when diagnosing a target: a correct AST with incorrect serialized output
is a different failure from a parser assigning the wrong part kind.

## Inspect the authored structure before inventing target behavior

```ts
import { parse } from "@typed/template/Parser";

const template = parse([
  '<label>Search <input .value="',
  '" /></label><output>',
  '</output>',
]);

for (const [part, path] of template.parts) {
  console.log(part._tag, path);
}
console.log(template.hash);
```

The AST records fixed element structure, part kinds, and static-tree paths. Paths locate targets in
a constructed or adopted instance; they are not selectors that should be reevaluated on every
update. `Template.hash` identifies the authored strings for compatibility, not the current query
or the identity of domain records.

A property part and a child position intentionally become different AST nodes. Sparse attributes,
classes, data, events, refs, and text-only elements likewise retain distinct contracts. Preserve
those distinctions in a new target instead of flattening everything into a string-valued property.

## Follow the same parts into DOM and HTML

The DOM target builds a namespace-correct static fragment, clones it per mount, and captures the
updaters for its parts. The query property can then be assigned directly. A nested output position
retains a bounded range that can insert/move/remove concrete nodes.

The HTML target instead compiles ordered chunks. Static text has no value work; dynamic chunks carry
context-aware rendering functions:

```ts
import { parse } from "@typed/template/Parser";
import { addTemplateHash, templateToHtmlChunks } from "@typed/template/HtmlChunk";

const template = parse(["<article><h2>", "</h2></article>"]);
const chunks = addTemplateHash(templateToHtmlChunks(template), template);
export const serialized = chunks.map((chunk) => {
  switch (chunk._tag) {
    case "text": return chunk.text;
    case "part":
    case "sparse-part": return chunk.render("Understanding <scopes>");
  }
}).join("");
```

This example inspects one title interpolation; it is not a complete renderer for arbitrary streams
and nested values. `addTemplateHash` adds the boundary information used by interactive adoption.
Static output can omit it. `HtmlChunksBuilder` is the advanced assembly API when a target needs to
construct a sequence incrementally.

A DOM property has no generic serialized attribute equivalent. Events have no server listener to
install. Hydration refs have an explicit serialization protocol. These are target decisions, not
reasons to discard the parsed kind and guess from a runtime value.

## Preserve the contexts that strings alone erase

Nested templates compile in the namespace where they are inserted. Text-only elements such as
script and textarea use their particular escaping/closing-tag rules. Sparse expressions combine
literal and dynamic segments into one part. These details affect correctness before performance.

Use [Namespace-aware markup](/explore/template-namespaces-and-platform-markup) and
[Text-only contexts](/explore/template-text-only-contexts) as concrete target cases. A renderer that
only handles plain HTML text should explicitly document that subset and reject unsupported behavior;
it should not claim browser or hydration parity.

## Emit output and retain its lifetime

DOM interpretation emits `DomRenderEvent`; HTML interpretation emits ordered `HtmlRenderEvent`
chunks. Those values are transport, not owners of subscriptions or cleanup. The returned Fx must
preserve input errors/service requirements and close per-render work on interruption.

Test parsing, target interpretation, and runtime lifetime independently. Start with a scalar part,
sparse attribute, property, boolean, and nested template. Then exercise namespace/text context,
expected failure, and an interrupted producer. For a browser target assert native identity; for
HTML assert parsing recovers intended text and finite ordered completion.

Use published `Parser`, `Template`, `HtmlChunk`, `RenderTemplate`, and `RenderEvent` modules.
Private diffing, hashing, marker construction, and many-item implementations are evidence about
the shipped renderer, not application extension contracts. Continue with
[Implement a RenderTemplate target](/explore/implementing-render-template) to wrap or provide the
service without coupling to those internals.
