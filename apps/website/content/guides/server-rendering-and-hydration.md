---
title: "Server rendering and hydration"
summary: "Send buffered or streamed Typed HTML from Effect HTTP, then adopt that same inner template in the browser."
section: "Template rendering"
kind: "guide"
order: 4
---

Sending an interactive saved-article page involves three owners. A request prepares initial data,
the HTML renderer serializes a finite view, and the browser starts a new live run that adopts the
existing output. The runs share a program and serialized state; they do not share an in-memory
subject or a long-lived server component instance.

This article joins [HTML serialization](/explore/rendering-html-on-the-server) with
[DOM mounting](/explore/mounting-dom-output). Use those guides for the individual APIs and
[Hydrating Typed HTML](/explore/hydrating-typed-html) for detailed mismatch diagnosis.

## Make the handoff explicit in the shared view

Start with a saved-result counter whose state is visible before and after client startup:

```ts
import { Schema } from "effect";
import { RefSubject } from "@typed/fx";
import { component } from "@typed/ui/Component";
import { html } from "@typed/template";

export const SavedCount = component(function* () {
  const count = yield* RefSubject.hydrate(Schema.Finite, 12);
  return html`<button type="button" ref=${count} onclick=${RefSubject.increment(count)}>
    Saved articles: ${count}
  </button>`;
});
```

The generator creates state per run. On the server, the hydration ref encodes the chosen value on
its button host. In the browser, that ref restores the encoded value before the text subscription
starts. The click handler is installed only in the browser.

The number is a deliberately small stand-in for request data. In a real collection page, obtain
authorized initial data through a request-provided Effect service. Keep each request's mutable state
inside that request; a module-level RefSubject would combine otherwise independent users' lifetimes.

## Put the shared view inside a server-owned shell

The following self-contained server example repeats `SavedCount`; production entries should import
one shared implementation so its authored template cannot drift:

```ts
import { Effect, Schema } from "effect";
import { RefSubject } from "@typed/fx";
import { component } from "@typed/ui/Component";
import { html, HtmlRenderTemplate, renderToHtmlString } from "@typed/template";

const SavedCount = component(function* () {
  const count = yield* RefSubject.hydrate(Schema.Finite, 12);
  return html`<button type="button" ref=${count} onclick=${RefSubject.increment(count)}>
    Saved articles: ${count}
  </button>`;
});

const documentPage = html`<!doctype html><html lang="en">
  <head><title>Saved articles</title></head>
  <body>
    <div id="app">${SavedCount}</div>
    <script type="module" src="/client.js"></script>
  </body>
</html>`;

export const responseBody = documentPage.pipe(
  renderToHtmlString,
  Effect.provide(HtmlRenderTemplate),
  Effect.scoped,
);
```

The inner template's markers remain below `#app` after document parsing. The response adapter owns
status, content type, encoding, and asset URLs. This Effect only serializes the body.

Choose `HtmlRenderTemplate` for interactive adoption. Choosing `StaticHtmlRenderTemplate` would
produce intentionally static markup and omit the handoff metadata, even though the visible text
could look identical.

## Start a separate browser run at the inner boundary

```ts
import { Effect, Fiber, Schema } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { component } from "@typed/ui/Component";
import { DomRenderTemplate, html, render } from "@typed/template";

const SavedCount = component(function* () {
  const count = yield* RefSubject.hydrate(Schema.Finite, 12);
  return html`<button type="button" ref=${count} onclick=${RefSubject.increment(count)}>
    Saved articles: ${count}
  </button>`;
});

const host = document.getElementById("app");
if (host === null) throw new Error("Missing #app host");
const application = SavedCount.pipe(
  render(host),
  Fx.drain,
  Effect.provide(DomRenderTemplate.using(host.ownerDocument)),
  Effect.scoped,
);
const fiber = Effect.runFork(application);
export const stop = () => Effect.runPromise(Fiber.interrupt(fiber));
```

The client renders `SavedCount`, not `documentPage`, because its host already sits inside the
server-owned document. `render` builds the hydration context from that host and connects the matching
button. Do not clear the host first or insert unrelated owned widgets among its replaceable children.

After restoration, clicking increments the browser's subject from the serialized value. The server
run has already finished. A later save service belongs to the live browser application, not to the
response that created the HTML.

## Keep transport timing separate from adoption

`renderToHtmlString` buffers the body. `renderToHtml` exposes ordered strings for an incremental
transport. Both can carry the same hydratable markup, but a streamed response cannot change already
sent headers after a later failure. Resolve expected request errors before committing a successful
response, and let cancellation close the response's rendering work.

A Typed route matcher can use `ssrForHttp` or `streamingSsrForHttp` from `@typed/ui/HttpRouter` above
this boundary. [Integrating Matcher with Effect HTTP](/explore/integrating-matcher-with-effect-http)
covers route registration. These helpers do not change the inner-host or initial-state agreement.

## Prove all three handoffs

First assert the response contains the intended encoded state and finite HTML. Then retain its
button object before starting the browser and assert that startup keeps it. Finally click the
button and verify the count changes from the server value; after interruption, verify further
clicks no longer run the handler.

Those checks distinguish serialization, adoption, and live lifetime. Matching final text alone
can hide a fresh replacement. For an editable control, add the chosen early-edit policy: retained
identity does not prevent a `.value` binding from overwriting a pre-startup edit. For lists, also
assert retained keyed item identity after a reorder.

If one check fails, follow its owner: response data/encoding, host and marker compatibility, or the
browser's subscriptions and events. A single label such as "SSR works" is too broad to locate the
failure or establish that this handoff is correct.
