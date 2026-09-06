---
title: "Subject: publish events to many consumers"
summary: "Connect independently owned producers and consumers through one scoped, typed publication boundary."
section: "Fx"
kind: "guide"
order: 1.17
---

An invoice save should notify the activity panel and the notification banner. The saving workflow
publishes one event, while those independently owned consumers subscribe for as long as they need
it. That shared publication point is a `Subject`.

A Subject combines the [Sink](/explore/sink-writing-effects) write boundary with an Fx subscription
boundary. Producers call `onSuccess` or `onFailure`; consumers use `observe`, `take`, `merge`, and
other Fx operations. Start with [Consuming Fx](/explore/consuming-fx) if the difference between a
producer value and an active subscription is unfamiliar.

## Decide what a late observer should receive

An “invoice saved” event happened at a particular time. A banner mounted afterward usually should
not announce it again. The selected invoice, however, is current state that a newly mounted panel
must be able to read. Use a zero-replay Subject for the event and a RefSubject for current state.

```fx-marble
title: a late Subject subscriber sees only future events without replay
input publications: . saved . . published .
operator: Subject.make(0)
inner early subscriber: ^ saved . . published x
inner late subscriber: . . ^ . published x
output late observer: . . . . published x
```

The later observer's `^` occurs after `saved`, so only the early observer receives that event. Both
receive `published`. Their owner's `x` interrupts the subscriptions; publication itself does not
complete the Subject.

[`Subject.make(replay?)`](/reference/symbols/QHR5cGVkL2Z4L1N1YmplY3QjbWFrZQ) has replay capacity
zero by default. Capacity one retains the latest success or failure; larger capacities retain that
many publications in FIFO order. Replay changes what late subscribers see, not whether the Subject
has a current Effect read or state update operation. Invalid capacities fail with
`Cause.IllegalArgumentError`.

## Subscribe before publishing and give both sides an owner

This finite connection-status example establishes readiness explicitly:

```ts
import { Effect, Fiber } from "effect";
import { Fx } from "@typed/fx";
import * as Subject from "@typed/fx/Subject";

const program = Effect.scoped(
  Effect.gen(function* () {
    const connectionEvents = yield* Subject.make<string>(1);
    const received = yield* Fx.collectAllFork(Fx.take(connectionEvents, 2));

    while ((yield* connectionEvents.subscriberCount) < 1) yield* Effect.yieldNow;
    yield* connectionEvents.onSuccess("connected");
    yield* connectionEvents.onSuccess("ready");

    return yield* Fiber.join(received);
  }),
);

await Effect.runPromise(program); // ["connected", "ready"]
```

`make` requires Scope. `collectAllFork` starts an observer bounded by `take(2)`; `subscriberCount`
confirms its registration before the first publication. Outside a reentrant subscriber callback, awaiting `onSuccess` waits for delivery
to that publication's subscriber snapshot. After two events the collector returns and the enclosing
Scope releases remaining subscriptions and replay.

A single scheduler yield does not prove a subscriber has registered. Zero replay deliberately cannot
recover an event published too early. If a readiness wait is part of a test harness, bound it with a
timeout so a broken subscription produces a diagnostic rather than hanging forever.

`unsafeMake` constructs synchronously without installing a scope finalizer. It starts no work, but
its caller must have a concrete owner that invokes `interrupt`. Prefer scoped `make` for application,
request, feature, and Layer boundaries.

## Observe event effects without retaining state in the Subject

```ts
import { Effect, Ref } from "effect";
import { Fx } from "@typed/fx";
import * as Subject from "@typed/fx/Subject";

const program = Effect.scoped(
  Effect.gen(function* () {
    const notifications = yield* Subject.make<string>();
    const seen = yield* Ref.make<ReadonlyArray<string>>([]);

    yield* Effect.forkScoped(
      Fx.observe(notifications, (message) => Ref.update(seen, (all) => [...all, message])),
    );
    while ((yield* notifications.subscriberCount) < 1) yield* Effect.yieldNow;
    yield* notifications.onSuccess("saved");

    return yield* Ref.get(seen);
  }),
);
```

The Ref is only this consumer's record of received messages; the Subject still has no current read.
At publication start, the Subject captures its subscriber set. An observer added during delivery
starts with later publications; one removed during delivery receives no later publication.
Concurrent and reentrant writes are serialized in FIFO order. A reentrant publication from the
currently draining callback enqueues and returns before its own delivery, allowing the outer drain
to continue without deadlocking. Its completion therefore is not a nested delivery acknowledgment.

That serialization is a publication contract, not a claim that a browser callback can await it.
An Effect producer can await `onSuccess`; a foreign callback that starts a Fiber and ignores it can
still produce a burst of waiting work. Diagnose retained replay and pending slow deliveries separately.
Replay capacity is not a global queue bound.

Another Fx can publish directly through `source.run(subject)`. It still needs an owner, and source
completion does not mean the Subject itself must permanently close. Several producers may share
the same event contract, so closing one source should not silently turn the entire bus into a
finished current value.

With replay enabled, joining during an active publication has another observable consequence.
A value enters replay before its queued live delivery. A subscriber joining while an earlier value
is still draining can receive the queued value from replay, then receive it again from live delivery.
Replay therefore does not promise exactly-once delivery across concurrent subscribe/publish races;
coordinate that boundary or use domain event IDs when the consumer must recognize repeated events.

## Distinguish a failure publication from a closed subscriber

