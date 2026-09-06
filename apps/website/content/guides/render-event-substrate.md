---
title: "RenderEvent: any UI can participate"
summary: "Choose the output boundary that matches the renderer you already have."
section: "Template internals"
kind: "concept"
order: 1
---

A search page can contain a canvas produced by a chart library and a server-rendered article preview
produced by another serializer. Neither producer needs to become a Typed template interpreter.
They need a small output boundary that says what representation they already own.

This is the starting point for library authors. Application authors can compose normal templates
using [renderable values](/explore/renderable-normalization). Here the question is how already-produced
UI participates without surrendering its native identity or hiding its lifetime.

## Choose output by what the producer actually has

| Producer owns | Output value | What the consumer receives |
| --- | --- | --- |
| Native DOM node or range | `DomRenderEvent` | those exact objects |
| Correctly serialized HTML | `HtmlRenderEvent` | trusted ordered string chunks |
| Application text/data | ordinary interpolation | context-escaped data |

The producing Fx supplies sequencing, failures, required services, and cancellation. Constructing
an event value does none of those things by itself.

```ts
import { Fx } from "@typed/fx";
import { DomRenderEvent, HtmlRenderEvent } from "@typed/template/RenderEvent";

export const browserOutput = Fx.sync(() => {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 120;
  return DomRenderEvent(canvas);
});

export const serverOutput = Fx.fromIterable([
  HtmlRenderEvent("<article><h2>Saved article</h2>", false),
  HtmlRenderEvent("<p>A serializer-owned preview.</p></article>", true),
]);
```

The browser value is lazy: each run creates its canvas. The server example contains constant
serializer-owned markup and marks the terminal chunk. Those Fx values carry different update
semantics despite sharing the `RenderEvent` union.

## Preserve the foreign renderer's actual update model

An editor commonly creates one host, then updates its own descendants in place. Its adapter should
usually emit that host once and keep the editor's work scoped. Recreating the host for every domain
change would discard the identity the integration is supposed to retain.

A producer that truly replaces its root can emit replacement objects. The containing Typed range
may insert, move, or remove those represented objects; the producer still owns internal descendants,
resource teardown, and its application state. It does not gain authority over the surrounding
page merely because its output can be placed there.

For HTML, emissions are chunks of one finite serialization, not successive full replacement
views. The consumer must preserve order and completion. Serializing a live node and parsing it
again cannot preserve that node's listeners, selection, or identity.

## Compose at the smallest useful boundary

```ts
import { Fx } from "@typed/fx";
import { html } from "@typed/template";
import { DomRenderEvent } from "@typed/template/RenderEvent";

const chart = Fx.sync(() => DomRenderEvent(document.createElement("canvas")));
export const page = html`<main>
  <h1>Saved-article activity</h1>
  <section aria-label="Activity chart">${chart}</section>
</main>`;
```

No wrapper protocol or assumed `foreign.mount()` return type appears here. The adapter models the
foreign API it actually has. When setup acquires an editor, observer, or timer, use
scoped Effects. `component` adds a child Scope and lifts returned output such as a `DomRenderEvent`;
`Fx.gen` is sufficient for yielded setup returning an Fx. When no setup is needed, a direct template
or Fx value is sufficient.

The inferred `E` and `R` channels remain part of the caller's program. Do not erase a foreign
initialization error behind an untracked Promise or start a hidden fiber that outlives the host.
[Using DomRenderEvent](/explore/dom-render-event) develops a complete scoped browser adapter.

## Make trust explicit at the HTML boundary

Ordinary text belongs in interpolation:

```ts
import { html } from "@typed/template";

const note = "<strong>This is saved text, not authored markup.</strong>";
export const preview = html`<p>${note}</p>`;
```

Wrapping `note` in `HtmlRenderEvent` would make an unsupported claim that a serializer already owns
its HTML interpretation. The constructor performs no sanitization. Keep application data on the
escaped path; use branded HTML only for an actual serializer with a defined format/trust contract.
See [Using HtmlRenderEvent](/explore/html-render-event) for terminal chunks and nested serialization.

## Decide whether you need an output adapter or an interpreter

If the library produces existing output, stop at `RenderEvent`. If it only needs to measure or
configure a particular template element, a scoped [ref](/explore/template-references-and-element-access)
is smaller still. Implement `RenderTemplate` only when the library must interpret template literals
and their parts for a target.

Test the boundary accordingly: exact node identity and teardown for DOM, escaped/trusted ownership
and ordered completion for HTML, and propagated errors/cancellation for both. Public
`isDomRenderEvent` and `isHtmlRenderEvent` guards distinguish the representations; avoid structural
checks on arbitrary `toString` objects.

The next library steps are [multi-node output](/explore/wire-and-rendered-dom-output) for ranges,
or [the compilation pipeline](/explore/template-compilation-pipeline) for a genuine interpreter.
