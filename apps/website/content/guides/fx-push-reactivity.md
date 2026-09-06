---
title: "Fx: work arrives"
summary: "Build and run producer-driven work with Effect values, errors, services, and cleanup."
section: "Fx"
kind: "concept"
order: 1
---

A search screen receives keystrokes, waits for a usable query, starts a request, and displays a
result. The difficult questions are about work: what starts it, what happens to an old request,
and what stops the input listener when the screen closes? `Fx` makes those decisions composable.

An `Fx<A, E, R>` describes a producer that can emit zero, one, or many `A` values, report expected
failures of type `E`, and require services `R`. It is lazy: constructing an Fx starts no subscription.
A runner such as [`Fx.observe`](/reference/symbols/QHR5cGVkL2Z4L0Z4I29ic2VydmU) returns the Effect
that executes it. The owner of that execution also owns interruption and cleanup.

## Separate events, state, and work

A keystroke is an event. The current query is state. A network request is work. Its result is an
event that can update state. An Fx describes the events and work; it does not automatically remember
a current value for somebody who subscribes later. Use a RefSubject when current readable state is
the capability you need, and a Subject when independently owned code publishes events.

Start with a finite command source so both output and completion are easy to inspect:

```ts
import { Effect } from "effect"
import { Fx } from "@typed/fx"

const shortcuts = Fx.fromIterable(["open-search", "", "open-settings"]).pipe(
  Fx.filter((command) => command.length > 0),
  Fx.map((command) => ({ type: "shortcut", command }) as const),
)

const program: Effect.Effect<ReadonlyArray<{ readonly type: "shortcut"; readonly command: string }>> =
  Fx.collectAll(shortcuts)

const values = await Effect.runPromise(program)
// [{ type: "shortcut", command: "open-search" }, { type: "shortcut", command: "open-settings" }]
```

Running `program` obtains the iterator, offers `open-search`, drops the blank command, then offers
`open-settings`. The collector retains both outputs until the iterable completes. Before the
runner starts, there are no collected values; the pipeline is a description, not an eagerly mapped
array. With an open keyboard listener, the same collector would keep waiting for completion.

A transform wraps delivery: `map` changes each value before forwarding it to the downstream Sink.
It need not allocate an intermediate collection. A higher-order operator such as `switchMap` also
owns child subscriptions. That is where replacing a request becomes part of the program rather than
an ad hoc callback check.

## Let a request keep its typed contract

`Fx.fromEffect` turns one Effect success into one emission. It retains expected errors and required
services, so the screen cannot accidentally hide its dependency on a search implementation:

```ts
import { Context, Data, Effect, Layer } from "effect"
import { Fx } from "@typed/fx"

class SearchUnavailable extends Data.TaggedError("SearchUnavailable")<{
  readonly query: string
}> {}

class WorkspaceSearch extends Context.Service<WorkspaceSearch, {
  readonly first: (query: string) => Effect.Effect<string, SearchUnavailable>
}>()("example/WorkspaceSearch") {}

const firstResult = Fx.fromEffect(
  Effect.gen(function* () {
    const search = yield* WorkspaceSearch
    return yield* search.first("effect")
  }),
)

const reported: Effect.Effect<unknown, SearchUnavailable, WorkspaceSearch> = Fx.observe(
  firstResult,
  (result) => Effect.log(`first result: ${result}`),
)

const WorkspaceSearchLive = Layer.succeed(WorkspaceSearch, {
  first: () => Effect.succeed("Effect documentation"),
})

const program = reported.pipe(Effect.provide(WorkspaceSearchLive))
```

`reported` still requires `WorkspaceSearch` and can fail with `SearchUnavailable`. Providing the
Layer chooses an implementation; it does not erase the failure. At the request boundary, decide
whether unavailability becomes a displayed value, a cached fallback, or a failure returned to the
owner. [Errors and recovery](/explore/fx-errors-and-recovery) shows why placing that recovery inside
one request can keep the input listener alive.

## Make one subscription own one listener

For a foreign callback API, registration and removal are one lifetime. This small executable test
makes the stop condition observable without relying on a particular browser event:

```ts
import { Effect } from "effect"
import { expect, it } from "vitest"
import { Fx } from "@typed/fx"

it("cleans up a callback subscription", async () => {
  let removals = 0

  const source = Fx.callback<string>((emit) => {
    queueMicrotask(() => {
      emit.succeed("ready")
    })

    return Effect.sync(() => {
      removals += 1
    })
  })

  await Effect.runPromise(Fx.collectAll(source.pipe(Fx.take(1))))
  expect(removals).toBe(1)
})
```

The observation starts registration. The microtask emits `ready`. `take(1)` ends the useful run and
the returned cleanup Effect runs once. `emit.succeed` starts delivery immediately and returns its
Fiber; it is not a Promise that the foreign API awaits. An adapter still needs an ordering policy
if its callbacks can overlap.

Observing an ordinary Fx twice runs registration twice. Assigning a source to a constant does not
share it. [Subject sharing](/explore/subject-event-publications) is the explicit choice when two
consumers should use one active connection.

## Follow the search feature through the curriculum

| Feature decision | Lesson |
| --- | --- |
| Adapt a request, clock, iterable, or browser callback | [Building Fx](/explore/building-fx) |
| Read configuration before selecting a scoped feed | [Dynamic producers](/explore/fx-dynamic-producers) |
| Normalize the query and reject unusable input | [Transforming Fx](/explore/transforming-fx) |
| Detect changes or accumulate progress | [Stateful transforms](/explore/fx-stateful-transforms) |
| Replace stale requests or serialize writes | [Higher-order work](/explore/fx-higher-order-and-concurrency) |
| Combine query, filter, and submit signals | [Composing Fx](/explore/composing-fx) |
| End at a count, sentinel, or logout signal | [Selection and cardinality](/explore/fx-selection-and-cardinality) |
| Wait for typing to settle and test the clock | [Time and rate](/explore/fx-time-and-rate) |
| Recover a request while keeping later input alive | [Errors and recovery](/explore/fx-errors-and-recovery) |
| Close feature resources or share application services | [Services and lifetime](/explore/fx-services-and-lifetime) |
| React to updates or await one result | [Consuming Fx](/explore/consuming-fx) |

The [API reference](/reference/modules/%40typed%2Ffx) provides complete signatures. The lessons
explain which contract your feature needs before you choose its overload.

Open **Read this diagram** beneath a timeline to match its visual markers to their meanings.
Value pills show emissions, raised chevrons start runs, vertical bars mark returns, exclamation
marks report causes, and crosses mark interruption. Empty stretches contain no event. Read
vertically to find the input that caused an output or cancellation. Columns are logical moments unless the caption gives a duration. Inner lanes
represent separate runs; their lifetime matters as much as their values.
