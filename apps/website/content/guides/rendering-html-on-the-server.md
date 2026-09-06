---
title: "Rendering HTML on the server"
summary: "Serialize a template to HTML chunks or one string without coupling it to HTTP transport."
section: "Template rendering"
kind: "guide"
order: 2
---

A saved-article page can serve three destinations: a static export, a buffered interactive response,
or a streamed interactive response. Make two decisions independently. The renderer decides whether
the markup includes adoption metadata; the consumer decides whether to collect the output or deliver
ordered chunks.

This article starts after [template authoring](/explore/authoring-typed-templates). It owns
serialization, not HTTP route setup. For the complete browser handoff, continue to
[Server rendering and hydration](/explore/server-rendering-and-hydration).

## Choose the destination's markup contract

| Destination | Renderer layer | Typical consumer |
| --- | --- | --- |
| Email or static export | `StaticHtmlRenderTemplate` | `renderToHtmlString` |
| Interactive page with a complete buffered body | `HtmlRenderTemplate` | `renderToHtmlString` |
| Interactive page with incremental transport | `HtmlRenderTemplate` | `renderToHtml` |

Static output deliberately omits Typed hydration metadata. A later browser mount can create fresh
DOM, but it cannot infer adoption compatibility from arbitrary static HTML. Interactive output
includes the template/range information its browser counterpart needs.

## Produce a complete export without involving HTTP

```ts
import { Effect } from "effect";
import { html, renderToHtmlString, StaticHtmlRenderTemplate } from "@typed/template";

const collection = (name: string, titles: ReadonlyArray<string>) => html`<article>
  <h1>${name}</h1>
  <ul>${titles.map((title) => html`<li>${title}</li>`)}</ul>
</article>`;

export const exportCollection = (name: string, titles: ReadonlyArray<string>) =>
  collection(name, titles).pipe(
    renderToHtmlString,
    Effect.provide(StaticHtmlRenderTemplate),
    Effect.scoped,
  );
```

No setup component is needed for this plain template function. Its returned Effect succeeds with
a string; it does not send mail, write a file, or select response headers. The caller owns that next
boundary. Ordinary titles remain text, including names containing `<` or `&`.

Buffering keeps the entire output until completion, so memory grows with the document. It also
allows a render failure to be handled before committing the body to its destination.

## Keep chunks only if the transport can use them

```ts
import { Fx } from "@typed/fx";
import { html, HtmlRenderTemplate, renderToHtml } from "@typed/template";

const page = html`<main>
  <h1>Saved articles</h1>
  <p>Your collection is ready.</p>
</main>`;

export const chunks = page.pipe(renderToHtml, Fx.provide(HtmlRenderTemplate));
export const responseStream = chunks.pipe(Fx.toStream);
```

`responseStream` contains ordered strings. The response adapter must encode bytes and own status,
headers, content type, cancellation, and backpressure at its transport boundary. If the adapter
collects the stream before sending it, switching this API alone has not made the response stream.
A chunk need not be a complete element or application message.

Once a transport has committed headers and body bytes, a later render failure cannot replace them
with a different status and error document. Resolve or recover expected request-data failures before
serialization where possible. Request cancellation should interrupt rendering work rather than leave
its producers alive after the client disconnects.

## Supply values that can exist during a response

Ordinary live sources are sampled for an initial response value. The server does not keep a query
subscription open waiting for the visitor's future keystrokes. A browser-only event stream with no
initial emission can therefore stall a part instead of producing an empty value automatically.

Use request data or intentionally initialized state. Acquire services at the request boundary so
concurrent requests do not share a module-global mutable subject. Errors and service requirements
from interpolated Effects remain in the resulting program's `E` and `R` channels.

Nested `HtmlRenderEvent` streams are different: their emissions are ordered chunks of one
serialization, not successive application snapshots. They must be consumed according to their
completion protocol. Taking only their first chunk would truncate the document; see
[Using HtmlRenderEvent](/explore/html-render-event).

## Account for the fields HTML cannot represent

Events and ordinary refs do not run on the server. DOM properties such as `.value` are not
serialized as generic attributes. If the initial response should display a search query, provide
an appropriate initial `value` attribute as well as any client-controlled property. Hydration refs
are the explicit mechanism for serialized state metadata.

Escaping depends on the part's context. Attribute/text data uses its corresponding escaping;
script/style text has different closing-tag handling. `HtmlRenderEvent` asserts an existing
serializer owns the string; it is not a sanitizer for user content.
[Text-only contexts](/explore/template-text-only-contexts) develops that boundary.

## Locate a stalled response before changing render modes

Observe data readiness, first chunk, and completion separately. If no initial data arrives, fix the
producer; streaming does not invent it. If data is ready but serialization emits nothing, inspect
required services and the selected renderer. If chunks arrive without completion, inspect nested
output completion and live inputs. If serialization completes but the client sees nothing, inspect
transport buffering and encoding.

A focused serialization test parses the result and compares recovered text, verifies finite
completion, and checks metadata for the chosen layer. Test HTTP cancellation and post-header
failures at the transport adapter separately. The [Html reference](/reference/modules/%40typed%2Ftemplate%2FHtml)
defines both layers and consumers; the [HTML output recipe](/integrate/html-output) adds transport.
