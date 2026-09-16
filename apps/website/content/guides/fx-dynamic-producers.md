---
title: "Choose an Fx producer dynamically"
summary: "Choose a producer during observation and keep setup resources alive until it ends."
section: "Fx"
kind: "guide"
order: 1.15
---

Sometimes an Effect must run before you know which Fx to observe. `unwrap` and `gen` run that
setup during observation, then forward values from the selected producer. Their scoped forms also
own any resources acquired during setup.

[Building Fx values](/explore/building-fx) introduced individual sources. Here the distinction is
between **choosing an Fx** and **emitting a value from that Fx**.

## First, choose a producer with an Effect

Suppose the configuration decision is already an Effect. Its result can be the producer itself:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const chooseActivity = Effect.succeed(
  Fx.fromIterable(["workspace:opened", "workspace:updated"]),
);

const activity = Fx.unwrap(chooseActivity);

// Returns ["workspace:opened", "workspace:updated"].
const result = await Effect.runPromise(Fx.collectAll(activity));
```

`Fx.unwrap` does not emit the Fx object. When `activity` is observed, it runs `chooseActivity`,
subscribes to the returned Fx, and forwards that producer's events. A failed choice starts no
producer. Interrupting the observer interrupts whichever phase is active.

```fx-marble
title: setup chooses a producer before any selected event can arrive
covers: gen, unwrap
input setup: ^ choose |
operator: unwrap(setup) / gen(setup)
inner selected Fx: . . ^ opened updated |
output: . . . opened updated |
```

Read down from `choose`: it permits the selected lane's raised start chevron, not an output event. The first output
is `opened`. The spaces between phases are logical sequencing, not promised clock delays.

`Fx.gen` is the generator form of this same two-phase operation: yield setup Effects and return the
selected Fx.

## Give the producer parameters

[`Fx.fn`](/reference/symbols/QHR5cGVkL2Z4L0Z4I2Zu) preserves function parameters and combines the
requirements of yielded Effects and the returned Fx. This version accepts an Effect that chooses
between two finite sources:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const activityFor = Fx.fn(function* (mode: Effect.Effect<"cached" | "connected">) {
  const selected = yield* mode;

  return selected === "cached"
    ? Fx.succeed("cached")
    : Fx.fromIterable(["opened", "updated"]);
});

const activity = activityFor(Effect.succeed("connected"));

// Returns ["opened", "updated"].
const result = await Effect.runPromise(Fx.collectAll(activity));
```

Calling `activityFor` captures the argument. Observing its result runs `mode` and selects the
producer. Every observation repeats the choice; this is a factory, not a cache.

## Keep acquisition alive through the selected producer

When setup acquires a resource, its scope must enclose both setup and observation. If the scope
closes before returning the Fx, the resource is already released when its producer starts.
`unwrapScoped` owns that scope. This finite stand-in logs its release so the lifetime is visible:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const acquireActivity = Effect.gen(function* () {
  const connection = yield* Effect.acquireRelease(
    Effect.succeed({ events: Fx.fromIterable(["opened", "updated"]) }),
    () => Effect.log("released connection"),
  );

  return connection.events;
});

const activity = Fx.unwrapScoped(acquireActivity);
const firstEvent = Fx.first(activity);

// Logs "released connection" and returns Option.some("opened").
const result = await Effect.runPromise(firstEvent);
```

```fx-marble
title: unwrapScoped holds the acquired resource until selected observation ends
covers: unwrapScoped
input setup: ^ acquire | . . .
operator: unwrapScoped(setup)
inner resource: . ^ open . . . release |
inner selected Fx: . . ^ opened updated | .
output: . . . opened updated . |
```

The resource lane extends beyond setup's completion. `firstEvent` can stop earlier than the depicted
full run: after `opened`, it interrupts the selected producer and releases the same resource. No
special “first event” cleanup path is needed. `genScoped` is the equivalent generator form.
Plain `unwrap` and `gen` preserve a setup `Scope` requirement for the caller; their scoped
counterparts own it internally.

## Decide what a mode change means

This feed reads mode once per subscription. It does not automatically switch when configuration
changes later. If mode itself is a live producer, use [switchMap](/explore/fx-higher-order-and-concurrency)
to select a new scoped feed on each mode change. The old branch is interrupted and finalized before
the replacement starts. If several consumers should use the same connection, apply an explicit
[sharing policy](/explore/subject-event-publications) after constructing the feed.

For a live adapter, check that interrupting observation releases its resource even when no event
has arrived. Continue with [services and lifetime](/explore/fx-services-and-lifetime) to provide the
adapter and own the observing Fiber.
