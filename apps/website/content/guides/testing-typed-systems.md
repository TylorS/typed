---
title: "Testing Typed systems"
summary: "Turn state, request ordering, DOM identity, and cleanup promises into tests that can actually disprove them."
section: "Applications"
kind: "guide"
order: 9
---

An account picker can display the right HTML and still be wrong. Selecting the same account twice
might double its count; an obsolete search might overwrite newer results; sorting might lose focus;
closing the panel might leave a listener active. These failures belong to different boundaries, so
they need different observations.

This guide builds a test strategy around those promises. Follow the
[application path](/explore/application-developers) for feature development or the
[library path](/explore/library-developers) for the public contracts behind a reusable picker.
Use the repository’s `@effect/vitest` harness for Effect tests: `it.effect` supplies a test Scope,
so scoped state and services can be acquired without a manual `Effect.runPromise` wrapper.

## Establish the state invariant without a view

The picker allows a set of selected IDs. Selecting an already selected ID should not increase the
count. That rule does not concern HTML, so exercise the state and its derived value directly:

```ts
import { Effect } from "effect"
import { expect, it } from "@effect/vitest"
import { RefSubject } from "@typed/fx"

it.effect("preserves a state invariant", Effect.fn("preservesStateInvariant")(function* () {
    const selected = yield* RefSubject.make<ReadonlySet<string>>(new Set<string>())
    const count = RefSubject.map(selected, (ids) => ids.size)

    yield* RefSubject.update(selected, (ids) => new Set([...ids, "invoice-42"]))
    yield* RefSubject.update(selected, (ids) => new Set([...ids, "invoice-42"]))

    expect([...(yield* selected)]).toEqual(["invoice-42"])
    expect(yield* count).toBe(1)
  }))
```

This test can fail if the update creates duplicate logical selections or if the derived count stops
reflecting the source. It does not prove that the button is wired correctly; that is a later browser
assertion. Keeping this distinction lets a failing count tell you where to investigate.

A current read and a pushed observation also prove different things. If the contract promises a
particular sequence of emissions, observe the source before updating it. Wait for a known subscriber
count or a Deferred signaled by observation. A fixed sleep merely assumes the subscription has started.
For derived and transactional behavior, see [state composition](/explore/composing-refsubject-state)
and [transactions](/explore/state-transactions-and-bidirectional-views).

## Control the order that asynchronous work completes

A search race requires an adversarial completion order. Start query A, then query B, resolve B, and
only then attempt to resolve A. Assert that the displayed or collected result remains B if newer
queries replace older work. A test where A always finishes first would also pass an implementation
that merges both results incorrectly.

Provide a test repository whose requests wait on Deferred values owned by the test. Signal a second
Deferred when each request starts, so the test knows which work has actually been acquired. This makes
request start and completion explicit rather than depending on elapsed wall-clock time. If the
contract includes cancellation, observe the replaced request’s finalizer as well as the final value.
[Concurrency policies](/explore/fx-higher-order-and-concurrency) explains the behavior you are selecting.

Choose the consumer to match the source’s lifetime. `Fx.collectAll` is useful for a finite sequence;
it cannot return while a live input source remains open. Use `Fx.collectUpTo` for a bounded result,
or keep `Fx.observe` running in a scoped fiber when the test needs to issue later commands.
For debounce and other time policies, advance the Effect test clock. Browser layout and native input
remain browser concerns; the Effect clock is not a substitute for their harness.

## Make cancellation observable at the input boundary

A callback adapter can deliver the right value and still leak its listener or timer. Count active
acquisitions, wait for the first observed value, then interrupt the subscription:

```ts
import { Deferred, Effect, Fiber } from "effect"
import { expect, it } from "@effect/vitest"
import * as Fx from "@typed/fx/Fx"

it.effect("cleans up a live callback source", Effect.fn("cleansUpCallback")(function* () {
    let active = 0
    const ready = yield* Deferred.make<void>()
    const source = Fx.callback<number>((emit) => {
      active++
      void emit.succeed(1)
      return Effect.sync(() => active--)
    })

    const fiber = yield* source.pipe(
      Fx.observe(() => Deferred.succeed(ready, undefined)),
      Effect.forkScoped,
    )
    yield* Deferred.await(ready)
    expect(active).toBe(1)
    yield* Fiber.interrupt(fiber)
    expect(active).toBe(0)
  }))
```

The ready signal prevents the interruption from racing ahead of setup. The first assertion proves
that the resource was acquired; the final assertion proves that interruption released it. A test
that times out after receiving a value proves neither release nor ownership.

