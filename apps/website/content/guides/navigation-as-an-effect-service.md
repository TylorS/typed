---
title: "Navigation: history and unsaved-work decisions"
summary: "Design a queue's Back behavior, observe committed versus pending destinations, and coordinate an editor's leave confirmation through Effect."
section: "Routing"
kind: "guide"
order: 6.85
---

A user filters a queue, opens issue 42, changes its tab, then presses Back. The expected destination
is a product decision: should Back undo each filter keystroke, leave the issue entirely, or return
to its previous tab? A URL contract describes valid inputs; it cannot decide this history policy.

Navigation owns history and transitions through an Effect service. Views read its live state;
commands request changes. Matcher consumes committed locations to select page work, but a command
palette, editor, or analytics operation can use Navigation without depending on a renderer or Matcher.
Start with the [routing overview](/explore/routing-routes-matchers-and-navigation) if those jobs are
not yet distinct.

## Make push and replacement deliberate

Opening another issue normally creates a history stop. Updating a tab in the same visit may replace
that stop. This complete memory-history journey expresses that behavior directly:

```ts
import { Effect } from "effect"
import { Navigation } from "@typed/navigation"
import { TestRouter } from "@typed/router/RouterTest"

const visitIssue = Effect.gen(function* () {
  yield* Navigation.navigate("/issues/42", { history: "push" })
  // Changing tabs should not add another Back stop inside this issue visit.
  yield* Navigation.navigate("/issues/42?tab=activity", { history: "replace" })
  const detail = yield* Navigation.currentEntry
  yield* Navigation.back()
  const returned = yield* Navigation.currentEntry
  return {
    detail: detail.url.pathname + detail.url.search,
    returned: returned.url.pathname + returned.url.search,
  }
}).pipe(Effect.provide(TestRouter({ url: "https://test.local/issues?status=open" })))

const result = await Effect.runPromise(visitIssue)
// detail: "/issues/42?tab=activity"; returned: "/issues?status=open"
```

The same commands run with BrowserRouter in a browser. Its provider integrates with the platform's
History API and `popstate`; memory providers make the application contract testable without DOM
clicks. The platform distinguishes pushing/replacing entries and traversal in its
[History API guide](https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API).

`history: "auto"` is the low-level navigate default: a same-origin destination with the same pathname
replaces the current entry, including query/hash changes. Link uses push by default instead. Choose
explicit push or replace when the interaction depends on it. Search-as-you-type often replaces;
submitting a meaningful saved filter may intentionally push despite having the same pathname.

## Keep destinations as real links when users expect link behavior

An ordinary issue link should retain an href, modified clicks, and browser context-menu behavior.
Use Link instead of making a clickable span that only calls a command.

```ts
import { Link } from "@typed/ui/Link"
import { html } from "@typed/template"

const issueLink = Link({ href: "/issues/42", content: "Review issue 42" })
const activityLink = Link({ href: "/issues/42?tab=activity", replace: true, content: "Activity" })
const actions = html`<nav aria-label="Issue navigation">${issueLink} ${activityLink}</nav>`
```

Link intercepts eligible same-origin primary clicks. Modified clicks, external HTTP destinations,
downloads, and non-self targets retain native behavior. The href remains present in server HTML.
For commands such as “open next unreviewed issue” or “navigate after successful save,” call
Navigation.navigate from the Effect workflow. Build parameterized hrefs with the
[Route encoding contract](/explore/route-typed-url-inputs).

## Put shareable input in the URL and visit metadata in entry state

Navigation.navigate returns the committed Destination with its URL, stable entry key, unique commit
ID, and stored state. `state` belongs to the history entry; `info` is metadata for that transition's
before/after handlers.

```ts
import { Effect } from "effect"
import { Navigation } from "@typed/navigation"

const openFromQueue = Effect.fn("openFromQueue")(function* (issueId: string) {
  const destination = yield* Navigation.navigate(`/issues/${encodeURIComponent(issueId)}`, {
    history: "push",
    state: { returnTo: "/issues?status=open" },
    info: { source: "queue-keyboard" },
  })
  return destination.url.pathname
})
```

