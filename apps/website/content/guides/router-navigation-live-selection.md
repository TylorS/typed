---
title: "Matcher: keep the selected page live"
summary: "Follow issue URLs through typed selection, cancellable loading, route-local services, retained layouts, and scoped recovery."
section: "Routing"
kind: "guide"
order: 6.8
---

A review application opens `/issues/42`, then the user selects issue 43 without leaving the detail
layout. The URL changes, a new record loads, and shared navigation should remain mounted. A page
that samples its route parameters only once can keep showing issue 42 indefinitely. Rebuilding the
whole application on every URL change fixes that symptom by destroying too much state.

Matcher separates selected-handler lifetime from live parameter values. It is a route table and an
Fx: when run, it observes Navigation, chooses a candidate, and emits that candidate's output. The
handler receives decoded parameters as a RefSubject so a retained handler can follow later values.
Start with the [Route input contract](/explore/route-typed-url-inputs); this guide runs that contract.

## Follow a changing issue in a complete, renderer-free example

The following program installs a test history and a concrete issue service, observes the selected
page, navigates, and waits for the second result. Ending the Scope closes the observer and selected
work. No browser or DOM is needed to test route behavior.

```ts
import * as Router from "@typed/router"
import { Context, Deferred, Effect, Layer } from "effect"
import { Fx } from "@typed/fx"
import { Navigation } from "@typed/navigation"
import { TestRouter } from "@typed/router/RouterTest"

class Issues extends Context.Service<Issues, {
  readonly title: (id: number) => Effect.Effect<string>
}>()("docs/Issues") {}

const Issue = Router.Join(Router.Parse("/issues"), Router.Int("issueId"))
const loadIssue = Effect.fn("loadIssue")(function* (issueId: number) {
  const issues = yield* Issues
  return { issueId, title: yield* issues.title(issueId) }
})
const pages = Router.match(Issue, (params) =>
  Fx.switchMapEffect(params, ({ issueId }) => loadIssue(issueId)),
)

const IssuesLive = Layer.succeed(Issues, {
  title: (id: number) => Effect.succeed(`Issue ${id}`),
})

const journey = Effect.scoped(Effect.gen(function* () {
  const seen: Array<{ readonly issueId: number; readonly title: string }> = []
  const first = yield* Deferred.make<void>()
  const second = yield* Deferred.make<void>()
  yield* Effect.forkScoped(Fx.observe(pages, Effect.fn(function* (page) {
    seen.push(page)
    yield* Deferred.succeed(page.issueId === 42 ? first : second, undefined)
  })))
  // Wait for each observed result, rather than assuming navigation means data is ready.
  yield* Deferred.await(first)
  yield* Navigation.navigate("/issues/43", { history: "push" })
  yield* Deferred.await(second)
  return seen
})).pipe(
  Effect.provide(IssuesLive),
  Effect.provide(TestRouter({ url: "https://test.local/issues/42" })),
)

const seen = await Effect.runPromise(journey)
// [{ issueId: 42, title: "Issue 42" }, { issueId: 43, title: "Issue 43" }]
```

The handler's `params` stays live. `switchMapEffect` interrupts an obsolete load when the next
parameter arrives and waits for its finalizers before starting the replacement. `Issues` remains in
the Matcher/Effect requirement channel until the outer program provides its Layer. The Deferred values
signal concrete observations without polling; a test runner should also impose a timeout so a
regression fails instead of waiting indefinitely.

Reading `yield* params` once would take a snapshot. That can be correct for setup intentionally tied
to initial selection, but it is wrong for a loader expected to follow later IDs. Keep resource identity
in the live producer and avoid copying it into a second ref through a separate navigation listener.
Cancellation applies to work integrated with Effect's lifetime; detached Promises and remote writes
need their own protocol.

## Render the live output without adding unnecessary setup

Matcher accepts plain values, Effects, Streams, Fx, or functions returning them. For UI output, plain
`html` is sufficient when no generator setup is needed.

