---
title: "Serve a Matcher through Effect HTTP"
summary: "Serve a renderable Matcher as GET HTML routes through Effect HTTP, with request-local state and buffered or streaming responses."
section: "Integration"
kind: "guide"
order: 10.2
---

Use `@typed/ui/HttpRouter` to serve a renderable Matcher as GET HTML routes through Effect HTTP.
This guide makes a real request to a typed route, then shows how to run the server and choose
buffered or streaming responses. Each request receives its own Navigation and CurrentRoute services.

Start with [typed URL inputs](/explore/route-typed-url-inputs) and
[live Matcher selection](/explore/router-navigation-live-selection) if you have not built a Matcher.
The same route contracts apply here, with a lifetime of one HTTP request.

<span id="register-a-report-page"></span>

## Verify a deep link with a real request

This complete program starts an ephemeral Node test server, requests an issue page, reads its body,
and closes the server with the provided Layer's Scope. It uses static HTML because this particular
response is not intended to hydrate.

```ts
import * as Router from "@typed/router"
import { NodeHttpServer } from "@effect/platform-node"
import { Effect, Layer } from "effect"
import { HttpClient, HttpRouter } from "effect/unstable/http"
import { Fx } from "@typed/fx"
import { html, StaticHtmlRenderTemplate } from "@typed/template"
import { handleHttpServerError, ssrForHttp } from "@typed/ui/HttpRouter"

const Issue = Router.Join(Router.Parse("/issues"), Router.Int("issueId"))
const pages = Router.match(Issue, (params) =>
  html`<main><h1>Issue ${Fx.map(params, ({ issueId }) => issueId)}</h1></main>`,
)

const Server = HttpRouter.use(ssrForHttp(pages)).pipe(
  Layer.provide(HttpRouter.use(handleHttpServerError)),
  Layer.provide(StaticHtmlRenderTemplate),
  HttpRouter.serve,
  Layer.provideMerge(NodeHttpServer.layerTest),
)

const inspect = Effect.gen(function* () {
  const response = yield* HttpClient.get("/issues/42?issueId=999")

  return { status: response.status, body: yield* response.text }
}).pipe(Effect.provide(Server), Effect.scoped)

const result = await Effect.runPromise(inspect)

// { status: 200, body: "<main><h1>Issue 42</h1></main>" }
```

The path capture wins over the same-named query input. The adapter decodes the numeric ID before
the template sees it. `ssrForHttp` buffers the complete rendered body and sets an HTML content type;
this is an HTTP test, not merely a call to an HTML serializer.

The test server supplies an HTTP client configured for its own address, so the request can use a
relative path. The server and request resources close when the program completes.

<details>
<summary>Complete listening-server entry point</summary>

## Separate route registration from listening

`HttpRouter.use(ssrForHttp(pages))` is a Layer describing registrations. It does not bind a port.
Both `ssrForHttp` and `streamingSsrForHttp` accept `helper(router, matcher)` or
`helper(matcher)(router)`; the latter fits `HttpRouter.use`.

A Node entry point must supply the server and launch the resulting Layer. Here is a minimal complete
static server; replace the page table with the application's renderable Matcher.

```ts
import * as Router from "@typed/router"
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node"
import { Layer } from "effect"
import * as HttpRouter from "effect/unstable/http/HttpRouter"
import * as Http from "node:http"
import { html, StaticHtmlRenderTemplate } from "@typed/template"
import { handleHttpServerError, ssrForHttp } from "@typed/ui/HttpRouter"

const pages = Router.match(Router.Slash, html`<!doctype html><html lang="en">
  <head><meta charset="utf-8" /><title>Home</title></head>
  <body><main><h1>Home</h1></main></body>
</html>`)

const Routes = HttpRouter.use(ssrForHttp(pages)).pipe(
  Layer.provide(HttpRouter.use(handleHttpServerError)),
  Layer.provide(StaticHtmlRenderTemplate),
)

Routes.pipe(
  HttpRouter.serve,
  Layer.provide(NodeHttpServer.layer(Http.createServer, { port: 3000 })),
  Layer.launch,
  NodeRuntime.runMain,
)
```