A connection may report loss and later reconnect. The Subject can publish both:

```ts
import { Cause, Data, Effect, Ref } from "effect";
import { Sink } from "@typed/fx";
import * as Subject from "@typed/fx/Subject";

class ConnectionLost extends Data.TaggedError("ConnectionLost")<{}> {}

const program = Effect.scoped(
  Effect.gen(function* () {
    const events = yield* Subject.make<string, ConnectionLost>();
    const values = yield* Ref.make<ReadonlyArray<string>>([]);
    const failures = yield* Ref.make(0);
    const sink = Sink.make<string, ConnectionLost>(
      () => Ref.update(failures, (count) => count + 1),
      (value) => Ref.update(values, (all) => [...all, value]),
    );

    yield* Effect.forkScoped(events.run(sink));
    while ((yield* events.subscriberCount) < 1) yield* Effect.yieldNow;
    yield* events.onFailure(Cause.fail(new ConnectionLost()));
    yield* events.onSuccess("reconnected");

    return { failures: yield* Ref.get(failures), values: yield* Ref.get(values) };
  }),
);
```

The custom Sink counts the `ConnectionLost` Cause and remains subscribed for `reconnected`.
`onFailure` receives the complete Cause, preserving expected failure, defects, and interruption.
Reporting a failure does not permanently close the Subject.

An ordinary failing collector can still end its own subscription at that first Cause. Those are
separate contracts: the Subject accepts later publications, but the chosen consumer may already
have exited. If the banner should remain subscribed after an unavailable event, model availability
as ordinary event data or choose an explicit recovery/handling policy. Do not assume that the
Subject's ability to continue forces every runner to continue.

## Name events shared by independently assembled features

Cross-route notifications can be an Effect service instead of a module-global singleton:

```ts
import { Effect, Fiber } from "effect";
import { Fx } from "@typed/fx";
import * as Subject from "@typed/fx/Subject";

class Notifications extends Subject.Service<Notifications, string>()("docs/Notifications") {}

const program = Effect.scoped(
  Effect.gen(function* () {
    const received = yield* Fx.collectAllFork(Fx.take(Notifications, 1));

    while ((yield* Notifications.subscriberCount) < 1) yield* Effect.yieldNow;
    yield* Notifications.onSuccess("invoice saved");
    return yield* Fiber.join(received);
  }).pipe(Effect.provide(Notifications.make(1))),
);
```

`Subject.Service` is simultaneously Subject, Fx, and Sink. `.make(replay?)` supplies its scoped Layer.
The requirement remains visible at publication and subscription boundaries until that Layer is
provided. Keep purely local events local; Context is useful because independent features need a
shared capability, not because every event needs an application-wide bus.

`subscriberCount` reads active sinks without subscribing. `interrupt` stops current subscriptions
and clears replay, but the Subject can be subscribed to again afterward. Scope closure is the usual
lifetime boundary; explicit interruption is useful when an owner deliberately stops demand early.

## Share one producer execution when observers need the same connection

Multicasting an existing producer is different from manually publishing into an event bus:

```ts
import { Fx } from "@typed/fx";
import * as Subject from "@typed/fx/Subject";

const source = Fx.fromIterable(["connecting", "online"]);
const liveOnly = Subject.multicast(source);
const latest = Subject.hold(source);
const recent = source.pipe(Subject.replay(2));

const selectedPolicy = Subject.share(source, Subject.unsafeMake<string>(2));
```

For `multicast`, the first subscriber starts the source; the last leaving interrupts it; a later
subscriber starts a fresh execution. `hold` replays the most recent exit and `replay(n)` retains a
chosen recent window. Construct one shared wrapper for one consumer population. Creating a separate
wrapper for every observer still creates separate source executions.

`share(source, subject)` lets the caller choose the exact Subject, as the final line does for replay.
Do not reuse that Subject concurrently for unrelated source populations. The selected unsafe Subject
here is managed by the sharing lifecycle; arbitrary standalone unsafe subjects still require their
own explicit interruption owner.

## Verify delivery, failure handling, and cleanup as distinct promises

```ts
import { Effect, Fiber } from "effect"
import { expect, it } from "@effect/vitest"
import { Fx } from "@typed/fx"
import * as Subject from "@typed/fx/Subject"

it.effect("publishes to the active subscriber", Effect.fn("publishesToActiveSubscriber")(function* () {
  const events = yield* Subject.make<number>()
  const received = yield* Fx.collectAllFork(Fx.take(events, 2))

  while ((yield* events.subscriberCount) < 1) yield* Effect.yieldNow
  expect(yield* events.subscriberCount).toBe(1)
  yield* events.onSuccess(1)
  yield* events.onSuccess(2)
  expect(yield* Fiber.join(received)).toEqual([1, 2])
}))
```

The test waits for registration and observes a finite slice. Extend it for the behavior your feature
promises: mount late and assert replay, publish a Cause and check whether the consumer stays live,
then remove subscribers and verify source cleanup. A renderer is unnecessary to test publication
order; a separate interaction test can verify that a save actually publishes the right invoice event.

For a missing notification, first check registration order, then replay, then whether the consumer
exited after a failure. For duplicates, count source executions and publishers before changing replay.
For a value that must be readable now rather than delivered as an occurrence, use RefSubject.
Continue with [services and lifetime](/explore/fx-services-and-lifetime) for shared connection owners,
or [stateful transforms](/explore/fx-stateful-transforms) to derive transitions from these events.
