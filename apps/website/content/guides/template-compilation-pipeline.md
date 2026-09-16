---
title: "The template compilation pipeline"
summary: "Follow an authored literal through the parser, target interpretation, and RenderEvent output."
section: "Template internals"
kind: "deep-dive"
order: 4
---

An alternate renderer cannot implement `html` by simply joining strings and values. An input's
`.value` is a DOM property, while the same query in an `<output>` element is escaped text. The parser
preserves those distinctions so a target can interpret them without changing application components.

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

const template = parse([
  '<label>Search <input .value="',
  '" /></label><output>',
  '</output>',
]);

const chunks = addTemplateHash(templateToHtmlChunks(template), template);

export const serialized = chunks.map((chunk) => {
  switch (chunk._tag) {
    case "text": return chunk.text;
    case "part":
    case "sparse-part": return chunk.render("Understanding <scopes>");
  }
}).join("");
```

This example uses the same query string for both interpolation positions. The HTML target serializes
the `.value` binding as a `value` attribute and escapes the output's text. This inspects chunk
rendering, not a complete renderer for arbitrary streams and nested values. `addTemplateHash` adds
the boundary information used by interactive adoption. Static output can omit it.
`HtmlChunksBuilder` supports targets that assemble a chunk sequence incrementally.

Assigning a property in the DOM and serializing an HTML attribute are different operations. The
target chooses that mapping; events have no server listener to install, and hydration refs use an
explicit serialization protocol. Keep the parsed kind available when making those decisions.

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

## Check a new target's contract

A new target needs explicit behavior for each part it supports. Check:

- Scalar, sparse, property, boolean, namespace, and text-only parts retain their distinct contexts.
- Nested output preserves order; live inputs and acquired resources stop on interruption.
- Unsupported events, refs, or properties are deliberately omitted or rejected.
- Input errors and service requirements remain visible in the returned Fx type.
- DOM output preserves native identity; finite HTML output escapes data and completes in order.
- If hydration is supported, adoption retains nodes, restores state, and leaves interactions working.

Test parsing separately from target interpretation and lifetime. A parsed-literal cache may be
shared, but subscriptions, event listeners, and ref resources belong to each run.

Use published `Parser`, `Template`, `HtmlChunk`, `RenderTemplate`, and `RenderEvent` modules.
Private diffing and marker implementations are not extension contracts. If the public boundary
cannot express required behavior, identify that gap instead of importing private machinery.
To add policy while reusing the shipped renderer, see
[Decorate a RenderTemplate target](/explore/implementing-render-template).
