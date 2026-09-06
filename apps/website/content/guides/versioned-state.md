---
title: "Working with Versioned state"
summary: "Keep a current read, update stream, and invalidation token together when a value comes from an independently owned source."
section: "State"
kind: "guide"
order: 2.22
---

A library may already own a cache or external store. Its consumers need to read the latest
snapshot, observe updates, and detect invalidation without receiving the producer's write API.
`Versioned` bundles those capabilities while leaving the existing owner in charge. It combines
three related, but independently typed, channels:

- `version`: an Effect that reads a numeric invalidation token;
- the `Fx` itself: updates that observers receive over time;
- the Effect itself: the current value when a consumer reads it.

Use it when a cache, transport, external store, or library must expose all three capabilities
without choosing how the producer writes. `RefSubject` is the higher-level choice for ordinary
writable application state; it implements the same read-and-observe shape while also defining
state transitions.

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

## Combine independent sources without promising a transaction

`Versioned.struct` and `tuple` combine three channels, just as the underlying values do.
`map` and `mapEffect` take explicit `onFx` and `onEffect` projections for their separate channels;
`filterMap` introduces meaningful
absence on current reads while skipping absent update values. Use these when exposing an external
store adapter. Use RefSubject's higher-level views when your source already is a RefSubject.

A price feed and an inventory feed can be combined for display, but a combined value does not
establish that their snapshots describe the same instant. A checkout invariant needs an authoritative
reservation operation. Version tokens can tell you to recompute a quote; they do not lock inventory.

```ts
import { Effect } from "effect"
import * as Versioned from "@typed/fx/Versioned"

const price = Versioned.of(2500)
const available = Versioned.of(3)
const quote = Versioned.map(
  Versioned.tuple([price, available]),
  {
    onFx: ([cents, stock]) => ({ cents, canOrder: stock > 0 }),
    onEffect: ([cents, stock]) => ({ cents, canOrder: stock > 0 }),
  },
)
const currentQuote = Effect.map(quote, (value) => value.canOrder ? value.cents : undefined)
```

For an external-store adapter, verify the handoff between “read current” and “subscribe.” A producer
that publishes between those operations can lose an update unless its subscription replays current
state or its version protocol detects the race. `Versioned.make` cannot repair an inconsistent
producer. Write the promised behavior into the adapter test: update during subscription startup,
read during an in-flight refresh, failure followed by recovery, and closing the observer while the
producer remains alive.

Do not compare version tokens from different producers. Even when both happen to return `7`, the
number identifies only that producer's invalidation state. A persisted cache should also include
resource identity and schema/version information; a bare token is not a portable cache key.

## Preserve errors, services, and lifetime

The public type has one environment/error pair for each channel:

```text
Versioned<RVersion, EVersion, AUpdate, EUpdate, RUpdate, ACurrent, ECurrent, RCurrent>
```

This prevents an update-stream failure from being silently treated as a failed current read. When
one Layer should satisfy all three channels, use `Versioned.provide(versioned, layer)`. It applies
the Layer consistently to version reads, updates, and current reads.

`Versioned` itself performs no acquisition. `Versioned.hold`, `Versioned.multicast`, and
`Versioned.replay` add a scoped shared update subscription; the Scope that runs them owns that
subscription and any replay buffer. Keep that Scope with the feature, request, or test that owns
the shared observation.

For a Context dependency, `Versioned.Service` creates a normal Effect service facade and a Layer
constructor. Consumers retain the same three operations through the service tag.

```ts
import { Effect } from "effect";
import * as Fx from "@typed/fx/Fx";
import * as Versioned from "@typed/fx/Versioned";

class Status extends Versioned.Service<Status, never, string, never, string>()("example/Status") {}

const StatusLive = Status.make(
  Effect.succeed(1),
  Fx.succeed("ready"),
  Effect.succeed("ready"),
);

const program = Effect.gen(function* () {
  return {
    value: yield* Status,
    version: yield* Status.version,
    updates: yield* Fx.collectAll(Status),
  };
}).pipe(Effect.provide(StatusLive), Effect.scoped);

await Effect.runPromise(program);
```

## Test the contract directly

No application shell is needed to test a `Versioned` contract. Construct a finite value, run the
three channels, and assert the producer's promised relation between them. Separately test failures,
required services, and scoped sharing when the concrete producer uses those features.

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
