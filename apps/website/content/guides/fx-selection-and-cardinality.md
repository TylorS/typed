---
title: "Select values and bound cardinality"
summary: "Keep, omit, gate, and stop pushed values without confusing selection with cancellation policy."
section: "Fx"
kind: "guide"
order: 1.6
---

An import screen receives raw status lines. It should omit malformed records, show the next two
useful messages after a banner, and include the final “complete” record before stopping. These are
three decisions: admission, a counted window, and a terminal boundary. Treating them as one filter
makes it easy to stop at the wrong moment.

[Transforming Fx](/explore/transforming-fx) introduced zero-or-one output. Here we connect that choice
to how long the producer remains subscribed. A source can be active while every value is rejected;
“nothing visible” does not mean “nothing running.”

## Parse useful records before counting them

```ts
import { Option } from "effect";
import { Fx } from "@typed/fx";

const messages = Fx.fromIterable(["", "notice: connected", "ready", "done"]).pipe(
  Fx.filterMap((line) => {
    const separator = line.indexOf(": ");
    return separator < 0 ? Option.none() : Option.some(line.slice(separator + 2));
  }),
);
// Emits: ["connected"]
```

`filterMap` emits `Some` and omits `None`; the example extracts only the structured notice. If the
original value should remain unchanged, use `filter`. An Effectful admission rule exposes its
failures and service requirements:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const visible = Fx.fromIterable([
  { text: "private", allowed: false },
  { text: "queued", allowed: true },
]).pipe(Fx.filterEffect((message) => Effect.succeed(message.allowed)));
// Emits only the allowed message.
```

An Effect returning `false` omits one value. An Effect failure reports a Cause instead; it is not a
negative predicate result. On a concurrent producer, Effectful checks may finish out of input order,
so choose an explicit serialized boundary if record order is part of the contract.

## Select the useful window

```ts
import { Fx } from "@typed/fx";

const page = Fx.fromIterable(["banner", "connected", "indexing", "complete", "ignored"]).pipe(
  Fx.slice({ skip: 1, take: 2 }),
);
// Emits: ["connected", "indexing"]
```

```fx-marble
title: skip removes only its fixed prefix
covers: skip, skipEffect
input: banner connected indexing |
operator: skip(1)
output: . connected indexing |
```

`skip` removes a fixed prefix while keeping the source live afterward.

```fx-marble
title: take completes after its fixed prefix
covers: take, takeEffect
input: banner connected indexing |
operator: take(2)
output: banner connected | .
```

`take` closes after its accepted prefix; later source values are no longer useful work.

```fx-marble
title: slice keeps one bounded index window and then completes
covers: slice, sliceEffect
input: banner connected indexing complete ignored |
operator: slice({ skip: 1, take: 2 })
output: . connected indexing | . .
```

[`slice`](/reference/symbols/QHR5cGVkL2Z4L0Z4I3NsaWNl) combines both counters. In this run,
`banner` is skipped, `connected` and `indexing` are emitted, then upstream stops. The Effect variants
obtain their bounds before subscribing to the source.

Operator order changes the count. For `blank, connected, indexing`, filtering blanks before `take(2)`
returns both useful messages. Taking two raw records before filtering returns only `connected`.
Choose whether the bound means “inspect two inputs” or “show two useful outputs.” This is an event
window, not server-side pagination unless the producer supplies that dataset and ordering contract.

## Include or exclude the terminal record

```ts
import { Fx } from "@typed/fx";

const beforeComplete = Fx.fromIterable(["connected", "indexing", "complete", "ignored"]).pipe(
  Fx.takeUntil((line) => line === "complete"),
);
// Emits: ["connected", "indexing"]

const throughComplete = Fx.fromIterable(["connected", "indexing", "complete", "ignored"]).pipe(
  Fx.dropAfter((line) => line === "complete"),
);
// Emits: ["connected", "indexing", "complete"]
```

```fx-marble
title: skipWhile drops a matching prefix, and dropWhile is its alias
covers: skipWhile, skipWhileEffect, dropWhile, dropWhileEffect
input: banner banner connected indexing |
operator: skipWhile(isBanner)
output: . . connected indexing |
```

`skipWhile`/`dropWhile` omit the true prefix. After the gate opens, later matching values are no
longer part of that prefix.

```fx-marble
title: dropUntil includes the boundary that opens its gate
covers: dropUntil, dropUntilEffect
input: banner banner connected indexing |
operator: dropUntil(isConnected)
output: . . connected indexing |
```

`dropUntil` includes the value that first satisfies its predicate and all later values.

```fx-marble
title: takeWhile stops before its first false value
covers: takeWhile, takeWhileEffect
input: connected indexing complete ignored |
operator: takeWhile(isInProgress)
output: connected indexing | . .
```

`takeWhile` excludes the first false value and stops.

```fx-marble
title: takeUntil excludes its matching sentinel
covers: takeUntil, takeUntilEffect
input: connected indexing complete ignored |
operator: takeUntil(isComplete)
output: connected indexing | . .
```

`takeUntil` excludes its true sentinel. Here the completion marker is control-only.

```fx-marble
title: dropAfter includes its matching sentinel
covers: dropAfter
input: connected indexing complete ignored |
operator: dropAfter(isComplete)
output: connected indexing complete | .
```

`dropAfter` includes that sentinel before closing. Use this for the import screen's final visible
status. Read the last occupied output slot, not merely the method name: “until” and “after” make
opposite promises about that boundary value.

Effectful variants use the same boundary after resolving their checks, and add the checks' errors
and requirements. `skipWhileEffect` and `dropUntilEffect` still evaluate after their gate opens;
choose a pure predicate when later service calls would be unintended work.

## Let another producer open or close the window

A separate user action can own the window independently of record content:

```fx-marble
title: since opens when its named start signal emits
covers: since
input events: . draft . saved |
input start: . . open |
operator: since(events, start)
output: . . . saved |
```

`since(events, start)` already runs the event source, discarding values until `start` emits. It does
not buffer `draft` for later. A failed start signal leaves the event source alive.

```fx-marble
title: until stops when its named stop signal emits
covers: until
input events: draft . saved . later |
input stop: . . . stop |
operator: until(events, stop)
output: draft . saved | . .
```

`until(events, stop)` closes when the stop lane emits. Its control value never reaches output, and
its failure propagates because the signal owns stopping work.

```fx-marble
title: during forwards only while its named window is active
covers: during
input events: before . move . after . |
input drag: . down |
operator: during(events, drag)
inner stop: . ^ . . . up |
output: . . move . after | .
```

`during(events, starts)` uses the first start value as an inner stop Fx. Read the inner `up` token as
the end of that selected window. Signal failures propagate. For repeated drag windows carrying start
coordinates, use the explicit `switchMap`/`until` composition in [Time and rate](/explore/fx-time-and-rate).

A boolean chooses branch values rather than directly counting or gating source events:

```fx-marble
title: when selects a value for each spaced condition
covers: when
input condition: true . false |
operator: when(condition, { onTrue, onFalse })
output: . open . closed |
```

`when` selects the corresponding constant branch. Closely spaced conditions can replace a branch
before it emits, so this is not guaranteed one output per pushed boolean.

The import is finished when its terminal rule is met, even if the underlying listener could keep
producing. Its callback cleanup still needs a real subscription owner. Test an absent start signal,
an absent stop signal, and a signal failure as well as the happy path. A silent gate can remain live
forever; use [a timeout](/explore/fx-time-and-rate) only when the product defines a time limit.
For one optional answer instead of a bounded Fx, continue with [Fx.first](/explore/consuming-fx).
