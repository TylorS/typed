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

## Check the journey

Open issue 42, follow the link to 43, then use Back. The selected output should follow the URL. Call `stop` and verify that later navigation does not update this mount.

<span id="grow-url-state-from-the-users-expected-behavior"></span>

The small app is complete. For shareable filters, continue with [typed URL inputs](/explore/route-typed-url-inputs). That lesson owns encoding and validation; [Navigation](/explore/navigation-as-an-effect-service) owns push versus replace.

<span id="recover-at-the-boundary-that-knows-what-failed"></span>

Keep route-not-found recovery separate from a failed page request. [Matcher recovery](/explore/router-navigation-live-selection#recover-the-failure-that-actually-happened) describes those boundaries.

<span id="change-the-runtime-provider-keep-the-application-contract"></span>

Use BrowserRouter for the browser, TestRouter for memory history, and ServerRouter for a request location. The [HTTP recipe](/explore/integrating-matcher-with-effect-http) shows request-local provision; sharing route declarations does not mean sharing mutable request state.
