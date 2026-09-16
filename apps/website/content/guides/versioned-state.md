---
title: "Working with Versioned state"
summary: "Keep a current read, update stream, and invalidation token together when a value comes from an independently owned source."
section: "State"
kind: "guide"
order: 2.22
---

Use `Versioned` when another store already owns the data and consumers need a current read,
an update stream, and an invalidation token. This guide adapts one small settings store and tests
its snapshot and subscription behavior. The store remains responsible for keeping these channels
consistent:

- `version`: an Effect that reads a numeric invalidation token;
- the `Fx` itself: updates that observers receive over time;
- the Effect itself: the current value when a consumer reads it.

This is an advanced adapter after [state composition](/explore/composing-refsubject-state) and
[Fx observation](/explore/consuming-fx). Use
[RefSubject](/explore/refsubject-renderer-independent-state) when the application itself owns
writable state.

## Construct the three channels deliberately

`Versioned.make(version, updates, current)` keeps the channels together but does not synchronize
them for you. The version is whatever the supplied Effect returns: `Versioned` does not increment
it, require it to be monotonic, or prove that it and a current read are one atomic snapshot. Its
producer defines what a changed token invalidates and coordinates current values with publications.

Here is a small external settings store with synchronous writes. Its adapter supplies an initial
snapshot on every subscription and unregisters only that subscription on teardown.

```ts file="Settings.ts"
import { Effect } from "effect"
import * as Fx from "@typed/fx/Fx"
import * as Versioned from "@typed/fx/Versioned"

type Settings = { readonly density: "compact" | "comfortable" }

export const makeSettingsStore = (initial: Settings) => {
  let current = initial
  let revision = 0
  const listeners = new Set<(value: Settings) => void>()

  const state = Versioned.make(
    Effect.sync(() => revision),
    Fx.callback<Settings>((emit) => {
      const publish = (value: Settings) => { emit.succeed(value) }

      listeners.add(publish)
      publish(current)

      return Effect.sync(() => { listeners.delete(publish) })
    }),
    Effect.sync(() => current),
  )

  const set = (next: Settings) => {
    current = next
    revision += 1

    for (const publish of listeners) publish(current)
  }

  return { state, set }
}
```

`set` belongs to the external owner. Give consumers `store.state`; they can read and observe
settings without receiving `set`. Registration and the first snapshot happen synchronously in
one callback here. An asynchronous transport needs its own snapshot/subscription handoff protocol.
Callback emissions run sink effects in fibers; this adapter is intended for observing settings,
not an ordered command log whose consumers must finish processing every write before the next.

The update and current channels may intentionally have different types. A change feed could emit
events while its current Effect returns a full snapshot. Each channel keeps its own error and
service requirements. `Versioned.of(value)` is the constant constructor: it supplies version `1`,
one update, and that same current value for composition and focused tests.

## Read now, observe later, and let the producer own writes

A `Versioned` value does not define a write operation. The producer that owns its backing data
must decide how a write updates the current-value Effect, emits an Fx update, and changes the
version token. That boundary is useful: consumers can receive the state capability without gaining
permission to mutate the source.

Run a current read like any other Effect. To observe a long-lived update channel, run an Fx
operation such as `Fx.observe` in the consumer's Scope. `Fx.collectAll` is appropriate only for a
finite source: the settings adapter above stays open, so use `Fx.first` for one update or observe it
within a Scope for ongoing changes. Reading the current value shares in-flight work among
concurrent readers; `interrupt` stops that shared current-read work, but does not complete or take
ownership of the independently supplied update channel.

For practical cache work, treat `version` as an invalidation key attached to a read, then recheck
before committing a result when updates may race the work. Do not infer a transaction from two
separate Effects just because they are exposed by one `Versioned` value.

## Check the snapshot and subscription handoff

A producer that publishes between “read current” and “subscribe” can lose an update unless its
subscription replays current state or its version protocol detects the race. The settings adapter
registers its listener and publishes the current snapshot synchronously in the same callback.
`Versioned.make` cannot repair an inconsistent producer.

