---
title: "Serve a Matcher through Effect HTTP"
summary: "Run typed issue pages as request-local GET HTML routes, choose buffered or streaming responses, and test the real HTTP boundary."
section: "Integration"
kind: "guide"
order: 10.2
---

The review application already knows what `/issues/42` means in the browser. A deep link now needs
server HTML before the browser application starts. Reimplementing the path parser in a server route
would create two input contracts; sharing a browser history instance with requests would create the
wrong state lifetime.

`@typed/ui/HttpRouter` adapts a renderable Matcher to Effect HTTP. It compiles the route table into
GET registrations and supplies request-local Navigation and CurrentRoute when handling each URL.
Template serializes the selected output. The surrounding server still owns the listening socket,
assets, mutation endpoints, and browser entry point.

Read [typed URL inputs](/explore/route-typed-url-inputs) and
[live Matcher selection](/explore/router-navigation-live-selection) first. Here the same contracts
are used for one request rather than a long-lived browser subscription.

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

The adapter supplies UUIDv7 state for request-local navigation. A production server does not need
IdsTest or TestRouter. The test server supplies an HTTP client configured for its own address, so
the request can use a relative path and the program can finalize everything when it completes.

## Separate route registration from listening

`HttpRouter.use(ssrForHttp(pages))` is a Layer describing registrations. It does not bind a port.
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
  <head><meta charset="utf-8" /><title>Review queue</title></head>
  <body><main><h1>Review queue</h1></main></body>
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

This server supplies one GET HTML page. Add asset routes and deployment-base handling where the
server is assembled. Add mutation endpoints through Effect HTTP's own request decoding and
response APIs; a browser form still needs a real client request and server-side validation and
authorization. The HTML adapter does not generate a client bundle or turn page handlers into an RPC
protocol.

## Carry dependencies across the boundary without sharing request state

A page can require an Issues service whose server implementation uses a database. The browser can
provide a transport-backed implementation of the same domain contract. Preserve those requirements
in the Matcher instead of closing over a runtime-specific resource or casting away `R`.

Registration captures its surrounding services. For each request, the adapter combines them with
active request services and creates memory history/current-route state for that request URL. A
shared database pool belongs in the server Layer. User identity, cookies, and request metadata belong
to request handling. Do not install one request's mutable user or history as process-wide state.

Keep Route declarations and domain codecs in a module that neither imports browser globals nor a
server database Layer. Share the contract, then provide the runtime implementation at the edge.
Candidate dependencies, guards, layouts, and recovery retain the
[Matcher ownership rules](/explore/router-navigation-live-selection), including rollback of rejected
candidate resources and cleanup of selected work when the request ends.

A useful test makes two requests with different metadata/users and asserts each sees its own values.
Testing one request cannot reveal accidental cross-request retention.

## Choose streaming from the response requirements

Buffered rendering lets the complete body be produced before a response is returned. Streaming can
send renderer chunks earlier, but failures may then occur after headers or content have already been
sent. The choice changes recovery and cancellation behavior, not route syntax.

```ts
import * as Router from "@typed/router"
import { Layer } from "effect"
import * as HttpRouter from "effect/unstable/http/HttpRouter"
import { html, HtmlRenderTemplate } from "@typed/template"
import { streamingSsrForHttp } from "@typed/ui/HttpRouter"

const pages = Router.match(Router.Slash, html`<main><h1>Review queue</h1></main>`)
const StreamingPages = HttpRouter.use(streamingSsrForHttp(pages)).pipe(
  Layer.provide(HtmlRenderTemplate),
)
```

This registration is for a host that will supply and serve the HTTP router as above. HtmlRenderTemplate
preserves Typed HTML information for a possible hydration handoff; StaticHtmlRenderTemplate is the
appropriate serializer when the output will remain static. Neither renderer injects the browser's
entry script for you.

A disconnected streaming client should cause the request stream's owned work to be interrupted;
verify that through the actual host. Once bytes have been sent, a late failure cannot be handled by
replacing the entire response with a fresh status page. Recover expected resource failures within
the page when that is the desired interaction, and log unexpected failures with enough request
context to diagnose them.

## Put each error at its meaningful boundary

Cases with the same registered path are tried in compiled candidate order. Decode or guard rejection
can allow another candidate; a selected renderer failure does not justify serving an unrelated page.
Exhausted decoding becomes a structured request-parse failure; exhausted selection without a usable
candidate becomes not-found.

`handleHttpServerError` maps structured request-parse, not-found, and server failures to empty 400,
404, or 500 responses. It leaves other application errors in the typed request channel. If the
product needs an explanatory error page, recover that domain failure explicitly rather than
assuming the generic HTTP handler renders one.

Test malformed numeric parameters, repeated declared query keys, unmatched paths, rejected guards,
and selected-page failures. Inspect status and body as well as the error channel. A successful
`renderToHtmlString` unit test cannot establish registration precedence or response status behavior.

## Define the continuation after the first HTML

A browser that receives a loading placeholder needs a client continuation or an explicit update
transport. Streaming HTML alone does not establish a permanent connection between server
RefSubjects and browser DOM. Decide whether the server awaits initial data, streams it, or transfers
an AsyncData snapshot that the browser will refresh.

For interactive output, include a browser entry point and hydrate a compatible state/template
snapshot. Avoid constructing an unrelated client default that contradicts the server HTML. The
[state hydration guide](/explore/refsubject-template-hydration) covers Schema-checked state transfer;
[server rendering and hydration](/explore/server-rendering-and-hydration) covers the larger handoff.

Finally, test a production-style deep link through the real host routing and asset base. A reverse
proxy or static host must actually send `/issues/42` to this server for the adapter to handle it.
A successful in-app click from `/` does not prove a reload at the deep URL works. See
[HttpRouter](/reference/modules/%40typed%2Fui%2FHttpRouter) for adapter overloads and
[testing Typed systems](/explore/testing-typed-systems) for focused host tests.
