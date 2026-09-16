---
title: "Using HtmlRenderEvent"
summary: "Carry ordered, trusted renderer-owned HTML chunks through Typed SSR while keeping completion and the trust boundary explicit."
section: "Template internals"
kind: "reference"
order: 2.5
---

`HtmlRenderEvent(html, last)` is the terminal HTML transport value. Use it when another renderer
already owns serialization and needs to join Typed's ordered server output. It is not a raw-HTML
escape hatch for application strings.

## Mark the terminal chunk

```ts
import { Fx } from "@typed/fx";
import { HtmlRenderEvent } from "@typed/template/RenderEvent";

const article = Fx.fromIterable([
  HtmlRenderEvent("<article><h1>Typed</h1>", false),
  HtmlRenderEvent("<p>Cooperative by design.</p></article>", true),
]);
```

Chunks remain in producer order. Exactly the terminal chunk has `last: true`. A one-chunk render is
`HtmlRenderEvent(completeHtml, true)`, normally produced lazily with `Fx.sync` when serialization is
synchronous.

The marker belongs to the renderer's completion protocol. An emission index alone cannot identify
the last chunk of an asynchronous or interrupted producer. The
[HTML output recipe](/integrate/html-output) shows how to consume ordered output.

## Treat HTML as trusted renderer output

`html` is inserted verbatim by an HTML consumer. The constructor performs no sanitization because
the producing renderer is asserting that it already owns correct escaping and serialization.

Ordinary Typed interpolation is the application-data path:

```ts
import { html } from "@typed/template";

const userName = "<script>alert('not markup')</script>";

const safe = html`<p>Hello, ${userName}</p>`;
```

The HTML renderer escapes `userName` for its text context. Wrapping the same string in
`HtmlRenderEvent` would make a false trust claim.

## DOM and HTML output are not interchangeable

`DomRenderEvent` transports live browser identity. `HtmlRenderEvent` transports text, order, and
completion. Do not serialize DOM merely to cross a client boundary, and do not parse renderer-owned
HTML merely to reconstruct identity it never carried.

Use the public guards when a protocol endpoint accepts either representation. Application templates
normally do not branch: the selected `RenderTemplate` consumes the representation appropriate to
that edge.

For buffered or streaming HTTP responses, follow the [HTML output recipe](/integrate/html-output).
[Server rendering and hydration](/explore/server-rendering-and-hydration) explains when to emit
hydration markers or static HTML.