This serves one GET HTML page. Register assets and non-GET endpoints with the surrounding Effect
HTTP server; the adapter only registers the Matcher's GET routes.

</details>

<span id="keep-per-request-context-per-request"></span>

## Provide shared services and keep request state local

Registration captures the services provided to the Matcher. Each request combines those services
with its active HTTP context and creates navigation and current-route state for the requested URL.
Provide shared resources, such as a database pool, through the server Layer. Resolve user identity,
cookies, and other request metadata within request handling; do not store one request's mutable
state in a process-wide service.

The [Matcher ownership rules](/explore/router-navigation-live-selection) still apply: rejected
candidates release their resources, and selected work ends with the request.

<span id="choose-buffering-or-streaming"></span>

## Choose streaming from the response requirements

Buffered rendering lets the complete body be produced before a response is returned. Streaming can
send renderer chunks earlier, but failures may then occur after headers or content have already been
sent. The choice changes recovery and cancellation behavior, not route syntax.

```ts
import * as Router from "@typed/router"
import { Layer } from "effect"
import * as HttpRouter from "effect/unstable/http/HttpRouter"
import { html, StaticHtmlRenderTemplate } from "@typed/template"
import { streamingSsrForHttp } from "@typed/ui/HttpRouter"

const pages = Router.match(Router.Slash, html`<main><h1>Home</h1></main>`)

const StreamingPages = HttpRouter.use(streamingSsrForHttp(pages)).pipe(
  Layer.provide(StaticHtmlRenderTemplate),
)
```

Serve this registration with the same host setup as above. Both adapters work with
`StaticHtmlRenderTemplate`. Serializer choice is separate from whether the response is buffered
or streamed. For HTML that will hydrate, use `HtmlRenderTemplate` and arrange the browser handoff
as described in [server rendering and hydration](/explore/server-rendering-and-hydration).

A disconnected streaming client should cause the request stream's owned work to be interrupted;
verify that through the actual host. Once bytes have been sent, a late failure cannot be handled by
replacing the entire response with a fresh status page. Recover expected resource failures within
the page when that is the desired interaction, and log unexpected failures with enough request
context to diagnose them.

<span id="distinguish-route-errors-from-domain-errors"></span>

## Put each error at its meaningful boundary

Cases with the same registered path are tried in compiled candidate order. Decode or guard rejection
can allow another candidate; a selected renderer failure does not justify serving an unrelated page.
Exhausted decoding becomes a structured request-parse failure; exhausted selection without a usable
candidate becomes not-found.

`handleHttpServerError` maps structured request-parse, not-found, and server failures to empty 400,
404, or 500 responses. It leaves other application errors in the typed request channel. If the
product needs an explanatory error page, recover that domain failure explicitly rather than
assuming the generic HTTP handler renders one.

<span id="verify-the-request-boundary"></span>

## Verify the HTTP boundary

Check observable HTTP behavior through the server, including:

- A valid deep link, a malformed numeric parameter, repeated declared query keys, and an unmatched
  path. Assert the response status and body.
- Rejected guards and selected-page failures. A renderer unit test cannot establish HTTP status
  behavior or registration precedence.
- Two requests with different user or request metadata. Each must see only its own values.
- Streaming cancellation through the actual host, including cleanup of work owned by the request.
- A direct reload of `/issues/42` through production-style host routing. An in-app click from `/`
  does not establish that the reverse proxy sends deep links to this server.

See [testing Typed systems](/explore/testing-typed-systems) for test patterns and
[HttpRouter](/reference/modules/%40typed%2Fui%2FHttpRouter) for adapter overloads. To continue with an
interactive browser page, follow [server rendering and hydration](/explore/server-rendering-and-hydration)
and [state hydration](/explore/refsubject-template-hydration).