Use the same arrangement for a socket or foreign renderer, with its real unsubscribe or destroy
operation in place of the counter. When the expected outcome is failure, use `Effect.exit` and assert
the typed failure or Cause rather than relying on an untyped rejected Promise. Keep interruption and
expected failure separate: cancelling an obsolete query is not the same event as a repository error.

## Test retained rows as objects, not strings

The picker’s results can reorder. Its retained IDs should keep their rendered rows while each live
item updates the content. Rendering the same final text into new elements would hide an identity
regression, so retain an element reference:

```ts
import { Deferred, Effect, Fiber } from "effect"
import { expect, it } from "@effect/vitest"
import { Fx, RefSubject } from "@typed/fx"
import { DomRenderTemplate, html, many, render } from "@typed/template"
import { vi } from "vitest"

const keepsKeyedIdentity = Effect.fn("keepsKeyedIdentity")(function* () {
  const initial = [
    { id: "a", label: "A" },
    { id: "b", label: "B" },
  ] as const
  const items = yield* RefSubject.make<ReadonlyArray<(typeof initial)[number]>>(initial)
  const view = html`<ul>${many(
    items,
    (item) => item.id,
    (item) => html`<li>${RefSubject.map(item, (value) => value.label)}</li>`,
  )}</ul>`
  const host = yield* Effect.acquireRelease(
    Effect.sync(() => {
      const host = document.createElement("div");
      document.body.append(host);
      return host;
    }),
    (host) => Effect.sync(() => host.remove()),
  );
  const ready = yield* Deferred.make<void>()
  const renderer = yield* render(view, host).pipe(
    Fx.provide(DomRenderTemplate.using(document)),
    Fx.observe(() => Deferred.succeed(ready, undefined)),
    Effect.scoped,
    Effect.forkScoped,
  )
  yield* Deferred.await(ready)
  yield* Effect.promise(() => vi.waitFor(() => {
    expect(Array.from(host.querySelectorAll("li"), row => row.textContent)).toEqual(["A", "B"])
  }))
  const original = host.querySelectorAll("li")[1]

  yield* RefSubject.set(items, [initial[1], initial[0]])
  yield* Effect.promise(() => vi.waitFor(() => {
    expect(host.querySelectorAll("li")[0]?.textContent).toBe("B")
    expect(host.querySelectorAll("li")[0]).toBe(original)
  }))
  yield* Fiber.interrupt(renderer)
})

it.effect("keeps keyed DOM identity across a reorder", keepsKeyedIdentity)
```

The dedicated host prevents the test from replacing unrelated document content. Its finalizer removes
the fixture after the test. The reorder assertion checks both the expected row and the exact node
object, so simply rebuilding the list cannot satisfy it.

The ready signal observes the first render without ending the subscription. Dynamic rows can arrive
after the surrounding template, so the initial row assertion also waits for their actual content.
The renderer runs in its own Scope, forked into the test lifetime, so rows and listeners stay active during assertions.
Interrupting its fiber closes that render Scope; the test Scope also interrupts it if an assertion
fails. To test teardown, assert that acquired finalizers run and subsequent input no longer invokes
released handlers. `take(1)` ends the subscription and closes a component's child Scope; use it only
when checking a snapshot that needs no later interaction. Removing the host alone cannot prove cleanup.
[Cooperative ownership](/explore/cooperative-by-design) explains why placement and disposal are separate.

Run this identity test with a browser Document. DOM emulators can cover text, attributes, and many
listener contracts, but focus, selection, dialog behavior, and state-preserving moves need real browser
checks. For an editable row, add assertions for the current input value and selection after sorting.
Stable JavaScript identity and preservation of browser-managed state are separate claims.

A component’s accessibility contract also needs actions. For a dialog, test its name, the opening
action, focus destination, Escape behavior, and focus return. A role attribute cannot establish that
sequence. The [ARIA Authoring Practices introduction](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)
explains the interaction responsibilities attached to custom semantics. Use [the UI guides](/explore/ui)
to identify the primitive’s behavior and test your wrapper’s labels, state policy, and prop forwarding.

## Replace history with a provider when testing route selection

Opening an account from a URL adds another boundary: URL decoding and selected output. Those tests
should not depend on the browser’s global history. `TestRouter` provides memory navigation for the
same matcher contract:

