---
title: "Derive transitions and bounded batches"
summary: "Carry only the local history a transform needs, then expose transitions, changes, and groups explicitly."
section: "Fx"
kind: "guide"
order: 1.3
---

A shipment import page needs a running balance, numbered progress messages, meaningful status
transitions, and small batches for persistence. One input alone cannot answer those questions.
Each needs a different piece of history—and retaining the entire import would be unnecessary.

After [Transforming Fx](/explore/transforming-fx), choose the smallest state that answers the page's
question. Every accumulator below belongs to one subscription. A second run starts fresh; none of
these operators creates shared writable application state.

## Display the initial balance and each adjustment

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
`12` produces `112`, `-4` produces `108`, and `7` produces `115`. This seed matters: the page can
show a balance before any input exists. A test that asserts only `115` misses the displayed history.

If computing the next balance needs an Effect, `scanEffect` exposes the same accumulated value
after its reducer completes:

```fx-marble
title: scanEffect emits each accumulated value when its reducer Effect resolves
covers: scanEffect
input: . 12 . -4 . 7 . |
operator: scanEffect(100, oneTurnAdd)
output: 100 . 112 . 108 . 115 |
```

The output moves one logical turn after each input because the illustrated reducer takes one turn.
The initial seed still appears first. Effectful reducers add their errors and required services;
failed computation is not a new balance.

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

```fx-marble
title: loopEffect emits after each one-turn state transition resolves
covers: loopEffect
input events: received . packed . shipped . |
input accumulator: 1 . 2 . 3 . .
operator: loopEffect(position, oneTurnLabel)
output labels: . 1.received . 2.packed . 3.shipped |
```

`loopEffect` separates the same two values after an Effect resolves. Do not assume every stateful
Effect operator serializes concurrent deliveries: the producer can overlap callback Effects. Use a
serialized input boundary when every transition must see the previous completed state.

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

```fx-marble
title: filterMapLoopEffect makes each zero-or-one decision after its Effect resolves
covers: filterMapLoopEffect
input: a . b . c . d . |
operator: filterMapLoopEffect(0, oneTurnEveryOther)
output: . 0:a . . . 2:c . . |
```

The Effect variant makes this zero-or-one decision after asynchronous work. It also does not serialize
concurrent input automatically. If multiple independent parts of the page must read and update one
current count, move that responsibility to RefSubject rather than observing the same loop twice.

## Highlight transitions rather than repeated reports

The import can report `received` several times without changing its status:

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
`skipRepeatsWith` with the fields whose changes matter to the page. Ignoring revision data can hide
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
create transitions containing duplicate statuses. This is why normalization and equivalence belong
before the transition the page highlights.

## Flush records without retaining the full import

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

## Adapt repeated failure reports only at a cause boundary

Most imports use ordinary value state above and [typed recovery](/explore/fx-errors-and-recovery).
A lower-level consumer may instead need to transform delivered Causes with private state. The
following diagrams show terminal-source examples; a Subject can deliver Causes repeatedly without
permanently closing itself.

```fx-marble
title: loopCause rewrites a terminal cause after passing earlier values through
covers: loopCause
input source: loaded . cached . !offline
operator: loopCause(0, prefix)
output source: loaded . cached . !n0:offline
```

`loopCause` passes successes through and transforms a Cause together with its next private state.

```fx-marble
title: loopCauseEffect forwards its transformed terminal cause when its Effect resolves
covers: loopCauseEffect
input source: loaded . cached . !offline .
operator: loopCauseEffect(0, oneTurnPrefix)
output source: loaded . cached . . !n0:offline
```

`loopCauseEffect` waits for its Effectful transformation before forwarding the Cause.

```fx-marble
title: filterMapLoopCause can suppress a terminal cause
covers: filterMapLoopCause
input source: loaded . cached . !offline
operator: filterMapLoopCause(0, suppress)
output source: loaded . cached . |
```

`filterMapLoopCause` can choose `None`, suppressing that Cause; in this terminal example the run then
completes normally. That is an error policy, not a harmless formatting change.

```fx-marble
title: filterMapLoopCauseEffect completes only after its one-turn suppression decision
covers: filterMapLoopCauseEffect
input source: loaded . cached . !offline .
operator: filterMapLoopCauseEffect(0, oneTurnSuppress)
output source: loaded . cached . . |
```

The Effect variant delays that decision and does not serialize concurrent Cause delivery. Use these
operations only when a boundary truly needs stateful failure handling; ordinary progress state should
not encode failures as artificial counter updates.

The page now has four deliberate histories: a seeded balance, a private position, one previous
status, and one bounded batch. Check those independently when behavior diverges. A missing first
transition may simply mean pairwise has only one value; a missing final batch may mean the source
never completed. [Time and rate](/explore/fx-time-and-rate) adds explicit clock boundaries, and
[Subject](/explore/subject-event-publications) explains publication state versus current readable state.
