---
slug: html-output
title: "Pass trusted HTML into Typed SSR"
summary: "Preserve a renderer's serialized output and its real chunk boundaries."
---

An SSR shell can render navigation with Typed while an existing framework serializes the account panel. Carry that framework's ordered chunks through the dynamic part; let the response owner choose status, headers, and cancellation. Once response headers have been sent, a later panel failure cannot retroactively turn the response into a different HTTP status.

Choose buffered rendering when redirects and validation must complete before any bytes are sent, or when you need one complete document for an export. Choose streaming when revealing a usable shell earlier is worth handling errors after the shell. The [React integration](/integrate/react) demonstrates a renderer that supplies a readable stream and closes its logical render with an empty terminal event. That is an alternative to buffering the last non-empty chunk; use one protocol consistently.

## One complete render

`HtmlRenderEvent(html, last)` is the transport value for already-serialized renderer output. When the renderer returns one complete string, emit one event with `last: true`.

```ts
import { Fx } from "@typed/fx";
import { HtmlRenderEvent } from "@typed/template/RenderEvent";

const htmlString = "<article><h1>Typed</h1></article>";
const output = Fx.sync(() => HtmlRenderEvent(htmlString, true));
```

This first example uses a fixed serialized fragment to expose the transport shape. In an adapter, call the actual serializer inside `Fx.sync` so that serialization runs per subscription. For example, the following React serializer produces a static account summary. It deliberately does not produce a hydratable React application.

```tsx
import * as Fx from "@typed/fx/Fx";
import { HtmlRenderEvent } from "@typed/template/RenderEvent";
import { renderToStaticMarkup } from "react-dom/server";

export const accountSummary = (name: string) => Fx.sync(() =>
  HtmlRenderEvent(renderToStaticMarkup(<article><h2>{name}</h2></article>), true),
);
```

React escapes `name` while it serializes the element tree. Typed receives that serializer's completed markup, so it must not escape the whole fragment again. Choose this path for a static summary; use the [streaming React adapter](/integrate/react) when the account panel must hydrate or reveal Suspense output. See [React static markup](https://react.dev/reference/react-dom/server/renderToStaticMarkup).

## Keep account data out of the serializer escape hatch

Typed templates escape ordinary interpolated strings. `HtmlRenderEvent` deliberately bypasses that escaping
because its `html` field is already markup.

Construct it only inside code that owns the serializer. Do not accept an arbitrary string from a caller and
rename it “trusted.” If the value is data, keep it as data:

```ts
import { html } from "@typed/template";

const search = '<img src=x onerror="alert(1)">';
const page = html`<p>${search}</p>`;
```

The template renderer escapes `search`. Wrapping the same value in `HtmlRenderEvent` would opt out of that
protection.

## Ordered chunks

`last` marks the final chunk of one logical render. It is not a generic stream-completion flag. A renderer
that already exposes ordered chunks can preserve that protocol directly:

```ts
import { Fx } from "@typed/fx";
import { HtmlRenderEvent } from "@typed/template/RenderEvent";

const output = Fx.fromIterable([
  HtmlRenderEvent("<article>", false),
  HtmlRenderEvent("<h1>Typed</h1>", false),
  HtmlRenderEvent("</article>", true),
]);
```

A non-empty render has exactly one terminal event. An empty render emits nothing. A failed or interrupted
render does not invent a terminal chunk. If a foreign streaming API reports only completion, either buffer its pending final chunk or append an empty terminal event after successful completion, as the React recipe does. Choose one policy in the adapter; never mark each transport chunk as a complete logical render.

## Let the HTTP response own byte transport

At the HTTP edge, project the events back to bytes and let Effect own the response stream.

```ts
import { Stream } from "effect";
import { Fx } from "@typed/fx";
import { HtmlRenderEvent } from "@typed/template/RenderEvent";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";

const rendered = Fx.fromIterable([
  HtmlRenderEvent("<main>", false),
  HtmlRenderEvent("Typed</main>", true),
]);

const body = rendered.pipe(
  Fx.map((event) => event.html),
  Fx.toStream,
  Stream.encodeText,
);

export const response = HttpServerResponse.stream(body, {
  headers: { "content-type": "text/html; charset=utf-8" },
});
```

Applications using Typed routes normally call `ssrForHttp` for buffered output or
`streamingSsrForHttp` for streaming output. Those helpers connect template rendering to Effect's
`HttpRouter`; an adapter should not invent its own response type.

## Connect response interruption to the renderer

The renderer that opens a stream also closes it. Its Fx carries expected rendering failures in `E`, required
services in `R`, and finalizers in the run's Scope. `HtmlRenderEvent` itself owns no resource; it records a
trusted chunk and whether that chunk finishes the render.

## Prove the stream contract before testing hydration

Test a serializer with several chunks, one chunk, and no output. Assert concatenated HTML, order, and exactly one terminal marker for each non-empty logical render. Then fail between chunks: the adapter must retain the failure and must not report a successful terminal marker. Disconnect the HTTP consumer and assert that the underlying reader or renderer is cancelled.

A browser hydration test answers a different question: whether the resulting HTML and client initial state agree. It does not prove cancellation, chunk order, or server cleanup. For those, inspect the response stream directly. The platform's [readable stream cancellation contract](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/cancel) is the starting point when adapting a Web Stream.

## Related APIs

- [`HtmlRenderEvent`](/reference/%40typed%2Ftemplate%2FRenderEvent%23HtmlRenderEvent)
- [`streamingSsrForHttp`](/reference/%40typed%2Fui%2FHttpRouter%23streamingSsrForHttp)
- [Effect `HttpServerResponse`](https://effect.website/docs/v4/api/effect/unstable/http/HttpServerResponse)
