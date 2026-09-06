---
title: "Share a reactive capability through Context"
summary: "Give independently built routes, commands, and views one selection model without exposing unnecessary write authority."
section: "State"
kind: "guide"
order: 2.35
---

A review queue's toolbar can receive its selection model as a parameter. A keyboard command built
in another module may need to request that same model. Effect Context supplies this dependency
without making the model a module-global singleton. The service declares what the consumer needs;
a Layer supplies one implementation in the lifetime where those consumers run.

Start with [renderer-independent state](/explore/refsubject-renderer-independent-state). The choice
here is not whether state is “global.” It is which capability crosses a construction boundary and
which owner provides it. Two independently provided implementations of the same service can
legitimately represent two workspaces or two tests.

## Choose the public capability before its facade

| Consumer needs | Contract | Example |
| --- | --- | --- |
| Observe values | `Fx.Service` | Read a transport's incoming events |
| Submit values | `Sink.Service` | Send audit records to an owner |
| Publish and observe events | `Subject.Service` | Shared notification bus without current state |
| Read, observe, and replace state | `RefSubject.Service` | Internal feature model trusted by its consumers |
| Read state and invoke constrained commands | Custom Context service | Selection with a uniqueness invariant |

RefSubject.Service is convenient, but importing it grants arbitrary writes. If every caller must
preserve uniqueness, expose the selected IDs and a `select` operation instead of the internal ref.

```ts
import { Context, Effect, Layer } from "effect"
import { RefSubject } from "@typed/fx"

class Selection extends Context.Service<Selection, {
  readonly selected: RefSubject.Computed<ReadonlyArray<string>>
  readonly select: (id: string) => Effect.Effect<ReadonlyArray<string>>
  readonly clear: Effect.Effect<ReadonlyArray<string>>
}>()("docs/Selection") {}

const SelectionLive = Layer.effect(Selection, Effect.gen(function* () {
  const state = yield* RefSubject.make<ReadonlyArray<string>>([])
  return {
    selected: RefSubject.map(state, (ids) => ids),
    select: (id: string) => RefSubject.update(state, (ids) =>
      ids.includes(id) ? ids : [...ids, id],
    ),
    clear: RefSubject.set(state, []),
  }
}))
```

The Layer owns the ref it constructs. Callers cannot accidentally bypass `select` with a generic
`set`, because the service does not expose that operation. This is a TypeScript capability boundary,
not a security boundary against arbitrary code executing in the same process.

## Keep the dependency in the consumer's type

A library can define a service-backed query without choosing where the model is built.
`computedFromService` returns a Computed that retrieves the actual view when read or observed.

```ts
import { Context, Effect } from "effect"
import { RefSubject } from "@typed/fx"

class Selection extends Context.Service<Selection, {
  readonly selected: RefSubject.Computed<ReadonlyArray<string>>
}>()("docs/SelectionView") {}

const selectedCount = RefSubject.computedFromService(
  Effect.map(Selection, ({ selected }) => RefSubject.map(selected, (ids) => ids.length)),
)
```

`selectedCount` requires Selection. Passing the Computed into a component keeps that dependency
visible until the component runs; passing its current number intentionally takes a snapshot.
`filteredFromService` does the same for a Filtered view, retaining its meaningful absence behavior.
Both retain the source's errors and services in addition to the service being retrieved.

Provide the Layer around the routes, commands, and views that should share one selection. Installing
new Layers independently around each consumer can create independent state. If a command succeeds
but a view does not change, compare their provider boundaries and actual ref identities before
adding subscriptions that copy state between them.

## Use a RefSubject facade when full writes are the contract

Some subsystems intentionally share a whole mutable state value. `RefSubject.Service<Self, A, E>()`
creates a Context-backed facade with current reads, Fx observation, and serialized writes.

```ts
import { Effect } from "effect"
import { RefSubject } from "@typed/fx"

class QueueSettings extends RefSubject.Service<QueueSettings, {
  readonly density: "compact" | "comfortable"
}>()("docs/QueueSettings") {}

const QueueSettingsLive = QueueSettings.make({ density: "comfortable" })
const compact = RefSubject.update(QueueSettings, () => ({ density: "compact" as const }))
const inspect = Effect.gen(function* () {
  yield* compact
  return yield* QueueSettings
}).pipe(Effect.provide(QueueSettingsLive), Effect.scoped)
```

The class is a dependency key and facade, not a singleton allocation. `make(initial)` creates a
Layer that builds the ref; `layer(effectThatBuildsARef)` accepts a custom construction operation.
Layer acquisition errors differ from later ref read errors. A successful Layer build does not
prove a lazy initializer will succeed when the state is first read.

A test can provide a new QueueSettings Layer with a different initial value. It does not need to
patch a global or render the settings control. Use one provision around the whole test journey so
commands and reads observe the same state.

## Events and write-only boundaries have smaller facades

```ts
import { Effect } from "effect"
import { Fx, Sink, Subject } from "@typed/fx"

class QueueEvents extends Fx.Service<QueueEvents, string>()("docs/QueueEvents") {}
class Audit extends Sink.Service<Audit, string>()("docs/Audit") {}
class Notifications extends Subject.Service<Notifications, string>()("docs/Notifications") {}

const QueueEventsLive = QueueEvents.make(Fx.fromIterable(["connected", "ready"]))
const AuditLive = Audit.make(Effect.logError, Effect.log)
const NotificationsLive = Notifications.make(1)
```

An Audit consumer cannot subscribe just because another subsystem can. A QueueEvents consumer
cannot publish. Notifications adds both capabilities but has no current-state read; its replay
choice is an event-retention policy. Use the [Subject guide](/explore/subject-event-publications)
when repeated occurrences matter and RefSubject when the newest state matters.

Keep the smallest contract that lets the consumer do its work. Do not add Context merely to avoid
passing one local ref to a directly constructed child. Services are useful for independent
construction, replaceable infrastructure, and shared ownership. Their lifetime still comes from
the providing Layer and Scope, as described by Effect's
[services](https://www.effect.website/docs/v4/requirements-management/services/) and
[Layers](https://www.effect.website/docs/v4/requirements-management/layers/) guides.
