---
title: "Derived, conditional, and accumulated state"
summary: "Turn a queue model into live queries while preserving absence, service requirements, and the distinction between state and event history."
section: "State"
kind: "guide"
order: 2.15
---

A review queue has an authoritative selection model. The toolbar needs a count, a detail pane needs
the focused issue, and an activity report might need accumulated events. All three are derived
questions, but they have different contracts. Treating every query as “just another ref” either
grants unnecessary write access or loses information about absence and history.

`Computed` and `Filtered` are read-only views over a Versioned source. They can be read as Effects
or observed as Fx; they do not create another writable truth. Start with
[state composition](/explore/composing-refsubject-state) for the owning model.

| View | Current read | Observation |
| --- | --- | --- |
| `Computed<A, E, R>` | A value, or E | Derived updates |
| `Filtered<A, E, R>` | A value, E, or `NoSuchElementError` | Present derived updates; absence is skipped |

The current read and observation are separate capabilities. This is central to both filtering and
accumulation: a convenient read-only type does not imply they have identical histories.

## Compute a value that always exists

A selected-ID array always has a length, including when it is empty. `map` is the appropriate query.

```ts
import { Effect } from "effect"
import { RefSubject } from "@typed/fx"

const example = Effect.scoped(Effect.gen(function* () {
  const selected = yield* RefSubject.make<ReadonlyArray<string>>([])
  const count = RefSubject.map(selected, (ids) => ids.length)
  const empty = RefSubject.map(count, (value) => value === 0)
  yield* RefSubject.set(selected, ["42", "43"])
  return { count: yield* count, empty: yield* empty }
}))
```

There is no `set(count, ...)`. The model changes selected IDs and the count stays derived. The
projection is lazy: creating the view does not run it. Current reads and observations apply it when
a value is needed. `proxy` is a convenience for memoized object/tuple field-view objects, not a cache
of copied field values. `makeComputed` supplies the same model for a lower-level Versioned source.

Prefer pure projection for formatting and totals. `mapEffect` can do effectful work, but it does not
by itself define a feature-wide shared request cache. If several consumers must share one remote
request, give that producer an owner and retain its AsyncData result once, then derive cheap views.

## Preserve loss of selection when the consumer needs it

The focused ID is optional. A command that requires an ID can use a Filtered. A pane that must clear
when focus is removed must observe both Some and None.

```ts
import { Effect, Option } from "effect"
import { RefSubject } from "@typed/fx"

const example = Effect.scoped(Effect.gen(function* () {
  const focusedId = yield* RefSubject.make(Option.none<string>())
  const present = RefSubject.compact(focusedId)
  const label = RefSubject.getOrElse(present, () => "No focused issue")
  const explicitAbsence = present.asComputed()
  yield* RefSubject.set(focusedId, Option.some("42"))
  const selectedLabel = yield* label
  yield* RefSubject.set(focusedId, Option.none())
  return { selectedLabel, emptyLabel: yield* label, current: yield* explicitAbsence }
}))
```

`compact` turns Option-valued state into a Filtered. `filterMap` does the same when a projection
may return None; `filterMapEffect` adds Effectful decision work. `asComputed()` exposes Option again,
while `getOrElse` publishes a meaningful fallback and removes only the absence failure.

If a loader observes only `present`, it sees `"42"` and no event for deselection. It therefore cannot
infer that its old request or output should disappear. Observe the Option-valued source at a
selection boundary and switch on both cases. This is not a renderer quirk: skipping an emission is
different from emitting an empty result in any reactive system.

`fromOption` and `fromNullable` are different operations: they construct writable Option state.
They do not introduce `NoSuchElementError` until you opt into a present-only view.

## Keep projection failures and services visible

An Effectful projection can add its own error and environment types. Those join the source's
channels rather than being swallowed. A service used only by the projection is required when the
read or observation runs, not when the view object is declared.

