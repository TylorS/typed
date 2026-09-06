---
title: "Model time, repetition, and rate"
summary: "Put clocks, quiet periods, rate windows, and retries in the Fx graph with explicit cancellation."
section: "Fx"
kind: "guide"
order: 1.7
---

A document editor needs three different clocks. Search should wait until typing settles. A dragging
preview should update promptly but at a bounded rate. A connection indicator should become unavailable
after silence. Putting the same timer around all three would lose the distinctions the user sees.

After [selection by values](/explore/fx-selection-and-cardinality), this lesson makes time the
selection boundary. Effect owns the clock and its interruption; the feature still chooses which
values may be omitted and what silence means.

## Separate postponed delivery from omitted input

```ts
import { Fx } from "@typed/fx";

const notice = Fx.at("saved", "1 second");
const paced = Fx.fromIterable([1, 2, 3]).pipe(Fx.delay("100 millis"));

const edits = Fx.fromIterable(["t", "ty", "typed"]);
const settledEdits = edits.pipe(Fx.debounce("250 millis"));
const previews = edits.pipe(
  Fx.throttle({ duration: "100 millis", leading: true, trailing: true }),
);

const settledValues = Fx.collectAll(settledEdits);
```

`at(value, delay)` produces one value after a wait. [`delay`](/reference/symbols/QHR5cGVkL2Z4L0Z4I2RlbGF5)
sleeps before forwarding each delivery. With sequential `fromIterable`, those sleeps pace the example's
outputs at roughly 100, 200, and 300 milliseconds. Concurrent producers can overlap sleeps instead;
`delay` inherits producer concurrency through `mapEffect` rather than adding a queue.

```fx-marble
title: delay sleeps 100ms for each independently timed delivery (50ms slots)
covers: delay
input: a . b . c . . |
operator: delay(100ms)
output: . . a . b . c |
```

This diagram assumes independently timed source deliveries. Each is shifted by two slots, and the
source run itself waits for pending deliveries before completing. A sequential producer would also
shift later input work while waiting for each earlier sink delivery.

For search, every intermediate string is not equally useful:

```fx-marble
title: debounce emits 250ms after the final value (50ms slots)
covers: debounce
input: t . ty . typed . . . . . |
operator: debounce(250ms)
output: . . . . . . . . . typed |
```

Each newer query cancels the previous quiet-period timer. `t` and `ty` never emit; only `typed`
survives five quiet 50-millisecond slots. Debounce is selection, not merely postponement. Normalize
and remove adjacent repeated queries before debounce when a whitespace-only edit should not restart
that timer.

For a preview, waiting for silence would withhold feedback throughout a continuous gesture:

```fx-marble
title: throttle keeps leading and trailing values in a 100ms window (50ms slots)
covers: throttle
input: t ty . . next . . |
operator: throttle({ duration: 100ms, leading: true, trailing: true })
output: t . ty . next . . |
```

Throttle opens a fixed window. The duration-only form emits the leading value. With both options
enabled, `t` appears immediately and the latest busy value `ty` appears at the trailing boundary.
A leading-only policy can omit the final position of a burst. Both debounce and throttle require
Scope to own pending timers and retained values.

## Test the search rule using the clock it actually runs on

```ts
import { Effect, Fiber } from "effect";
import * as TestClock from "effect/testing/TestClock";
import { expect, it } from "@effect/vitest";
import { Fx } from "@typed/fx";

it.effect("keeps the final search query after quiet time", Effect.fn(function* () {
  const queries = Fx.fromIterable(["t", "ty", "typed"]).pipe(Fx.debounce("250 millis"));
  const result = yield* Effect.forkScoped(Fx.collectAll(queries));
  yield* TestClock.adjust("250 millis");
  expect(yield* Fiber.join(result)).toEqual(["typed"]);
}));
```

The finite input produces its burst immediately. The test forks collection so its pending timer can
remain asleep while the test advances Effect's clock, then asserts the final query. It does not wait
250 milliseconds of wall time. Also test interruption while a value is pending: closing the editor
must prevent a stale search from firing afterward.

## Poll by completion or tick on a schedule

```ts
import { Effect, Schedule } from "effect";
import { Fx } from "@typed/fx";

const threeHeartbeats = Fx.collectAll(Fx.periodic("1 minute").pipe(Fx.take(3)));
const twoScheduledTicks = Fx.collectAll(Fx.fromSchedule(Schedule.recurs(2)));

const pollAttempt = Fx.succeed("updated");
const threePolls = Fx.collectAll(pollAttempt.pipe(Fx.repeat(Schedule.recurs(2))));

const program: Effect.Effect<ReadonlyArray<string>> = threePolls;
```

`periodic` first emits after a full period; it has no immediate initial tick. `fromSchedule` emits
according to the recurrence, and `Schedule.recurs(2)` produces two ticks. `repeat` is different:
it runs a source once, then permits two additional subscriptions for a total of three scans.

```fx-marble
title: repeat starts a fresh run only after the previous run completes
covers: repeat
input source: ^ poll |
operator: repeat(Schedule.recurs(2))
inner repeat-1: . . ^ poll |
inner repeat-2: . . . . ^ poll |
output: . poll . poll . poll |
```