A return position or draft ID can fit entry state. A filter that must survive copying the URL
belongs in path/query instead. Entry state is unknown at the service boundary; decode it before
using application fields. TypeScript inference in the writing command does not validate state
restored or supplied elsewhere.

`updateCurrentEntry({ state })` replaces state without changing the current slot's URL. `entries`
exposes retained entries; `canGoBack` and `canGoForward` are derived views. Back/forward at a retained
edge return the current destination without backend work. `traverseTo(key)` selects a retained
entry, while a push after going back discards its forward branch. `reload` is a separate command;
a browser reload can end the JavaScript lifetime rather than merely refresh one resource.

## Observe pending intent separately from the committed location

`currentEntry` is committed history. `transition` is a Filtered view of a proposed in-progress
transition. `CurrentPath` is pathname plus search, the source Matcher uses; it omits hash and origin.

```ts
import { RefSubject } from "@typed/fx"
import { CurrentPath, Navigation } from "@typed/navigation"

const pathname = RefSubject.map(Navigation.currentEntry, (entry) => entry.url.pathname)
const matchedPath = CurrentPath
// Keep absence visible so pending UI can clear after commit or cancellation.
const pending = Navigation.transition.asComputed()
const canGoBack = Navigation.canGoBack
```

Using `asComputed()` keeps Option absence visible so pending UI can disappear when the transition
settles. Observing only a Filtered's present values skips the disappearance. Do not optimistically
label the current page as the proposed destination before it commits; a blocker may still cancel
or redirect it.

A successful navigate command says the destination committed. It does not say every page request,
image, or DOM update completed. Matcher owns selection; the resource owns data readiness; an element
reference owns availability for focus/scroll work. Keep those completion conditions separate.

## Let an editor block a transition within its own Scope

An editor should block while its draft is dirty and stop blocking when the editor disappears.
`useBlockNavigation` registers scoped before-navigation behavior and exposes a Filtered Blocking
value with `confirm`, `cancel`, and `redirect` Effects. The application chooses how to present that
decision; observing the blocker does not settle it.

```ts
import { Option } from "effect"
import { Fx, RefSubject } from "@typed/fx"
import { useBlockNavigation } from "@typed/navigation/Blocking"
import { html } from "@typed/template"
import { component } from "@typed/ui/Component"

const DraftEditor = component(function* () {
  const dirty = yield* RefSubject.make(false)
  // Register with the editor's Scope so the blocker cannot outlive the draft editor.
  const blocker = yield* useBlockNavigation({ shouldBlock: () => dirty })
  const confirmation = Fx.switchMap(blocker.asComputed(), Option.match({
    // Emit empty output to remove the previous confirmation when the decision settles.
    onNone: () => Fx.null,
    onSome: (decision) => html`<section aria-label="Unsaved changes">
      <p>Leave this draft without saving?</p>
      <button onclick=${decision.confirm}>Leave draft</button>
      <button onclick=${decision.cancel}>Keep editing</button>
    </section>`,
  }))
  return html`<section aria-label="Draft editor">
    <label>Comment<textarea oninput=${RefSubject.set(dirty, true)}></textarea></label>
    ${confirmation}
  </section>`
})
```

The component needs a generator because it allocates state and registers the blocker. The draft
persistence/save operation is intentionally separate: a real successful save sets dirty false after
the server accepts the draft. A confirmation interaction may instead use a properly managed dialog,
but the navigation decision contract remains the same.

`Fx.switchMap` runs the selected template's producer. `Fx.null` emits empty output when the blocker
clears, removing the confirmation from its existing position.

Closing the owner unregisters the blocker and cancels unsettled work. The blocker coordinates
transitions that pass through Navigation; it is not durable draft storage or a guarantee against tab
closure, process exit, and external navigation. Persist recoverable drafts according to their actual
lifetime. Settling a Blocking value releases its pending decision; await the original navigate
Effect when you need to know the final destination has committed.

