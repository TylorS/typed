---
title: "Model time, repetition, and rate"
summary: "Choose a clock boundary deliberately, then test it with the clock the feature owns."
section: "Fx"
kind: "guide"
order: 1.7
---

Time changes a producer's product contract. A postponed search, a periodic poll, and a silent
connection each need a different rule. Start with [Transforming Fx](/explore/transforming-fx), then
apply a clock only where the feature can name its outcome.

## Separate postponed delivery from omitted input

```ts
import { Fx } from "@typed/fx"

const input = Fx.fromIterable(["t", "ty", "typed"])
const delayed = input.pipe(Fx.delay("100 millis"))
const settled = input.pipe(Fx.debounce("250 millis"))
const preview = input.pipe(Fx.throttle("100 millis"))
```

`delay` postpones every value. `debounce` keeps only the value that remains current through its
quiet period. `throttle` limits a window according to its configured leading/trailing policy. Put
normalization and admission before debounce when short input should not reset the clock.

## Test the search rule using the clock it actually runs on

```ts
import { Effect, Fiber } from "effect"
import { expect, it } from "@effect/vitest"
import * as TestClock from "effect/testing/TestClock"
import { Fx } from "@typed/fx"

const settledQuery = Effect.fn(function* () {
  const search = Fx.mergeAll(Fx.at("ty", "0 millis"), Fx.at("typed", "50 millis")).pipe(
    Fx.debounce("200 millis"),
  )
  const fiber = yield* Effect.forkScoped(Fx.collectAll(search))
  yield* TestClock.adjust("250 millis")
  expect(yield* Fiber.join(fiber)).toEqual(["typed"])
})

it.effect("keeps only the settled query", () =>
  settledQuery().pipe(Effect.provide(TestClock.layer()), Effect.scoped),
)
```

Advance the same Effect clock that owns the source. A browser event adapter still needs an owner
and cleanup; [dynamic producers](/explore/fx-dynamic-producers) covers that boundary.

## Poll by completion or tick on a schedule

```ts
import { Schedule } from "effect"
import { Fx } from "@typed/fx"

const poll = Fx.fromSchedule(Schedule.recurs(2))
const repeated = Fx.succeed("checked").pipe(Fx.repeat(Schedule.recurs(2)))
const heartbeat = Fx.periodic("1 second")
```

`repeat` starts a fresh run only after the preceding one completes. `periodic` emits clock ticks;
use a higher-order mapper only after deciding whether an unfinished request may overlap its next tick.
Failure is not repetition: [recovery](/explore/fx-errors-and-recovery) owns retry policy.

## Decide whether silence ends the feed or selects a fallback

```ts
import { Fx } from "@typed/fx"

const heartbeat = Fx.periodic("1 second")
const connectionEnded = heartbeat.pipe(Fx.timeout("2 seconds"))
const availability = heartbeat.pipe(Fx.timeoutTo("2 seconds", Fx.succeed("offline")))
```

`timeout` completes normally after the chosen silence. `timeoutTo` instead interrupts the source
and begins a fallback. Neither proves a server disconnected; each models the application threshold.

## <span id="give-each-drag-its-own-movement-window">Optional recipe: drag windows</span>

A drag needs a scoped event adapter, a matching stop signal, and a rate policy for derived positions.
Those browser details are intentionally outside this timing lesson. Use [dynamic producers](/explore/fx-dynamic-producers)
for adapters and [higher-order work](/explore/fx-higher-order-and-concurrency) when every start opens
a replacement window.

Continue with [errors and recovery](/explore/fx-errors-and-recovery) when a timed request fails or
retries; [services and lifetime](/explore/fx-services-and-lifetime) attaches these clocks to a
feature owner.
