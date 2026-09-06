---
title: "Choose an Fx producer dynamically"
summary: "Build a workspace feed whose configuration, connection, and cleanup are resolved when it is observed."
section: "Fx"
kind: "guide"
order: 1.15
---

A workspace activity feed can start in two modes. Offline workspaces show a cached snapshot and
finish. Connected workspaces acquire a connection and keep receiving events. The workspace is an
argument, but configuration and connection acquisition belong to the subscription: calling a
function should not open a socket that nobody observes.

[Building Fx values](/explore/building-fx) introduced individual sources. This lesson puts a setup
phase in front of a source, then gives setup resources the same lifetime as their selected producer.
The key distinction is between **choosing an Fx** and **emitting a value from that Fx**.

## First, choose a producer with an Effect

Suppose the configuration decision is already an Effect. Its result can be the producer itself:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const chooseActivity = Effect.succeed(
  Fx.fromIterable(["workspace:opened", "workspace:updated"]),
);

const activity = Fx.unwrap(chooseActivity);
const result = await Effect.runPromise(Fx.collectAll(activity));
// ["workspace:opened", "workspace:updated"]
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

`Fx.gen` is the generator form of this same two-phase operation. Yield setup Effects and return the
selected Fx. Use it for one producer value; the workspace feed needs parameters, so it uses `Fx.fn`.

## Make the workspace an argument and configuration a requirement

[`Fx.fn`](/reference/symbols/QHR5cGVkL2Z4L0Z4I2Zu) preserves the body's parameters and combines
requirements from its yielded Effects and returned Fx. This complete example uses a finite fake
connection so its output and cleanup can be inspected without a running server. A real adapter can
supply a live callback-backed `events` Fx through the same contract.

```ts
import { Context, Data, Effect } from "effect";
import { Fx } from "@typed/fx";

class ConnectionRejected extends Data.TaggedError("ConnectionRejected")<{
  readonly workspace: string;
}> {}

class ActivitySource extends Context.Service<ActivitySource, {
  readonly mode: (workspace: string) => Effect.Effect<"cached" | "connected">;
  readonly open: (workspace: string) => Effect.Effect<{
    readonly events: Fx.Fx<string>;
    readonly close: Effect.Effect<void>;
  }, ConnectionRejected>;
}>()("example/ActivitySource") {}

const activityFor = Fx.fn(function* (workspace: string) {
  const source = yield* ActivitySource;
  const mode = yield* source.mode(workspace);

  if (mode === "cached") return Fx.succeed(`${workspace}:cached`);

  return Fx.genScoped(function* () {
    const connection = yield* Effect.acquireRelease(
      source.open(workspace),
      (connection) => connection.close,
    );
    return connection.events;
  });
});

const designActivity: Fx.Fx<string, ConnectionRejected, ActivitySource> = activityFor("design");

const program = Fx.collectAll(designActivity).pipe(
  Effect.provideService(ActivitySource, {
    mode: () => Effect.succeed("connected" as const),
    open: (workspace) => Effect.succeed({
      events: Fx.fromIterable([`${workspace}:opened`, `${workspace}:updated`]),
      close: Effect.log(`closed ${workspace}`),
    }),
  }),
);

const result = await Effect.runPromise(program);
// Logs "closed design" and returns ["design:opened", "design:updated"].
```

Calling `activityFor("design")` captures the argument, but does not read configuration. Running
`program` reads the provided service, asks for the mode, acquires the connection, and observes its
events. Completion closes the connection before the result returns. A second observation repeats
all those steps; this is a producer factory, not a connection cache.

The annotation is the public contract: values are strings, acquisition may fail with
`ConnectionRejected`, and an `ActivitySource` must be provided. `Scope` does not escape because
`genScoped` owns the connection. Replacing the live service with a fake changes the destination and
timing, not those type channels.

## Keep acquisition alive through the selected producer

If `open` were scoped and completed *before* returning `connection.events`, the connection would
already be closed when its producer started. The scope must enclose both setup and observation.
`genScoped` does that for the connected branch above. When acquisition already exists as an Effect
returning Fx, use `unwrapScoped` for the same lifetime rule:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const acquireActivity = Effect.gen(function* () {
  const workspace = yield* Effect.acquireRelease(
    Effect.succeed("design"),
    () => Effect.log("released design connection"),
  );
  return Fx.fromIterable([`${workspace}:opened`, `${workspace}:updated`]);
});

const activity = Fx.unwrapScoped(acquireActivity);
const firstEvent = Fx.first(activity);
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
special “first event” cleanup path is needed. Plain `unwrap` and `gen` preserve a setup `Scope`
requirement for the caller; their scoped counterparts own it internally.

## Decide what a mode change means

This feed reads mode once per subscription. It does not automatically switch when configuration
changes later. If mode itself is a live producer, use [switchMap](/explore/fx-higher-order-and-concurrency)
to select a new scoped feed on each mode change. The old branch is interrupted and finalized before
the replacement starts. If several consumers should use the same connection, apply an explicit
[sharing policy](/explore/subject-event-publications) after constructing the feed.

For a failed feed, locate the phase that failed: no acquisition means configuration failed or chose
cache; acquisition without events suggests the selected source is silent; release before events
means scope placement is wrong. Test both mode branches, rejected acquisition, and interruption of
a silent connection. Then continue with [Transforming Fx](/explore/transforming-fx) to turn the
selected events into useful values without repeating setup.
