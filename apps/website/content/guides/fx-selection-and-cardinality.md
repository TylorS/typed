---
title: "Select values and bound cardinality"
summary: "Keep, omit, gate, and stop pushed values without confusing selection with cancellation policy."
section: "Fx"
kind: "guide"
order: 1.6
---

<span id="parse-useful-records-before-counting-them"></span>

Selection decides which pushed values reach a consumer and when its subscription stops. The
examples below demonstrate three independent choices: which values pass, how many accepted values
to keep, and whether to include the value that ends the run.

[Transforming Fx](/explore/transforming-fx) introduced zero-or-one output. Here we connect that choice
to how long the producer remains subscribed. A source can be active while every value is rejected;
“nothing visible” does not mean “nothing running.”

## Choose which values pass

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
original value should remain unchanged, use `filter`.

`filterEffect` makes the same admission decision with an Effect. Returning `false` omits one value;
failure reports a Cause instead. On a concurrent producer, Effectful checks may finish out of input
order. See [concurrency policies](/explore/fx-higher-order-and-concurrency) when order matters.

Operator order changes the count. For `blank, connected, indexing`, filtering blanks before `Fx.take(2)`
returns both useful messages. Taking two raw records before filtering returns only `connected`.
Choose whether the bound means “inspect two inputs” or “show two useful outputs.”

## Select the useful window

```ts
import { Fx } from "@typed/fx";

const window = Fx.fromIterable(["banner", "connected", "indexing", "complete", "ignored"]).pipe(
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

`dropAfter` includes the matching value before closing. Use it when the terminal record is part
of the result, rather than a control signal to discard.

The related prefix operators differ at the boundary:

| Operator | Values forwarded |
| --- | --- |
| `skipWhile` / `dropWhile` | Everything from the first false predicate result onward. |
| `dropUntil` | The first matching value and everything afterward. |
| `takeWhile` | Values before the first false predicate result. |

Effectful variants resolve their checks before applying the same boundary and add the checks' errors
and requirements. `skipWhileEffect` and `dropUntilEffect` still evaluate after their gate opens;
choose a pure predicate when later service calls would be unintended work. The
[operator atlas](/explore/fx-operator-atlas) compares these variants in detail.

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

An unopened `since` gate still runs its event source; an absent `until` signal cannot stop an
infinite source. Use [a timeout](/explore/fx-time-and-rate) when there is an actual time limit.

For a window with both a start and a stop, see `during` in the
[operator atlas](/explore/fx-operator-atlas). For one optional answer instead of a bounded Fx,
continue with [Fx.first](/explore/consuming-fx).