```ts
import * as Router from "@typed/router"
import { Effect } from "effect"
import { expect, layer } from "@effect/vitest"
import { Fx } from "@typed/fx"
import { Navigation } from "@typed/navigation"
import { TestRouter } from "@typed/router/RouterTest"

layer(TestRouter({ url: "http://localhost/users/1" }))("memory routing", (it) => {
  it.effect("matches a route and navigates in memory", Effect.fn("matchesMemoryRoute")(function* () {
      const route = Router.Join(Router.Parse("users"), Router.Param("id"));
      const matcher = Router.match(route, (params) => Fx.map(params, ({ id }) => `user:${id}`));

      expect(yield* Fx.collectAll(Fx.take(matcher, 1))).toEqual(["user:1"]);
      yield* Navigation.navigate("http://localhost/users/2");
      const currentEntry = yield* Navigation.currentEntry;
      expect(currentEntry.url.pathname).toBe("/users/2");
    }))
})
```

This example checks initial selection and the navigation result. It does not prove that a continuously
observed matcher emitted the second page: that requires an active observation and a ready signal across
the navigation. Keep a separate small browser suite for back/forward behavior and platform history.

`layer` intentionally shares its acquisition across the suite. If tests mutate history and need the
same starting state independently, provide a fresh `TestRouter` inside each test instead. Shared
service lifetime is part of the fixture design, not a harmless test-speed setting.

Import test services through `@typed/router/RouterTest` and `@typed/id/IdsTest`. `IdsTest` gives each
acquired provider its own deterministic sequence; two successive ID calls should still produce
distinct IDs. These providers belong in test imports rather than production Router or ID entry points.

## Test server output and browser adoption as two stages

SSR proves that a useful document and hydration metadata were serialized. Hydration proves that the
client adopts that document and reconnects its behavior. Rendering a fresh client tree that happens
to look the same is not a hydration test.

```ts
import { Effect, Schema } from "effect"
import { expect, it } from "@effect/vitest"
import { RefSubject } from "@typed/fx"
import { HtmlRenderTemplate, html, renderToHtmlString } from "@typed/template"

it.effect("serializes state for hydration", Effect.fn("serializesHydrationState")(function* () {
    const count = yield* RefSubject.hydrate(Schema.Finite, 7)
    const output = yield* renderToHtmlString(html`<button ref=${count}>${count}</button>`).pipe(
      Effect.provide(HtmlRenderTemplate),
    )
    expect(output).toContain("data-typed-refsubject=")
    expect(output).toContain("7")
  }))
```

The hydration attribute checks that this server path includes state metadata; finding `7` alone only
checks visible output. Exact comment-marker assertions belong in renderer protocol tests, where a
marker change is the behavior under test. An application should usually assert its meaningful output
without encoding the renderer’s internal part indexes.

For the browser half, retain the original server-rendered button, hydrate the same template, and
assert that the original node was adopted, the value `7` was restored, the hydration attribute was
consumed, and a later `RefSubject.set` updates the button. Test static HTML separately:
`StaticHtmlRenderTemplate` intentionally omits interactive hydration metadata. The
[Quick Start](/explore/quick-start) gives the server-to-client progression these tests follow.

## Make the type-level promises executable too

A reusable wrapper can keep passing runtime tests while accidentally erasing an expected failure
or a service requirement. Protect those contracts with exact type assertions and intentional
negative assignments:

```ts
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import type * as Fx from "@typed/fx/Fx";
import { html, type RenderTemplate } from "@typed/template";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
class Service extends Context.Service<Service, { readonly value: string }>()("docs/Service") {}
const value = Effect.gen(function* () {
  yield* Service;
  return yield* Effect.fail("failed" as const);
});
const view = html`<p>${value}</p>`;
type _Errors = Assert<Equal<Fx.Error<typeof view>, "failed">>;
type _Services = Assert<Equal<Fx.Services<typeof view>, Service | Scope.Scope | RenderTemplate>>;
// @ts-expect-error nested failures must remain visible
const _erased: Fx.Fx<unknown, never, Fx.Services<typeof view>> = view;
```

An unused `@ts-expect-error` fails the check, so erasing the error channel cannot silently turn this
into a passing assignment. Apply the same method to key restrictions, hydration codecs, and required
services in a public wrapper. Runtime tests then prove the complementary behaviors: selection
transitions, request replacement, retained DOM identity, and finalization.

When adding a test, ask which plausible broken implementation would pass it. If replacing every row
still passes, add identity. If every request finishes in order, reverse completion. If cleanup was
never observed, close its actual Scope. That keeps the suite tied to user-visible and public-library
promises instead of mirroring the implementation.
