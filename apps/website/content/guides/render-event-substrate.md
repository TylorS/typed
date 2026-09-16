---
title: "RenderEvent: any UI can participate"
summary: "Choose DomRenderEvent or HtmlRenderEvent for output a foreign renderer already owns."
section: "Template internals"
kind: "concept"
order: 1
---

`RenderEvent` lets a library place output it already owns into a Typed template. Choose the
representation from that output: live DOM objects or serialized HTML.

Application authors usually need [renderable values](/explore/renderable-normalization) instead.
If a library only configures one template element, use a scoped
[ref](/explore/template-references-and-element-access). Implement `RenderTemplate` only when the
library must interpret template literals and their parts for a target.

## Choose output by what the producer actually has

| Producer owns | Output value | What the consumer receives |
| --- | --- | --- |
| Native DOM node or range | `DomRenderEvent` | those exact objects |
| Correctly serialized HTML | `HtmlRenderEvent` | trusted ordered string chunks |
| Application text/data | ordinary interpolation | context-escaped data |

The producing Fx supplies sequencing, failures, required services, and cancellation. Constructing
an event value does none of those things by itself.

DOM output preserves exact object identity. Its containing Typed range controls placement; the
producer owns updates inside those objects and any resources it starts. HTML output is an ordered
sequence of serialization chunks, not a series of replacement views.

## Compose at the smallest useful boundary

```ts
import { Fx } from "@typed/fx";
import { html } from "@typed/template";
import { DomRenderEvent } from "@typed/template/RenderEvent";

const chart = Fx.sync(() => DomRenderEvent(document.createElement("canvas")));

export const page = html`<main>
  <section aria-label="Chart">${chart}</section>
</main>`;
```

Each run creates a canvas, and the template inserts that exact object. For an adapter that also
starts a timer or acquires a library instance, keep that work scoped beside the output.
[Using DomRenderEvent](/explore/dom-render-event) shows a complete canvas example with recurring work
and teardown; [multi-node output](/explore/wire-and-rendered-dom-output) covers persistent ranges.

`HtmlRenderEvent` asserts that the producing serializer owns escaping: the constructor does not
sanitize its string. Keep application text in ordinary interpolation. See
[Using HtmlRenderEvent](/explore/html-render-event) for ordered chunks, completion, and escaping.

Public `isDomRenderEvent` and `isHtmlRenderEvent` guards distinguish the representations at adapter
boundaries. Continue with [the compilation pipeline](/explore/template-compilation-pipeline) only
when output transport is insufficient and you need a template interpreter.