Each raised start chevron follows normal completion of the previous run. There is no overlapping poll.
A failed source stops repeat; [retry](/explore/fx-errors-and-recovery) handles a failed subscription
instead. Schedules can contribute their own errors and service requirements, which remain visible
rather than escaping into a detached timer callback.

## Decide whether silence ends the feed or selects a fallback

```ts
import { Fx } from "@typed/fx";

const heartbeat = Fx.periodic("1 second");
const connectionEnded = heartbeat.pipe(Fx.timeout("2 seconds"));
const availability = heartbeat.pipe(Fx.timeoutTo("2 seconds", Fx.succeed("offline")));

const availabilityValues = Fx.collectAll(availability);
```

The heartbeat fixture emits every second, so its two-second idle timeout never fires. To test the
fallback, use a source that intentionally goes silent as shown below:

```fx-marble
title: timeout completes normally after two seconds of silence (1s slots)
covers: timeout
input source: ^ beat beat . x
input timeout: ^ . . . |
operator: timeout(2 seconds)
output: . beat beat . |
```

`timeout` resets after every emitted value. Two seconds without an initial or later event complete
the output normally and interrupt the source. This is not an expected timeout error.

```fx-marble
title: timeoutTo cancels the source and hands off to its fallback
covers: timeoutTo
input source: ^ beat beat . x
input timeout: ^ . . . |
inner fallback: . . . . ^ offline |
operator: timeoutTo(2 seconds, fallback)
output: . beat beat . . offline |
```

`timeoutTo` instead selects its fallback after interrupting the quiet source. `offline` appears from
that new inner lane. Its values, failures, and requirements join those of the original source.
Neither operation asserts that a server is physically disconnected; it models the product's chosen
idle threshold.

## Give each drag its own movement window

The drag interaction needs an event boundary and may then apply a rate policy to its positions.
`pointerdown` captures the initial coordinates, matching moves produce deltas, and a matching
`pointerup` or `pointercancel` closes that drag:

```ts
import { Stream } from "effect";
import { Fx } from "@typed/fx";

type DragEvent =
  | { readonly _tag: "Start"; readonly pointerId: number; readonly x: number; readonly y: number }
  | {
      readonly _tag: "Move";
      readonly pointerId: number;
      readonly x: number;
      readonly y: number;
      readonly dx: number;
      readonly dy: number;
    }
  | { readonly _tag: "End"; readonly pointerId: number };

const pointerEvents = (target: EventTarget, type: string): Fx.Fx<PointerEvent> =>
  Stream.fromEventListener<Event>(target, type).pipe(
    Stream.filter((event): event is PointerEvent => event instanceof PointerEvent),
    Fx.fromStream,
  );

export const dragEvents = (handle: HTMLElement) => {
  const starts = pointerEvents(handle, "pointerdown").pipe(
    Fx.filter((event) => event.button === 0),
  );
  const moves = pointerEvents(document, "pointermove");
  const ends = Fx.mergeAll(
    pointerEvents(document, "pointerup"),
    pointerEvents(document, "pointercancel"),
  );

  return starts.pipe(
    Fx.switchMap((start) => {
      const matchingMoves = moves.pipe(
        Fx.filter((event) => event.pointerId === start.pointerId),
        Fx.map(
          (event): DragEvent => ({
            _tag: "Move",
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            dx: event.clientX - start.clientX,
            dy: event.clientY - start.clientY,
          }),
        ),
      );
      const stop = ends.pipe(
        Fx.filter((event) => event.pointerId === start.pointerId),
        Fx.take(1),
      );

      return matchingMoves.pipe(
        Fx.until(stop),
        Fx.prepend({
          _tag: "Start",
          pointerId: start.pointerId,
          x: start.clientX,
          y: start.clientY,
        } as const),
        Fx.append({ _tag: "End", pointerId: start.pointerId } as const),
      );
    }),
  );
};
```

`Stream.fromEventListener` owns listener registration, removal, and buffering; `Fx.fromStream`
keeps that scoped lifetime. Its default unbounded buffer retains events until consumed, so avoid
slow work in the movement handler. `until(stop)` interrupts
the move subscription at the matching stop event; `switchMap` replaces an unfinished drag when a
new start arrives.

`Start` is a normal prefixed event and `End` a normal appended event. If the whole inner is interrupted
by a replacement start, its append need not run. Release resources in finalizers rather than relying
on a final displayed event. This example models drag events; a complete drag interface separately
chooses capture, bounds, accessibility, and how positions affect layout.

For one bounded window, `during(events, starts)` uses the first start value as the stop Fx. The
explicit switching form here preserves coordinates and can open another window on every start.
Apply trailing throttle to derived preview positions when frequency should be bounded; do not throttle
away control events required to close the gesture.

The same ownership rule now covers all three clocks: observation starts the wait, its owner stays
open while the feature needs it, and interruption cancels pending work. Continue with
[services and lifetime](/explore/fx-services-and-lifetime) to attach that owner to a feature, or
[higher-order policies](/explore/fx-higher-order-and-concurrency) when a timed event starts new work.
