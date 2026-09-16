---
title: "Server rendering and hydration"
summary: "Extend a shared counter through an explicit server-to-browser handoff."
section: "Template rendering"
kind: "guide"
order: 4
---

Render the same counter on the server and in the browser. The server encodes its initial state
into HTML; the browser restores that state and connects behavior to the existing button. These
are separate runs sharing a program and serialized state, not an in-memory subject.

The example has three files: a shared view, a server document, and a browser entry for `#app`.

This article joins [HTML serialization](/explore/rendering-html-on-the-server) with
[DOM mounting](/explore/mounting-dom-output). Use those guides for the individual APIs and
[Hydrating Typed HTML](/explore/hydrating-typed-html) for detailed mismatch diagnosis.

## Make the handoff explicit in the shared view

The shared counter starts at 12. Its state is visible before and after client startup:

```ts file="SavedCount.ts"
import { Schema } from "effect";
import { RefSubject } from "@typed/fx";
import { component, html } from "@typed/template";

export const SavedCount = component(function* () {
  const count = yield* RefSubject.hydrate(Schema.Finite, 12);

  return html`<button type="button" ref=${count} onclick=${RefSubject.increment(count)}>
    Count: ${count}
  </button>`;
});
```

The generator creates state per run. On the server, the hydration ref encodes the chosen value on
its button host. In the browser, that ref restores the encoded value before the text subscription
starts. The click handler is installed only in the browser.

## Put the shared view inside a server-owned shell

Production entries import the shared `SavedCount` implementation rather than duplicating it:

```ts file="server.ts"
import { Effect } from "effect";
import { html, HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { SavedCount } from "./SavedCount.js";

const documentPage = html`<!doctype html><html lang="en">
  <head><title>Shared counter</title></head>
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

```ts file="client.ts"
import { Effect, Fiber } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { SavedCount } from "./SavedCount.js";

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
run has already finished. For buffered versus streamed transport, see
[HTML serialization](/explore/rendering-html-on-the-server); for request routing, see
[Integrating Matcher with Effect HTTP](/explore/integrating-matcher-with-effect-http).

## Prove all three handoffs

First assert the response contains the intended encoded state and finite HTML. Then retain its
button object before starting the browser and assert that startup keeps it. Finally click the
button and verify the count changes from the server value; after interruption, verify further
clicks no longer run the handler.

Those checks distinguish serialization, adoption, and live lifetime. Matching final text alone
can hide a fresh replacement. Editable controls also need an explicit
[early-edit policy](/explore/hydrating-typed-html#decide-what-should-happen-to-early-edits).

If one check fails, follow its owner: response data/encoding, host and marker compatibility, or the
browser's subscriptions and events. A single label such as "SSR works" is too broad to locate the
failure or establish that this handoff is correct.

For mixed-framework output, see [which integrations preserve streaming SSR](/explore/streaming-framework-integrations).
