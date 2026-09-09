---
title: "Consuming Fx"
summary: "Choose the runner that matches what your application needs from a producer."
section: "Fx"
kind: "guide"
order: 1.99
---

An import screen receives progress events and eventually completes. Its live progress display,
summary report, and “first selection” step need different answers from their producers. Choosing a
runner is deciding both what the caller retains and when enough work has happened.

[Building Fx](/explore/building-fx) established the source contract. Read this before the library
branch's [Sink](/explore/sink-writing-effects) and [Subject](/explore/subject-event-publications).
Every runner below returns an
Effect until the final host boundary. Constructing that Effect is still lazy; executing it starts
the subscription and makes its failures and service requirements part of the owner.

## Process progress as it arrives

Use `observe` when each event should cause an Effect and no collection is needed:

```ts
import { Effect, Ref } from "effect";
import { Fx } from "@typed/fx";

const events = Fx.fromIterable(["saved", "published"]);

const program = Effect.gen(function* () {
  const handled = yield* Ref.make<ReadonlyArray<string>>([]);
  yield* Fx.observe(events, (event) => Ref.update(handled, (all) => [...all, event]));
  return yield* Ref.get(handled);
});
```

The finite fixture produces `saved`, waits for its observer, then produces `published`. The Ref
records the example's result; it is not part of `observe` itself. For a live source the handler
keeps running until the source ends or its owner interrupts it.

The handler can fail or require services, and those channels join the returned Effect. A failed
persistence handler can end observation even when the underlying event API remains capable of
producing. Recover an individual item inside its handler if later input should remain usable.
`observe` does not impose a new queue or concurrency policy on the producer.

## Await the first selection before continuing

Before starting an import, a workflow may require one workspace selection:

```ts
import { Effect, Option } from "effect";
import { Fx } from "@typed/fx";

const selections = Fx.fromIterable(["typed", "effect"]);

const selectedWorkspace = Fx.first(selections).pipe(
  Effect.flatMap(
    Option.match({
      onNone: () => Effect.fail("no workspace selected" as const),
      onSome: Effect.succeed,
    }),
  ),
);
```

[`Fx.first`](/reference/symbols/QHR5cGVkL2Z4L0Z4I2ZpcnN0) returns `Option<A>`. `None` means the
source completed successfully without a selection; failure remains in the Effect error channel.
The example makes absence a domain error because this next step cannot proceed without a workspace.
A screen where “no selection” is normal can keep the Option instead.

The execution is: subscribe → receive one value → stop upstream → run registered cleanup → return.
It does not wait for an originally infinite source to finish on its own. But a source that stays
silent and open cannot produce an answer: add a real stop signal or timeout when the product defines
one, rather than assuming `first` guarantees eventual completion.

## Retain the report only when the source is finite

Once the import finishes, its rows can form a summary:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const importedRows = Fx.fromIterable(["Ada", "Grace", "Edsger"]);

const report = Fx.collectAll(importedRows).pipe(
  Effect.map((rows) => ({ count: rows.length, rows })),
);

const preview = Fx.collectUpTo(importedRows, 2);
```

`collectAll` retains every value until normal completion. An open progress feed never produces that
array and keeps accumulating memory. `collectUpTo(source, 2)` instead stops after at most two values;
it still waits if only one value arrives and the source remains open. A bound limits retained
cardinality, not how long silence lasts.

For work whose useful effects already happen inside the producer, keep only completion:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const migrations = Fx.fromIterable(["users", "projects"]).pipe(
  Fx.tap((table) => Effect.log(`migrated ${table}`)),
);

const runMigrations: Effect.Effect<void> = Fx.drain(migrations);
```

`drain` discards emitted values, but it still reports failures. It is appropriate for the migration
fixture because `tap` performs the logging. It would be a bug to replace a required storage handler
with `drain` and assume that ignored values were persisted somewhere.

## Keep an existing Stream consumer at its boundary

If downstream code already uses Stream operations, adapt once:

```ts
import { Stream } from "effect";
import { Fx } from "@typed/fx";

const temperatures = Fx.fromIterable([18, 20, 21, 23]);

const average = Stream.runFold(
  Fx.toStream(temperatures),
  () => ({ total: 0, count: 0 }),
  (state, value) => ({ total: state.total + value, count: state.count + 1 }),
);
```

`toStream` starts the Fx lazily when the Stream runs. The Stream scope owns the adapter queue and
cleanup. Its optional buffer settings are Effect Stream callback options. `fromStream` carries
Stream values back into Fx while retaining errors, services, and finalizers. Compose with the
operations your consumer needs; both remain owned by the same Effect program.

## Give the live observer the feature's real lifetime

A single live observer already runs for the producer's lifetime. Observe it directly:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const heartbeats = Fx.periodic("10 seconds");

const application = Fx.observe(heartbeats, () => Effect.log("connection alive"));

await Effect.runPromise(application);
```

Observation blocks until the producer completes, fails, or is interrupted. Interrupting it cancels
the heartbeat's wait and prevents future ticks. Inside an Effect program, yield the observation
directly; fork only when other work needs to proceed concurrently.

For infrastructure composed into an application Layer, use `observeLayer` or `drainLayer` and
launch the application with `Layer.launch`. The Layer owns the subscription and its Scope.
Successful Layer acquisition does not supervise future background failures; handle those within
the source or observer.

## Cross into a foreign host once

`runPromise` and `runPromiseExit` are root runners for a test harness, CLI, or foreign application
entry point after required services have been provided:

```ts
import { Effect, Exit } from "effect";
import { Fx } from "@typed/fx";

const main = async () => {
  const exit = await Fx.runPromiseExit(Fx.fromEffect(Effect.log("service ready")));

  if (Exit.isFailure(exit)) {
    console.error(exit.cause);
  }
};

await main();
```

The Exit form exposes the complete outcome to a host that must inspect it. Inside an Effect program,
keep composing Effects; starting an independent root Fiber for each callback loses the owner's
cancellation path. `Fx.runFork` is the root option when the foreign host explicitly owns a long-lived
producer and will interrupt its Fiber later.

When a consumer hangs, inspect its finish condition: missing first value, insufficient bounded
values, or absent normal completion. When it ends too early, inspect both source and handler failure.
[Selection](/explore/fx-selection-and-cardinality), [time](/explore/fx-time-and-rate), and
[services and lifetime](/explore/fx-services-and-lifetime) define those different boundaries.
