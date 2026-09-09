---
title: "Subject: publish events to many consumers"
summary: "Connect independently owned producers and consumers through one scoped, typed publication boundary."
section: "Fx"
kind: "guide"
order: 1.17
---

<span id="distinguish-a-failure-publication-from-a-closed-subscriber"></span>
<span id="share-one-producer-execution-when-observers-need-the-same-connection"></span>
<span id="verify-delivery-failure-handling-and-cleanup-as-distinct-promises"></span>

An invoice save can notify an activity panel and a banner without making either consumer part of the
save workflow. A `Subject` is the scoped publication boundary: producers publish values or Causes;
consumers subscribe as Fx. Start with [Consuming Fx](/explore/consuming-fx) when active observation
is unfamiliar.

## Decide what a late observer should receive

An invoice-saved event is an occurrence, so a late banner normally does not replay it. A selected
invoice is current state, so use RefSubject for that capability instead. `Subject.make(0)` is the
default no-replay policy; capacity one or more replays that many publications in FIFO order.

```fx-marble
title: a late Subject subscriber sees only future events without replay
input publications: . saved . . published .
operator: Subject.make(0)
inner early subscriber: ^ saved . . published x
inner late subscriber: . . ^ . published x
output late observer: . . . . published x
```

## Subscribe before publishing and give both sides an owner

```ts
import { Effect, Fiber } from "effect"
import { Fx } from "@typed/fx"
import * as Subject from "@typed/fx/Subject"

const program = Effect.scoped(Effect.gen(function* () {
  const events = yield* Subject.make<string>(1)
  const received = yield* Fx.collectAllFork(Fx.take(events, 2))
  while ((yield* events.subscriberCount) < 1) yield* Effect.yieldNow
  yield* events.onSuccess("connected")
  yield* events.onSuccess("ready")
  return yield* Fiber.join(received)
}))
```

The readiness check is part of the test contract: zero replay cannot recover a publication made
before subscription. `make` requires Scope; closing its owner releases subscriptions and replay.

## <span id="observe-event-effects-without-retaining-state-in-the-subject">Optional delivery contracts</span>

`onSuccess` snapshots current subscribers and serializes concurrent or reentrant publications in
FIFO order. A new subscriber sees later publications; replay can race an already-queued live
delivery, so it is not an exactly-once protocol. `onFailure` publishes a Cause but does not close
the Subject; an individual failing consumer may still end itself. Model recoverable availability as
ordinary data when a consumer must remain live.

```ts
import { Cause, Data, Effect, Ref } from "effect"
import { Sink } from "@typed/fx"
import * as Subject from "@typed/fx/Subject"

class ConnectionLost extends Data.TaggedError("ConnectionLost")<{}> {}

const program = Effect.scoped(Effect.gen(function* () {
  const events = yield* Subject.make<string, ConnectionLost>()
  const values = yield* Ref.make<ReadonlyArray<string>>([])
  const failures = yield* Ref.make(0)
  const sink = Sink.make<string, ConnectionLost>(
    () => Ref.update(failures, (count) => count + 1),
    (value) => Ref.update(values, (all) => [...all, value]),
  )
  yield* Effect.forkScoped(events.run(sink))
  while ((yield* events.subscriberCount) < 1) yield* Effect.yieldNow
  yield* events.onFailure(Cause.fail(new ConnectionLost()))
  yield* events.onSuccess("reconnected")
  return { failures: yield* Ref.get(failures), values: yield* Ref.get(values) }
}))

await Effect.runPromise(program)
```

## <span id="name-events-shared-by-independently-assembled-features">Optional sharing contracts</span>

`Subject.Service` supplies a publication capability through a Layer when independently assembled
features need one. `multicast`, `hold`, `replay`, and `share` instead share one source execution for
one observer population. The first subscriber starts that source and the last leaving interrupts it;
constructing a wrapper per consumer defeats sharing. The generated
[operator atlas](/explore/fx-operator-atlas) is the exhaustive lookup.

Test registration, payload delivery, Cause handling, replay, and source cleanup as separate
promises. Continue with [services and lifetime](/explore/fx-services-and-lifetime) for the owner or
[stateful transforms](/explore/fx-stateful-transforms) for local event history.
