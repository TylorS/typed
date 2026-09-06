---
title: "Routes, Matchers, and Navigation"
summary: "Build a small linked review app, then trace which contract owns URL input, history, selected work, and page readiness."
section: "Routing"
kind: "concept"
order: 6.6
---

A review app has a queue and an issue page. Opening an issue should produce a shareable URL. Clicking
another issue should update the selected page. Back should return to the queue, and stopping the
application should release its history listener and rendering subscriptions.

These requirements involve three contracts. Route describes valid URL input. Navigation owns history
and the decision to commit a destination. Matcher selects and owns live work for the committed URL.
A renderer consumes that work. Keeping those responsibilities visible makes routing usable in tests,
server requests, commands, and UI without forcing all of them into one component lifecycle.

## Run the smallest linked application

Place this browser entry in a page containing a dedicated `<div id="review-app"></div>`. It uses
plain templates because no component-local state needs setup. The app's running Effect owns both
the renderer and the browser router; the exported stop function is for the host that owns this mount.

```ts
import * as Router from "@typed/router"
import { Effect, Fiber } from "effect"
import { Fx } from "@typed/fx"
import { DomRenderTemplate, html, render } from "@typed/template"
import { Link } from "@typed/ui/Link"

const Queue = Router.Parse("/issues")
const Issue = Router.Join(Queue, Router.Int("issueId"))
const pages = Router.match(Queue, html`<main><h1>Review queue</h1>
    ${Link({ href: "/issues/42", content: "Review issue 42" })}
  </main>`)
  .match(Issue, (params) => html`<main>
    <h1>Issue ${Fx.map(params, ({ issueId }) => issueId)}</h1>
    ${Link({ href: "/issues/43", content: "Next issue" })}
  </main>`)
  .match(Router.Parse("/not-found"), html`<main><h1>Page not found</h1></main>`)
  .layout(({ content }) => html`
    <nav aria-label="Primary">${Link({ href: "/issues", content: "Queue" })}</nav>
    ${content}
  `)

const host = document.getElementById("review-app")
if (host === null) throw new Error("Missing review-app host")
const application = pages.redirectTo("/not-found").pipe(
  render(host),
  Fx.drain,
  Effect.provide(DomRenderTemplate.using(host.ownerDocument)),
  Effect.provide(Router.BrowserRouter(window)),
  Effect.scoped,
)
const fiber = Effect.runFork(application)
export const stop = () => Effect.runPromise(Fiber.interrupt(fiber))
```

Open the page at `/issues` on a host configured to serve this browser entry for its application URLs.
The example intentionally shows the decoded issue ID rather than pretending to fetch an issue.
The later [Matcher lesson](/explore/router-navigation-live-selection) adds a concrete service and
an executable test for loading when that ID changes.

`Router.Int` gives the handler a number. `Link` keeps a real href and routes eligible clicks through
Navigation. The layout wraps selected content and can remain compatible across inner selection.
The template observes the parameter ref, so moving from issue 42 to 43 changes the heading without
a second imperative URL listener.

The stop function interrupts the running Effect; its Scope closes the live render and provided
browser-history resources. Merely retaining `pages` does not run the application. A host that mounts
this feature temporarily must call its disposal operation when that owner ends.

## Trace a click through the contracts

Clicking “Next issue” asks Navigation to move to `/issues/43`. Before-navigation handlers can block,
cancel, or redirect that proposal. When the destination commits, CurrentPath publishes pathname plus
search. Matcher looks up a path shape, decodes the parameters, checks candidate guards, and updates
the selected work.

The Issue handler receives live parameters. It can retain compatible local setup while its parameter
ref changes. The layout receives live inner content. If a different handler is selected, the old
handler's Scope is replaced and owned work is finalized. Neither retaining nor replacing work
automatically decides whether a draft or cached resource should survive; the feature chooses its
owner and resource identity.

| Contract | Question it answers | Next lesson |
| --- | --- | --- |
| Route | Which path/query values are valid, and what are their decoded types? | [Typed URL inputs](/explore/route-typed-url-inputs) |
| Navigation | What is committed, what is pending, and how should history change? | [History and unsaved work](/explore/navigation-as-an-effect-service) |
| Matcher | Which candidate runs, which services/layouts stay mounted, and what updates? | [Live route selection](/explore/router-navigation-live-selection) |
| CurrentRoute | Where is this child structurally mounted? | [Nested Matcher composition](/explore/router-navigation-live-selection) |

CurrentRoute is a structural mount tree, not a replacement for currentEntry or a current parameter
record. Nested routing shares Navigation; it does not need another browser-history instance.

## Grow URL state from the user's expected behavior

The queue will eventually need filters. Put query, sort, page, and workspace in the URL when users
should share or reload them. Keep incomplete draft text local unless URL restoration is a deliberate
requirement. Derive defaults once, encode values correctly, and validate domain constraints before
application operations use them.

History policy is a separate choice. Opening a new issue usually pushes; updating a transient filter
may replace. Link's push default and navigate's `auto` default are different, so an interaction that
relies on Back behavior should choose explicitly. The Navigation lesson tests a queue/detail/tab/Back
journey and then adds an editor blocker.

A committed destination is not a fully loaded page. A request can still be pending, refresh an old
value, or fail after selection. Put that lifecycle in
[AsyncData](/explore/async-data-requests-and-cache) and coordinate latest-parameter requests with Fx.
A focus operation that needs an element should wait for that element's lifecycle, not assume that
navigation completion means DOM readiness.

## Recover at the boundary that knows what failed

The example redirects only RouteNotFound to an explicit not-found page. An invalid numeric ID is
a decoding problem; an unavailable issue service is a resource problem; an unsaved-work cancellation
is a navigation decision. Redirecting all of them to “not found” would discard their meaning.

A Route schema keeps decoding errors and requirements visible. Matcher preserves route-selection
and handler failures; its recovery combinators let a feature decide what to display. Navigation
has its own transition errors and cancellation/redirect protocol. This separation is useful when
tracing a bug: inspect the actual URL, decoded inputs, selected candidate, and resource state before
changing the rendering code.

## Change the runtime provider, keep the application contract

BrowserRouter integrates with browser history. TestRouter supplies deterministic memory history for
a finite test journey. ServerRouter supplies a server location without evaluating browser globals.
The [HTTP adapter](/explore/integrating-matcher-with-effect-http) takes renderable Matcher output and
creates request-local routing services for GET HTML responses.

Sharing a Route/Matcher declaration is different from sharing one mutable history across requests.
Provide request services per request, application services at their real feature boundary, and the
renderer at the mounting/serialization edge. The Route, Matcher, and Navigation types retain
requirements until those boundaries satisfy them.

Follow the lessons in the order needed by your feature: define the URL contract, connect live page
work, choose history policy, then serve or test the same contract in another runtime. The reference
pages for [Route](/reference/modules/%40typed%2Frouter%2FRoute),
[Matcher](/reference/modules/%40typed%2Frouter%2FMatcher), and
[Navigation](/reference/modules/%40typed%2Fnavigation%2FNavigation) list their full public surfaces.
