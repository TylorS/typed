---
title: "Matcher: keep the selected page live"
summary: "Keep a selected page and its loader up to date by observing live, decoded route parameters."
section: "Routing"
kind: "guide"
order: 6.8
---

A Matcher selects work for the current URL and gives its handler live, decoded parameters. When
`/issues/42` changes to `/issues/43`, a retained handler must observe those parameters to update its
output. Reading them once leaves the page with a snapshot.

Start with [typed Route inputs](/explore/route-typed-url-inputs) and
[RefSubject observation](/explore/refsubject-renderer-independent-state). The loader below uses
[Fx switching](/explore/fx-higher-order-and-concurrency); its optional test also uses Effect services.

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

## Load data when the parameters change

Use `Fx.switchMapEffect(params, ({ issueId }) => loadIssue(issueId))` to cancel the previous
load and start the next one when the ID changes. The handler stays selected; its input and output stay live.

The following complete journey verifies that behavior without a renderer. It provides a small issue
service and waits for each observed result before navigating again.

<details>
<summary>Run the renderer-free loading journey</summary>

<span id="follow-a-changing-issue-in-a-complete-renderer-free-example"></span>

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
signal concrete observations without polling.

Reading `yield* params` once would take a snapshot. That can be correct for setup intentionally tied
to initial selection, but it is wrong for a loader expected to follow later IDs. Keep resource identity
in the live producer and avoid copying it into a second ref through a separate navigation listener.
Cancellation applies to work integrated with Effect's lifetime; detached Promises and remote writes
need their own protocol.

Changing the loader to sample `yield* params` once would leave the second Deferred unresolved.
Run this journey with a test timeout so that regression fails instead of hanging.

</details>

For first-load, refresh, and retry UI, give the resource an
[AsyncData state](/explore/async-data-requests-and-cache). A committed URL does not mean its data is ready.

<details>
<summary>Reference: candidate selection and fallback guards</summary>

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

</details>

## Keep services and layouts at the boundary that should retain them

Candidate `dependencies` and `layout` options belong beside the handler when they share its
lifetime. An outer `.layout` wraps the selected content. Keep reusable Layer and layout function
identities stable so compatible outer work can remain mounted as parameters change.

State that must survive replacing a handler belongs above that handler's owner. For the options
and provider methods, see the [Matcher reference](/reference/modules/%40typed%2Frouter%2FMatcher).

## Recover the failure that actually happened

A rejected candidate can fall through during selection; a selected handler's failure needs recovery.
Use `.catchTag` for a known application error while configuring the Matcher. `RouteDecodeError`
represents invalid parameters and `RouteGuardError` represents guard-selection failure.

Finish with `.redirectTo("/not-found")` only when an unmatched URL should navigate elsewhere. It
handles `RouteNotFound`, not malformed input or a page-loader failure, and returns an Fx. Add routes,
providers, and recovery before that terminal step. See
[Matcher recovery methods](/reference/modules/%40typed%2Frouter%2FMatcher) for the complete contract.

## Compose a larger application without another history

`merge` combines route tables; `prefix` mounts their paths beneath a fragment. For independently
owned nested Matchers, [CurrentRoute](/reference/modules/%40typed%2Frouter%2FCurrentRoute) describes
the structural mount and ancestry. It does not replace the changing URL in Navigation.currentEntry.
Nested Matchers share one Navigation provider.

Continue with [Navigation](/explore/navigation-as-an-effect-service) for history and unsaved-work
policy, or [Effect HTTP](/explore/integrating-matcher-with-effect-http) to run a Matcher per request.
