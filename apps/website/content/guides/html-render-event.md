---
title: "Using HtmlRenderEvent"
summary: "Carry ordered, trusted renderer-owned HTML chunks through Typed SSR while keeping completion and the trust boundary explicit."
section: "Template internals"
kind: "guide"
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

The marker belongs to the renderer's protocol. Do not infer it from an index inside `Fx.map`; an Fx
can be empty, asynchronous, unbounded, or interrupted. If a foreign callback reports its terminal
event, adapt that callback directly. If an Effect Stream needs one-chunk lookahead, keep that protocol
in the adapter and acknowledge Sink delivery in order.

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

## Connect to Effect HTTP at the response boundary

Typed's HTML renderer can produce an Fx of chunks. Adapt it to an Effect Stream and pass the encoded
bytes to `HttpServerResponse.stream`, or buffer a finite document and use
`HttpServerResponse.html`. Keep status, headers, cookies, compression, and route composition in
Effect's HTTP ecosystem; `HtmlRenderEvent` only describes renderer output.

The [HTML output recipe](/integrate/html-output) shows both response forms with the real Effect v4
HTTP modules. [Server rendering and hydration](/explore/server-rendering-and-hydration) explains
when Typed emits hydration markers and when static HTML is the honest result.