## Test the contract directly

Test the same settings adapter through all three channels. A new observer must receive the latest
snapshot, and ending that observation must leave the external owner usable.

```ts file="Settings.test.ts"
import { Effect, Option } from "effect"
import { expect, it } from "vitest"
import * as Fx from "@typed/fx/Fx"
import { makeSettingsStore } from "./Settings.js"

it("reads the external owner and gives a new subscriber its current snapshot", () =>
  Effect.gen(function* () {
    const store = makeSettingsStore({ density: "comfortable" })

    expect(yield* store.state).toEqual({ density: "comfortable" })
    expect(yield* store.state.version).toBe(0)

    store.set({ density: "compact" })
    expect(yield* store.state).toEqual({ density: "compact" })
    expect(yield* store.state.version).toBe(1)

    expect(yield* Fx.first(store.state)).toEqual(Option.some({ density: "compact" }))

    // Ending one observer leaves the independently owned store usable.
    store.set({ density: "comfortable" })
    expect(yield* store.state).toEqual({ density: "comfortable" })
  }).pipe(Effect.scoped, Effect.runPromise),
)
```

This tests the adapter's real snapshot and ownership promises. A producer with asynchronous
startup needs additional tests for updates during registration, in-flight reads, and failure
recovery. Continue with [RefSubject](/explore/refsubject-renderer-independent-state) when the
application itself should own writable state, or the
[Versioned reference](/reference/modules/%40typed%2Ffx%2FVersioned) for all channel transformations.

## Provide the adapter as a service

`Versioned.Service` names all three read channels without exposing the owner's writes. Its generic
order is `Self, VersionError, Update, UpdateError, Current, CurrentError`; each channel can fail
independently, and updates need not have the same type as current snapshots.

```ts file="SettingsService.ts"
import { Effect } from "effect"
import { Fx } from "@typed/fx"
import * as Versioned from "@typed/fx/Versioned"

type Settings = { readonly density: "compact" | "comfortable" }

class SettingsView extends Versioned.Service<
  SettingsView, never, Settings, never, Settings
>()("docs/SettingsView") {}

const snapshot: Settings = { density: "compact" }
const SettingsTest = SettingsView.make(
  Effect.succeed(7),
  Fx.succeed(snapshot),
  Effect.succeed(snapshot),
)

const inspect = Effect.gen(function* () {
  const current = yield* SettingsView
  const version = yield* SettingsView.version
  const updates = yield* Fx.collectAll(SettingsView)

  return { current, version, updates }
})

const result = await Effect.runPromise(inspect.pipe(Effect.provide(SettingsTest)))
// { current: { density: "compact" }, version: 7, updates: [{ density: "compact" }] }
```

`SettingsView.make(version, updates, current)` builds a Layer and captures the three channels'
requirements. For the store adapter above, pass `store.state.version`, `store.state`, and
`store.state`. The test uses a finite update source so collection completes; a live store still
requires bounded observation or an explicitly owned subscription.

`yield* SettingsView` reads the current channel. `yield* SettingsView.service` retrieves the
underlying Versioned instance. The facade's `interrupt` stops shared current-read work, matching
the ordinary Versioned contract. Providing the service neither synchronizes the channels nor
makes independently supplied update sources shared. Keep external store cleanup with its owner.

## Compose or share the adapter when needed

`Versioned.struct` and `tuple` combine independently owned channels; they do not establish an atomic
snapshot across stores. `map` and `mapEffect` accept separate `onFx` and `onEffect` projections
because updates and current reads can have different types. Compare version tokens only within the
producer that defines them.

`Versioned.provide` supplies a Layer to all three channels. `hold`, `multicast`, and `replay` add a
shared update subscription whose acquiring Scope owns its lifetime; they do not take ownership of
the external store. For provider boundaries across these
capabilities, see [sharing a reactive capability](/explore/shared-state-contracts).
