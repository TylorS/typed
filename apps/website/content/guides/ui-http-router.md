---
title: "HttpRouter: serve Typed routes through Effect HTTP"
summary: "Understand GET registration, decoding, request services, and buffered versus streaming HTML."
section: "UI / Foundations"
kind: "deep-dive"
order: 297
---

A client route matcher describes which UI belongs to a URL. A server must additionally decode an HTTP request, run that route with request-local services, render HTML, and choose a response policy. `@typed/ui/HttpRouter` adapts Typed matchers to Effect's HTTP router so those responsibilities can meet without replacing your route model.

Prerequisites: [typed URL inputs](/explore/route-typed-url-inputs) and [server HTML rendering](/explore/rendering-html-on-the-server). This integration targets the repository's installed [Effect v4](https://effect.website/docs/v4) `effect/unstable/http` modules. It is an HTTP server integration, separate from static-site output.

## Register a report page

This complete route-registration layer renders a report identifier from the matched URL. The deployment's Effect HTTP server supplies the transport; this module does not choose a port or start listening as a side effect of import.

```ts
import * as Router from "@typed/router"
import { Fx } from "@typed/fx";
import { html, StaticHtmlRenderTemplate } from "@typed/template";
import { handleHttpServerError, ssrForHttp } from "@typed/ui/HttpRouter";
import { Effect, Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";

const reportRoute = Router.Join(Router.Parse("reports"), Router.Param("reportId"));
const reports = Router.match(reportRoute, (params) => html`
  <main>
    <h1>Report ${params.pipe(Fx.map(({ reportId }) => reportId))}</h1>
    <p>Review the report before sharing it.</p>
  </main>
`);

export const ReportRoutes = HttpRouter.use(Effect.fn(function* (router) {
  yield* handleHttpServerError(router);
  yield* ssrForHttp(router, reports);
})).pipe(Layer.provide(StaticHtmlRenderTemplate));
```

The adapter registers GET routes. Paths that share the same HTTP path are grouped as route candidates; the Typed executor still chooses and decodes the matching case. Query matching is handled by Typed rather than copying a query expression into the server path registration. Parsed query values are merged with path parameters, with path parameters authoritative when keys collide.

## Keep per-request context per request

At registration, the adapter captures application services required by the matcher. At handling time it merges request-provided services, creates memory navigation from the actual request URL, and supplies the current Typed route context to the executor. An enclosing `CurrentRoute` can prefix registration and establish parent route context.

Do not store request-specific mutable state in a singleton captured at registration. Authentication, request metadata, and resource ownership must use the intended request/service boundary. The integration provides its navigation/router and Effect HTTP requirements; it does not silently provide every service in your page's R channel. A compile error showing an unprovided service is useful evidence about the application boundary.

## Choose buffering or streaming

`ssrForHttp` renders the complete HTML string before returning a text response with `text/html; charset=utf-8`. This is straightforward when you need rendering to finish before response delivery. `streamingSsrForHttp` renders chunks, converts them to an Effect Stream, UTF-8 encodes them, and returns a streaming response. The streamed body keeps the request context needed when the server later consumes it.

Streaming does not mean typed failures disappear. A failure before the response is returned can follow the HTTP error path; a failure after body delivery starts cannot reliably replace already-sent status/bytes with a clean error page. Choose the policy based on real latency and failure needs. Neither function is a background client subscription to keep running after the request ends.

Both APIs support `ssrForHttp(router, matcher)` and `ssrForHttp(matcher)(router)` forms, with equivalent streaming variants. Use one registration path per intended route set to avoid duplicate endpoints.

## Distinguish route errors from domain errors

Decode errors become HTTP request-parse errors; guard rejection becomes route-not-found. `handleHttpServerError` installs global middleware mapping known HTTP errors to empty responses: route-not-found is 404, request-parse is 400, and internal/response errors are 500. Unknown application errors are re-failed rather than relabeled as a successful page.

This default middleware does not render a branded error page. If that is a product requirement, design a response/error policy at the HTTP owner. Preserve the distinction between invalid input, no route, denied route guards, and an upstream domain failure.

## Verify the request boundary

Exercise a valid URL, invalid decoded input, a guard rejection, and a missing route through an actual Effect HTTP test server. Check content type and rendered params, including a path/query collision. For streaming, consume the response body before asserting request-dependent output; merely obtaining the response does not prove context survives deferred consumption.

If every request is 404, inspect registered GET paths and parent prefixes. If template rendering asks for RenderTemplate, provide the server renderer as above. If a request-local service is missing only while streaming, inspect where it was captured/provided rather than widening types to `never`.

Continue with [server HTML rendering](/explore/rendering-html-on-the-server) for rendering mechanics and [route inputs](/explore/route-typed-url-inputs) for schemas/guards. API: [HttpRouter](/reference/modules/%40typed%2Fui%2FHttpRouter).