```ts
import { Context, Effect } from "effect"
import { RefSubject } from "@typed/fx"

class QueueLabels extends Context.Service<QueueLabels, {
  readonly selection: (count: number) => string
}>()("docs/QueueLabels") {}

const describeSelection = (count: number) =>
  Effect.map(QueueLabels, (labels) => labels.selection(count))

const example = Effect.scoped(Effect.gen(function* () {
  const count = yield* RefSubject.make(2)
  const label = RefSubject.mapEffect(count, describeSelection)
  return yield* label
})).pipe(Effect.provideService(QueueLabels, {
  selection: (count) => `${count} issues selected`,
}))
```

Here `label` requires QueueLabels until provision. A failing label service would add its expected
error to the view. Filtered additionally adds `NoSuchElementError` only to the current-read Effect;
its Fx does not fail merely because the projection returns None.

`computedFromService` and `filteredFromService` defer retrieving an entire view from Context. They
are useful when another subsystem owns it. Closing the relevant owner/observer Scopes ends active
work; a Computed is not a reason to create an unrelated permanent lifetime.

## Test observations independently from snapshots

A snapshot test reads the count, changes IDs, and reads it again. An observation test must actually
subscribe before the writes it expects to see. Synchronize on subscription readiness rather than
a fixed delay.

```ts
import { Effect, Fiber, Option } from "effect"
import { expect, it } from "vitest"
import { Fx, RefSubject } from "@typed/fx"

it("emits selections while skipping absence", () => Effect.scoped(Effect.gen(function* () {
  const source = yield* RefSubject.make<Option.Option<string>>(Option.none())
  const present = RefSubject.compact(source)
  const observed = yield* Effect.forkScoped(Fx.collectUpTo(present, 2))
  while ((yield* source.subscriberCount) < 1) yield* Effect.yieldNow
  yield* RefSubject.set(source, Option.some("42"))
  yield* RefSubject.set(source, Option.none())
  yield* RefSubject.set(source, Option.some("43"))
  expect(yield* Fiber.join(observed)).toEqual(["42", "43"])
})).pipe(Effect.runPromise))
```

This test demonstrates Filtered's omission, not just a successful selection. A pane-clearing test
would instead observe Option and assert None. Current-read tests should also cover absence and
projection errors. A passing DOM assertion after one selection cannot establish these contracts.

## Accumulate only when the intended history is clear

A count of currently selected issues is a map. It is not a scan: removing an issue should reduce
the count according to the current array. `scan` and `scanEffect` are for an accumulated query over
a source's history, and their current-read behavior needs special care.

```ts
import { Effect } from "effect"
import { RefSubject } from "@typed/fx"

const example = Effect.scoped(Effect.gen(function* () {
  const delta = yield* RefSubject.make(1)
  const total = RefSubject.scan(delta, 0, (sum, value) => sum + value)
  const firstRead = yield* total // 1
  const secondRead = yield* total // 1: the source version has not changed
  return { firstRead, secondRead }
}))
```

Current reads cache by source version within each Effect Context, so both reads return `1`.
The next read after a source version changes folds its current value into that Context's private
accumulator. Changes between reads are not an event history that sampling can recover.
The Fx channel instead emits the seed and folds observed values; observers in the same Context
share that active session. It remains separate from the current-read accumulator. `scanEffect`
leaves the read accumulator unchanged when its fold fails. Separate scan views and Contexts have
separate read accumulators.

Also, a RefSubject publishes distinct state commits. Writing the same delta `1` repeatedly may be
suppressed by equality, so a scan over that ref is not a reliable count of commands. Use an event
source for occurrences that all matter. If multiple readers must share exactly one accumulated
history, run that fold under one owner and retain its result, or expose a named writable transition
for the domain total.

These distinctions explain most derived-state surprises: stale output after absence, duplicated
remote work, and sampled totals that differ from observed history. Choose the question first, then select
Computed, Filtered, Option, or an owned event accumulator to match it. See
[AsyncData resources](/explore/async-data-requests-and-cache) for shared remote state and
[Subject events](/explore/subject-event-publications) for repeated occurrences.
