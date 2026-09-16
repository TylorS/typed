---
title: "Carry local state through Fx"
summary: "Carry only the local history a transform needs, then expose transitions, changes, and groups explicitly."
section: "Fx"
kind: "guide"
order: 1.3
---

<span id="adapt-repeated-failure-reports-only-at-a-cause-boundary"></span>

A stateful transform retains history for one subscription: an accumulated value, a counter, the
previous value, or a bounded batch. A second subscription starts fresh. These operators do not
create shared writable application state.

After [Transforming Fx](/explore/transforming-fx), choose the smallest history needed for each
output. The independent examples below show what is retained and when it is emitted.

## Emit the accumulated value, including its seed

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const balances = Fx.fromIterable([12, -4, 7]).pipe(
  Fx.scan(100, (balance, adjustment) => balance + adjustment),
);

const values = await Effect.runPromise(Fx.collectAll(balances));

// [100, 112, 108, 115]
```

```fx-marble
title: scan emits its seed and every accumulated value
covers: scan
input: . 12 . -4 . 7 |
operator: scan(100, add)
output: 100 112 . 108 . 115 |
```

[`scan`](/reference/symbols/QHR5cGVkL2Z4L0Z4I3NjYW4) first emits its seed `100`. The adjustment
`12` produces `112`, `-4` produces `108`, and `7` produces `115`. The seed provides an initial
value before any input exists; collecting only the final `115` would discard that history.

## Produce a label while keeping the counter private

A progress label needs a position but should not expose that counter as its whole output:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const labels = Fx.fromIterable(["received", "packed", "shipped"]).pipe(
  Fx.loop(1, (position, event) => [`${position}. ${event}`, position + 1] as const),
);

const values = await Effect.runPromise(Fx.collectAll(labels));

// ["1. received", "2. packed", "3. shipped"]
```

```fx-marble
title: loop separates its private state from its one output per event
covers: loop
input events: received . packed . shipped |
input accumulator: 1 . 2 . 3 .
operator: loop(position, label)
output labels: 1.received . 2.packed . 3.shipped |
```

`loop` returns `[output, nextState]`. For `received`, state `1` produces `1.received` and stores `2`;
for `packed`, it produces `2.packed` and stores `3`. Unlike scan, it emits nothing before the first
input. The accumulator lane is explanatory private state, not another subscribed producer.

## Advance state even when a message is omitted

A progress display may deliberately report every other record while still counting all records.
`filterMapLoop` returns `[Option<output>, nextState]`; `None` suppresses output but stores next state:

```fx-marble
title: filterMapLoop can update state without emitting a value
covers: filterMapLoop
input: a . b . c . d |
operator: filterMapLoop(0, everyOther)
output: 0:a . . . 2:c . . |
```

`b` advances the position without producing a label, so `c` is labeled `2:c`, not `1:c`. Dropping `b`
before an ordinary loop would be a different count.

`scanEffect`, `loopEffect`, and `filterMapLoopEffect` compute their transitions with Effects.
Their outputs arrive after the transition resolves, and their errors and service requirements
become part of the Fx. They do not serialize concurrent input automatically: use a serialized
[work policy](/explore/fx-higher-order-and-concurrency) when every transition must see the previous
completed state. `scanEffect` still emits its seed first.

For several consumers that must read and update one current value, use
[RefSubject](/explore/refsubject-renderer-independent-state) rather than subscribing to the same
loop twice.

## Highlight transitions rather than repeated reports

Repeated reports do not necessarily represent a change:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const transitions = Fx.fromIterable(["received", "received", "packed", "packed", "shipped"]).pipe(
  Fx.skipRepeats,
  Fx.pairwise,
);

const values = await Effect.runPromise(Fx.collectAll(transitions));

// [["received", "packed"], ["packed", "shipped"]]
```

```fx-marble
title: skipRepeats removes only adjacent equivalents
covers: skipRepeats, skipRepeatsWith
input: received received packed packed shipped |
operator: skipRepeats / skipRepeatsWith(Eq)
output: received . packed . shipped |
```

`skipRepeats` compares with the last emitted value. It drops adjacent equivalents, not every value
seen previously: `received → packed → received` still emits all three. For records, use
`skipRepeatsWith` with the fields whose changes matter to the consumer. Ignoring revision data can hide
real updates; comparing fresh object identity can expose meaningless repeats.

```fx-marble
title: changesWithEffect waits for each equivalence check before deciding the next output
covers: changesWithEffect
input: received . received . packed . packed |
operator: changesWithEffect(sameStatus)
output: received . . . packed . . |
```

`changesWithEffect` performs that equivalence through an Effect and serializes its comparisons.
That specific guarantee is useful when comparison needs a service; it is not a guarantee shared by
all Effectful state transforms.

```fx-marble
title: pairwise waits for a prior value, then emits adjacent transitions
covers: pairwise
input: received . packed . shipped |
operator: pairwise
output: . . [received,packed] . [packed,shipped] |
```

`pairwise` waits for two accepted values, then emits `[previous, current]`. Filtering repeated status
before pairing yields `received → packed` and `packed → shipped`. Pairing raw reports first would
create transitions containing duplicate statuses. Put deduplication before pairing when only
actual changes should produce a transition.

## Retain one bounded batch

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const writes = Fx.fromIterable(["a", "b", "c", "d", "e"]).pipe(Fx.grouped(2));

const batches = await Effect.runPromise(Fx.collectAll(writes));

// [["a", "b"], ["c", "d"], ["e"]]
```

```fx-marble
title: grouped emits full batches and flushes the final partial batch
covers: grouped
input: a b c d e |
operator: grouped(2)
output: . [a,b] . [c,d] . [e] |
```

`grouped(2)` emits `[a,b]`, then `[c,d]`, then flushes `[e]` at normal completion. A batch bound must
be a positive safe integer. Test an empty input, an exact multiple of the bound, and one extra record;
the partial final batch is part of the contract, not an exceptional leftover.

For an open source, normal completion may be far away. Bound waiting time as well as count:

```fx-marble
title: groupedWithin flushes when its timer wins and again at source completion
covers: groupedWithin
input: a . . . c . |
operator: groupedWithin(3, 2 turns)
output: . . [a] . . . [c] |
```

`groupedWithin` flushes `a` when the timer wins and `c` when the source ends. The retained aggregation
buffer is one batch. That does not bound a downstream backlog of slow writes: use an explicit
[work policy](/explore/fx-higher-order-and-concurrency) and distinguish buffered records from queued
persistence jobs. The timer requires a scoped owner.

For time-based boundaries, continue with [Time and rate](/explore/fx-time-and-rate).
The [operator atlas](/explore/fx-operator-atlas) covers the full Effect and Cause variants of
these stateful transforms.