```ts
import * as Router from "@typed/router"
import { Fx } from "@typed/fx"
import { html } from "@typed/template"

const Issue = Router.Parse("/issues/:issueId?tab=:tab?")
const pages = Router.match(Issue, (params) => {
  const heading = Fx.map(params, ({ issueId }) => `Issue ${issueId}`)
  const tab = Fx.map(params, (value) => value.tab ?? "overview")
  return html`<article><h1>${heading}</h1><p>Current tab: ${tab}</p></article>`
})
```

A component that allocates local state or acquires scoped resources can use `component(function* ...)`.
An ordinary generator-backed function returning Fx uses `Fx.fn`; an Effect command uses Effect.fn.
The constructor choice follows the work it does, not the fact that a route eventually displays it.

The first program emits successful page data only. A real loader may need first-load, refresh,
retry, and stale-result UI. Give that resource an [AsyncData state](/explore/async-data-requests-and-cache)
inside the appropriate owner. Navigation committing a URL does not prove the page's data is ready.

## Understand why one candidate wins

Path lookup chooses a structural shape before candidate guards run. Matching is case-insensitive
and ignores a trailing slash; a literal such as `/issues/new` takes precedence over a parameter
shape such as `/issues/:issueId`. Registration order decides among candidates with the same compiled
shape, not arbitrary unrelated paths.

For those same-shape candidates, selection proceeds in order: decode parameters, acquire local
dependencies, run the guard, then select the first accepted candidate. Decode failure, Guard None,
and guard failure can fall through to later candidates. New dependency scopes are rolled back when
a candidate is rejected. A selected handler failure is recovery work, not permission to run an
unrelated page.

A guard can enrich the decoded value, return None for ordinary non-match, or fail with a typed error.
Here a signed-in account page and its explicit sign-in alternative share the same route:

```ts
import * as Router from "@typed/router"
import { Context, Effect, Option } from "effect"

class Session extends Context.Service<Session, { readonly signedIn: boolean }>()("docs/Session") {}
const Account = Router.Parse("/account")
const signedIn = Effect.fn("signedIn")(function* (params: Router.Type<typeof Account>) {
  const session = yield* Session
  return session.signedIn ? Option.some(params) : Option.none()
})
const account = Router.match(Account, signedIn, "Account settings")
  .match(Account, "Sign in to continue")
  .provideService(Session, { signedIn: true })
```

This is a fallback policy, not error recovery. A directory outage should not casually become “not
signed in.” Guard's errors and services participate in selection types; the
[Guard guide](/explore/guard) explains composition and error distinctions. A guard runs during
selection; changing an unrelated session value does not automatically trigger route reselection.
Observe session inside selected work or coordinate navigation when expiry must change the page.
Server operations still enforce their own authorization.

## Keep services and layouts at the boundary that should retain them

A detail page can acquire a feature service locally, then wrap its live output in a layout. The
options form keeps those choices beside the candidate.

```ts
import * as Router from "@typed/router"
import { Context, Effect, Layer } from "effect"
import { Fx } from "@typed/fx"

class IssueLabels extends Context.Service<IssueLabels, {
  readonly title: (id: string) => string
}>()("docs/IssueLabels") {}
const LabelsLive = Layer.succeed(IssueLabels, { title: (id: string) => `Issue ${id}` })

const pages = Router.match(Router.Parse("/issues/:issueId"), {
  dependencies: [LabelsLive],
  handler: (params) => Fx.mapEffect(params, ({ issueId }) =>
    Effect.map(IssueLabels, (labels) => labels.title(issueId)),
  ),
  layout: ({ content }) => Fx.map(content, (body) => ({ section: "issues", body } as const)),
}).layout(({ content }) => Fx.map(content, (page) => ({ application: "review", page } as const)))
```