## Verify confirmation without clicking a modal

```ts
import { Effect, Fiber } from "effect"
import { Fx, RefSubject } from "@typed/fx"
import { Navigation } from "@typed/navigation"
import { useBlockNavigation } from "@typed/navigation/Blocking"
import { TestRouter } from "@typed/router/RouterTest"

const confirmJourney = Effect.scoped(Effect.gen(function* () {
  const dirty = yield* RefSubject.make(true)
  const blocker = yield* useBlockNavigation({ shouldBlock: () => dirty })
  const initiallyBlocking = yield* blocker.isBlocking
  // Navigation cannot finish until this test settles the blocker, so run it concurrently.
  const navigation = yield* Effect.forkScoped(Navigation.navigate("/issues", { history: "push" }))
  // A Filtered emits when a decision exists; await that value without polling.
  const decision = yield* Fx.first(blocker).pipe(Effect.flatMap(Effect.fromOption))
  const before = yield* Navigation.currentEntry
  yield* decision.confirm
  // Confirming releases the decision; joining observes the actual destination commit.
  const after = yield* Fiber.join(navigation)
  return { initiallyBlocking, before: before.url.pathname, after: after.url.pathname }
})).pipe(Effect.provide(TestRouter({ url: "https://test.local/issues/42" })))

const result = await Effect.runPromise(confirmJourney)
// initiallyBlocking: false; before: "/issues/42"; after: "/issues"
```

Repeat this test for cancel, redirect, and owner teardown. Observe that currentEntry remains the old
page while blocked and that pending state clears afterward. A test timeout catches a decision that
never settles. Those tests exercise the navigation protocol; separate browser tests should verify
Link interception, native modified clicks, and the confirmation UI's focus behavior.

## Register pre-commit policy and post-commit observation

Before handlers can continue, fail with CancelNavigation, or redirect with RedirectError. After
handlers see a committed destination and cannot undo that commit. Both registrations are scoped.
The Option result selects whether the handler contributes follow-up work for the event.

```ts
import { Effect, Option } from "effect"
import { Navigation, RedirectError } from "@typed/navigation"

const legacyAccount = Navigation.onBeforeNavigation((event) =>
  event.to.url.pathname === "/account"
    ? Effect.fail(new RedirectError({ url: "/settings" }))
    : Effect.succeed(Option.none()),
)
const reportVisit = Navigation.onNavigation((event) =>
  Effect.succeed(Option.some(Effect.log(`visited ${event.destination.url.pathname}`))),
)
```

The redirect avoids committing the legacy destination. The log is about committed location, not
“page fully ready.” Keep a page-loader error in page/resource recovery instead of reporting that
history failed after the URL already committed.

## Provide one history at the runtime edge

BrowserRouter, ServerRouter, and TestRouter provide the common Router/Navigation contract. A
standalone workflow can instead install Navigation directly, supplying its UUIDv7 dependency:

```ts
import { Effect, Layer } from "effect"
import { Uuid7State } from "@typed/id/Uuid7"
import { Navigation } from "@typed/navigation/Navigation"
import { initialMemory } from "@typed/navigation/memory"

const History = initialMemory({ url: "https://test.local/issues" }).pipe(
  Layer.provide(Uuid7State.Default),
)
const open = Navigation.navigate("/issues/42").pipe(Effect.provide(History))
```

The browser equivalent is `fromWindow(window)` with the same UUID dependency; router layers already
compose it. Create the provider around the feature/application or server request, not once per page.
Nested route structure belongs to [CurrentRoute and Matcher](/explore/router-navigation-live-selection).
Use the [Navigation reference](/reference/modules/%40typed%2Fnavigation%2FNavigation) and
[Blocking reference](/reference/modules/%40typed%2Fnavigation%2FBlocking) for exact command and event types.