The route layout is inside the outer layout. Both receive live content and params; layouts are not
intrinsically DOM wrappers. Stable function/Layer identities let compatible outer work remain
mounted while inner work or parameters change. Construct reusable Layers and layout functions at
the owning boundary instead of manufacturing new identities during every projection.

Use `dependencies` for one candidate; `.provide(layerA, layerB)` for the cases already in a Matcher;
`.provideService` for an existing service; `.provideContext` for an existing Context. Existing values
remain owned by their creator. Providing a Layer describes acquisition and release through selected
work; assembling a route table itself starts no resources. Effect's
[Layer model](https://www.effect.website/docs/v4/requirements-management/layers) explains dependency
construction, while Matcher adds the candidate/layout selection lifetime.

A draft that must survive switching issue IDs belongs above the boundary that would discard it and
must be keyed by the issue. Local component state can intentionally reset when its owner closes.
Neither route retention nor remounting is an automatic cache-invalidation policy.

## Recover the failure that actually happened

`RouteNotFound` means no usable route selection. `RouteDecodeError` preserves invalid input after
candidate decoding exhausts; `RouteGuardError` preserves guard-selection failure. Application
load/render failures retain their own error types. Recover them where their meaning is known.

```ts
import * as Router from "@typed/router"
import { Data } from "effect"
import { Fx } from "@typed/fx"

class IssueUnavailable extends Data.TaggedError("IssueUnavailable")<{ readonly id: string }> {}
const pages = Router.match(Router.Parse("/issues/:issueId"),
  Fx.fail(new IssueUnavailable({ id: "42" })),
)
const recovered = pages.catchTag("IssueUnavailable", ({ id }) =>
  Fx.succeed({ kind: "retry" as const, id }),
)
const application = recovered.redirectTo("/not-found")
```

`matcher.redirectTo(path)` handles only RouteNotFound and returns the finished Fx. It does not hide
malformed input, guard failures, or a selected page's outage. `.catch` recovers typed errors; `.catchTag` selects tagged ones;
`.catchCause` sees full Causes, including defects and interruption. A route-local `catch` option
receives the live Cause ref and can retain its own fallback. Use fluent recovery while configuring
the Matcher, then call `.redirectTo(path)` when a not-found redirect is required. The terminal method returns Fx, so add routes, merge tables, and
provide dependencies before calling it. Standalone Router recovery functions remain available
for compatibility and for inputs that are already Fx.

## Compose a larger application without another history

`merge` combines route tables while preserving their local providers/layouts/recovery. `prefix`
mounts their paths under a fragment. For an independently owned nested Matcher, CurrentRoute supplies
a structural mount boundary with ancestry.

```ts
import * as Router from "@typed/router"
import { Fx } from "@typed/fx"

const admin = Router.match(Router.Slash, "Administration")
  .match(Router.Parse("users"), "Manage users")
const mounted = admin.pipe(Fx.provide(Router.CurrentRoute.extend(Router.Parse("/admin"))))
const publicPages = Router.match(Router.Slash, "Home").match(Router.Parse("/help"), "Help")
const flatApplication = publicPages.merge(admin.prefix(Router.Parse("/admin")))
```

The nested example matches `/admin` and `/admin/users`. CurrentRoute describes the mount and parent
tree; Navigation.currentEntry describes the changing URL. `extend` takes the exact mount Route,
so compose a complete route explicitly for deeper mounts. Both approaches share one Navigation
provider. Installing another BrowserRouter in every child creates another history owner instead of
expressing nesting.

Choose BrowserRouter at the browser edge, ServerRouter for a server location, and TestRouter for
repeatable journeys. Continue with [Navigation](/explore/navigation-as-an-effect-service) for
history policy and unsaved-work coordination, or [Effect HTTP](/explore/integrating-matcher-with-effect-http)
to run renderable Matcher output per request. When debugging, trace URL shape, decoded params,
selected candidate, live parameter observation, then resource state in that order; each boundary
has a distinct failure and lifetime contract.
